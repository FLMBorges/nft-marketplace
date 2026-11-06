import { http } from 'msw'
import { includes } from '@/lib/includes'
import { avatarSchema, fieldErrors, passwordChangeSchema, profileSchema, walletSchema } from '@/lib/schemas'
import { WALLET_SLOTS, type User, type Wallet } from '@/types/user'
import { hashPassword, requireUser, toPublicUser } from '../auth'
import { db, persist } from '../db'
import { scenario } from '../scenario'
import { apiError, ok, readJson } from '../utils'

const userWallets = (userId: string): Wallet[] =>
  db.wallets.filter((wallet) => wallet.userId === userId).map(({ userId: _owner, ...wallet }) => wallet)

export const accountHandlers = [
  http.get('/api/profile', ({ cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    return ok<User>(toPublicUser(user))
  }),

  http.put('/api/profile', async ({ request, cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    const parsed = profileSchema.safeParse(await readJson(request))
    if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Verifique os campos.', fieldErrors(parsed.error))
    if (db.users.some((item) => item.email === parsed.data.email && item.id !== user.id)) {
      return apiError(409, 'CONFLICT', 'Este e-mail já está em uso.', { email: 'Este e-mail já está em uso.' })
    }
    Object.assign(user, parsed.data)
    persist()
    return ok<User>(toPublicUser(user))
  }),

  http.put('/api/profile/avatar', async ({ request, cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    const parsed = avatarSchema.safeParse(await readJson(request))
    if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Imagem inválida.', fieldErrors(parsed.error))
    user.avatar = parsed.data.dataUrl
    persist()
    return ok<User>(toPublicUser(user))
  }),

  http.delete('/api/profile/avatar', ({ cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    user.avatar = null
    persist()
    return ok<User>(toPublicUser(user))
  }),

  http.put('/api/profile/password', async ({ request, cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    const parsed = passwordChangeSchema.safeParse(await readJson(request))
    if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Verifique os campos.', fieldErrors(parsed.error))
    if (user.passwordHash !== (await hashPassword(user.salt, parsed.data.currentPassword))) {
      return apiError(422, 'VALIDATION_ERROR', 'Senha atual incorreta.', { currentPassword: 'Senha atual incorreta.' })
    }
    user.salt = crypto.randomUUID().slice(0, 8)
    user.passwordHash = await hashPassword(user.salt, parsed.data.newPassword)
    persist()
    return ok({ ok: true })
  }),

  http.get('/api/wallets', ({ cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    return ok<Wallet[]>(userWallets(user.id))
  }),

  http.put<{ slot: string }>('/api/wallets/:slot', async ({ request, cookies, params }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    if (!includes(WALLET_SLOTS, params.slot)) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const parsed = walletSchema.safeParse(await readJson(request))
    if (!parsed.success) return apiError(422, 'VALIDATION_ERROR', 'Verifique os campos.', fieldErrors(parsed.error))

    const mine = db.wallets.filter((wallet) => wallet.userId === user.id)
    if (mine.some((wallet) => wallet.slot !== params.slot && wallet.address.toLowerCase() === parsed.data.address.toLowerCase())) {
      return apiError(409, 'CONFLICT', 'Este endereço já está cadastrado na outra carteira.', {
        address: 'Endereço já usado na outra carteira.',
      })
    }
    if (params.slot === 'secondary' && !mine.some((wallet) => wallet.slot === 'primary')) {
      return apiError(422, 'VALIDATION_ERROR', 'Cadastre a carteira principal primeiro.')
    }

    const existing = mine.find((wallet) => wallet.slot === params.slot)
    if (existing) Object.assign(existing, parsed.data)
    else db.wallets.push({ id: `wal_${crypto.randomUUID().slice(0, 8)}`, userId: user.id, slot: params.slot, ...parsed.data })
    persist()
    return ok<Wallet[]>(userWallets(user.id))
  }),

  /** Simula a extensão da carteira aprovando ou recusando a conexão, conforme o cenário. */
  http.post<{ id: string }>('/api/wallets/:id/connect', ({ cookies, params }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    if (!db.wallets.some((wallet) => wallet.id === params.id && wallet.userId === user.id)) {
      return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    }
    if (scenario.walletConnection === 'refuse') return apiError(422, 'WALLET_REFUSED', 'A conexão foi recusada na carteira.')
    return ok({ connected: true })
  }),
]
