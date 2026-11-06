import { http } from 'msw'
import { fieldErrors, loginSchema, registerSchema } from '@/lib/schemas'
import type { Session } from '@/types/user'
import {
  clearSessionCookie,
  createSession,
  GUEST_COOKIE,
  hashPassword,
  lookupSession,
  SESSION_COOKIE,
  sessionCookie,
  toPublicUser,
} from '../auth'
import { db, persist } from '../db'
import { apiError, ok, readJson } from '../utils'

/** Ao autenticar, os itens do carrinho do visitante passam para o carrinho do usuário. */
function mergeGuestCart(guestId: string | undefined, userId: string) {
  const guest = guestId ? db.carts[`g:${guestId}`] : undefined
  if (!guest?.lines.length) return
  const target = (db.carts[`u:${userId}`] ??= { lines: [], coupon: null })
  for (const line of guest.lines) {
    const existing = target.lines.find((item) => item.nftId === line.nftId && item.edition === line.edition)
    if (existing) existing.quantity += line.quantity
    else target.lines.push({ ...line })
  }
  target.coupon ??= guest.coupon
  delete db.carts[`g:${guestId}`]
}

function startSession(userId: string, guestId: string | undefined, status = 200) {
  mergeGuestCart(guestId, userId)
  const { token, expiresAt } = createSession(userId)
  const user = db.users.find((item) => item.id === userId)!
  return ok<Session>({ user: toPublicUser(user), expiresAt }, { status, headers: { 'Set-Cookie': sessionCookie(token) } })
}

export const authHandlers = [
  http.get('/api/auth/session', ({ cookies }) => {
    const session = lookupSession(cookies[SESSION_COOKIE])
    // Visitante não é erro: responde 200 com `null` (evita erro no console e na auditoria do Lighthouse).
    if (!session) return ok<Session | null>(null)
    if ('expired' in session) return apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
    persist()
    return ok<Session>({ user: toPublicUser(session.user), expiresAt: session.expiresAt })
  }),

  http.post('/api/auth/login', async ({ request, cookies }) => {
    const parsed = loginSchema.safeParse(await readJson(request))
    if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Verifique os campos.', fieldErrors(parsed.error))

    const user = db.users.find((item) => item.email === parsed.data.email)
    // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails estão cadastrados.
    if (!user || user.passwordHash !== (await hashPassword(user.salt, parsed.data.password))) {
      return apiError(401, 'UNAUTHORIZED', 'E-mail ou senha incorretos.')
    }
    return startSession(user.id, cookies[GUEST_COOKIE])
  }),

  http.post('/api/auth/register', async ({ request, cookies }) => {
    const parsed = registerSchema.safeParse(await readJson(request))
    if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Verifique os campos.', fieldErrors(parsed.error))
    if (db.users.some((item) => item.email === parsed.data.email)) {
      return apiError(409, 'CONFLICT', 'Este e-mail já está cadastrado.', { email: 'Este e-mail já está cadastrado.' })
    }

    const salt = crypto.randomUUID().slice(0, 8)
    const id = `usr_${crypto.randomUUID().slice(0, 8)}`
    db.users.push({
      id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: '',
      avatar: null,
      salt,
      passwordHash: await hashPassword(salt, parsed.data.password),
    })
    return startSession(id, cookies[GUEST_COOKIE], 201)
  }),

  http.post('/api/auth/logout', ({ cookies }) => {
    db.sessions = db.sessions.filter((item) => item.token !== cookies[SESSION_COOKIE])
    persist()
    return ok({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } })
  }),
]
