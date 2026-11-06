import { http } from 'msw'
import { includes } from '@/lib/includes'
import type { Cart } from '@/types/cart'
import { EDITION_TYPES, NETWORKS, type Network } from '@/types/nft'
import { GUEST_COOKIE, guestCookie, lookupSession, SESSION_COOKIE } from '../auth'
import { findNft, persist } from '../db'
import { COUPONS } from '../fixtures/users'
import { buildCart, getCartRecord } from '../quote'
import { apiError, ok, readJson } from '../utils'

/**
 * Identifica o dono do carrinho: o usuário autenticado ou o visitante (cookie próprio).
 * Uma sessão expirada aqui não bloqueia: o visitante continua tendo carrinho.
 */
function resolveCartKey(cookies: Record<string, string>, createGuest: boolean) {
  const session = lookupSession(cookies[SESSION_COOKIE])
  if (session && 'user' in session) return { key: `u:${session.user.id}` }
  if (cookies[GUEST_COOKIE]) return { key: `g:${cookies[GUEST_COOKIE]}` }
  if (!createGuest) return { key: null }
  const guestId = crypto.randomUUID()
  return { key: `g:${guestId}`, setCookie: guestCookie(guestId) }
}

const networkOf = (request: Request): Network => {
  const network = new URL(request.url).searchParams.get('network')
  return includes(NETWORKS, network) ? network : 'ethereum'
}

const EMPTY = (network: Network): Cart => ({
  items: [],
  quote: { signature: 'empty', network, subtotal: '0', discount: '0', networkFee: '0', total: '0', coupon: null, issues: [] },
})

function respond(key: string, request: Request, setCookie?: string, status = 200) {
  persist()
  return ok<Cart>(buildCart(key, networkOf(request)), { status, headers: setCookie ? { 'Set-Cookie': setCookie } : undefined })
}

type ItemBody = { nftId?: unknown; edition?: unknown; quantity?: unknown }

function validateItem(body: ItemBody | null, minQuantity: number) {
  const nft = typeof body?.nftId === 'string' ? findNft(body.nftId) : undefined
  if (!nft) return { error: apiError(404, 'NOT_FOUND', 'NFT não encontrado.') }
  if (!includes(EDITION_TYPES, body?.edition)) return { error: apiError(422, 'VALIDATION_ERROR', 'Edição inválida.') }
  const quantity = Number(body?.quantity)
  if (!Number.isInteger(quantity) || quantity < minQuantity) {
    return { error: apiError(422, 'VALIDATION_ERROR', 'Quantidade inválida.', { quantity: 'Use um número inteiro.' }) }
  }
  const edition = nft.editions.find((item) => item.type === body?.edition)
  return { nft, edition: body!.edition as (typeof EDITION_TYPES)[number], quantity, available: edition?.available ?? 0, offered: !!edition }
}

export const cartHandlers = [
  http.get('/api/cart', ({ request, cookies }) => {
    const { key } = resolveCartKey(cookies, false)
    return key ? respond(key, request) : ok<Cart>(EMPTY(networkOf(request)))
  }),

  http.post('/api/cart/items', async ({ request, cookies }) => {
    const item = validateItem((await readJson(request)) as ItemBody | null, 1)
    if ('error' in item) return item.error
    if (!item.offered) return apiError(409, 'OUT_OF_STOCK', 'Esta edição não está disponível para este NFT.')

    const { key, setCookie } = resolveCartKey(cookies, true)
    const record = getCartRecord(key!)
    const line = record.lines.find((entry) => entry.nftId === item.nft.id && entry.edition === item.edition)
    const total = (line?.quantity ?? 0) + item.quantity
    if (total > item.available) {
      return apiError(409, 'OUT_OF_STOCK', `Apenas ${item.available} unidade(s) disponível(is) nesta edição.`, {
        quantity: `Máximo disponível: ${item.available}.`,
      })
    }
    if (line) line.quantity = total
    else record.lines.push({ nftId: item.nft.id, edition: item.edition, quantity: item.quantity })
    return respond(key!, request, setCookie, 201)
  }),

  http.patch('/api/cart/items', async ({ request, cookies }) => {
    const item = validateItem((await readJson(request)) as ItemBody | null, 0)
    if ('error' in item) return item.error
    const { key } = resolveCartKey(cookies, false)
    const record = key ? getCartRecord(key) : null
    const line = record?.lines.find((entry) => entry.nftId === item.nft.id && entry.edition === item.edition)
    if (!record || !line) return apiError(404, 'NOT_FOUND', 'Item não está no carrinho.')
    if (item.quantity > item.available) {
      return apiError(409, 'OUT_OF_STOCK', `Apenas ${item.available} unidade(s) disponível(is) nesta edição.`)
    }
    if (item.quantity === 0) record.lines = record.lines.filter((entry) => entry !== line)
    else line.quantity = item.quantity
    return respond(key!, request)
  }),

  http.delete('/api/cart/items', ({ request, cookies }) => {
    const params = new URL(request.url).searchParams
    const { key } = resolveCartKey(cookies, false)
    if (!key) return ok<Cart>(EMPTY(networkOf(request)))
    const record = getCartRecord(key)
    record.lines = record.lines.filter((entry) => !(entry.nftId === params.get('nftId') && entry.edition === params.get('edition')))
    return respond(key, request)
  }),

  http.put('/api/cart/coupon', async ({ request, cookies }) => {
    const body = (await readJson(request)) as { code?: unknown } | null
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
    const coupon = COUPONS[code]
    if (!coupon) return apiError(422, 'COUPON_INVALID', 'Cupom inválido.', { code: 'Cupom inválido.' })
    if (coupon.expired) return apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: 'Este cupom expirou.' })
    const { key, setCookie } = resolveCartKey(cookies, true)
    getCartRecord(key!).coupon = code
    return respond(key!, request, setCookie)
  }),

  http.delete('/api/cart/coupon', ({ request, cookies }) => {
    const { key } = resolveCartKey(cookies, false)
    if (!key) return ok<Cart>(EMPTY(networkOf(request)))
    getCartRecord(key).coupon = null
    return respond(key, request)
  }),
]
