import { http } from 'msw'
import { requireUser } from '../auth'
import { db, findNft, persist } from '../db'
import { apiError, ok } from '../utils'

export const favoriteHandlers = [
  http.get('/api/favorites', ({ cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    return ok<string[]>(db.favorites[user.id] ?? [])
  }),

  http.put<{ nftId: string }>('/api/favorites/:nftId', ({ cookies, params }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    if (!findNft(params.nftId)) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    const list = (db.favorites[user.id] ??= [])
    if (!list.includes(params.nftId)) list.push(params.nftId)
    persist()
    return ok<string[]>(list)
  }),

  http.delete<{ nftId: string }>('/api/favorites/:nftId', ({ cookies, params }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
    persist()
    return ok<string[]>(db.favorites[user.id])
  }),
]
