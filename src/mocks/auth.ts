import type { User } from '@/types/user'
import { db, persist } from './db'
import type { DbUser } from './fixtures/users'
import { apiError } from './utils'

export const SESSION_COOKIE = 'kurio_session'
export const GUEST_COOKIE = 'kurio_guest'
const SESSION_MINUTES = 30

/** Num backend real o cookie seria `HttpOnly; Secure`. O navegador não aceita HttpOnly vindo de um mock (ver ARCHITECTURE.md). */
export const sessionCookie = (token: string) => `${SESSION_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=${SESSION_MINUTES * 60}`
export const clearSessionCookie = () => `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`
export const guestCookie = (id: string) => `${GUEST_COOKIE}=${id}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`

export async function hashPassword(salt: string, password: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

export const toPublicUser = ({ id, name, email, phone, avatar }: DbUser): User => ({ id, name, email, phone, avatar })

export function createSession(userId: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString()
  db.sessions.push({ token, userId, expiresAt })
  persist()
  return { token, expiresAt }
}

type SessionLookup = { user: DbUser; expiresAt: string } | { expired: true } | null

export function lookupSession(token: string | undefined): SessionLookup {
  const session = token ? db.sessions.find((item) => item.token === token) : undefined
  if (!session) return null
  // A sessão expirada continua registrada: toda chamada com aquele cookie responde "expirada" (não "sem login").
  if (new Date(session.expiresAt) <= new Date()) return { expired: true }
  const user = db.users.find((item) => item.id === session.userId)
  if (!user) return null
  // Sessão deslizante: cada uso renova o prazo.
  session.expiresAt = new Date(Date.now() + SESSION_MINUTES * 60_000).toISOString()
  return { user, expiresAt: session.expiresAt }
}

/** Devolve o usuário autenticado ou a resposta 401 que o handler deve retornar. */
export function requireUser(cookies: Record<string, string>) {
  const session = lookupSession(cookies[SESSION_COOKIE])
  if (session && 'user' in session) return session.user
  return session
    ? apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
    : apiError(401, 'UNAUTHORIZED', 'Entre na sua conta para continuar.')
}

/** Usado pelo servidor de eventos, que roda na mesma página e não recebe cookies na conexão. */
export function currentUserIdFromDocument() {
  const token = document.cookie
    .split('; ')
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split('=')[1]
  const session = lookupSession(token)
  return session && 'user' in session ? session.user.id : null
}
