import { http } from 'msw'
import { includes } from '@/lib/includes'
import { buyerSchema, fieldErrors } from '@/lib/schemas'
import { NETWORKS } from '@/types/nft'
import type { Order } from '@/types/order'
import { requireUser } from '../auth'
import { db, persist, type DbOrder } from '../db'
import { scheduleSettlement, settleOrder, SETTLE_DELAY_MS, toPublicOrder } from '../orders'
import { buildCart } from '../quote'
import { lateDelay, lateResponses, scenario } from '../scenario'
import { apiError, fnv1a, ok, readJson } from '../utils'

type OrderBody = { quoteSignature?: unknown; network?: unknown; walletId?: unknown; buyer?: unknown }

export const orderHandlers = [
  http.post('/api/orders', async ({ request, cookies }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user

    const key = request.headers.get('Idempotency-Key')
    if (!key || key.length < 16) return apiError(400, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key obrigatório.')

    const raw = await readJson(request)
    const body = (raw ?? {}) as OrderBody
    const requestHash = fnv1a(JSON.stringify(raw))

    // Mesma chave: mesma tentativa. Devolve o pedido já criado em vez de cobrar de novo.
    const existing = db.orders.find((order) => order.userId === user.id && order.idempotencyKey === key)
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada para um pedido diferente.')
      }
      settleOrder(existing)
      return ok<Order>(toPublicOrder(existing))
    }

    const buyer = buyerSchema.safeParse(body.buyer)
    if (!buyer.success) return apiError(422, 'VALIDATION_ERROR', 'Verifique os dados do colecionador.', fieldErrors(buyer.error))
    if (!includes(NETWORKS, body.network)) return apiError(422, 'VALIDATION_ERROR', 'Rede inválida.')
    const wallet = db.wallets.find((item) => item.id === body.walletId && item.userId === user.id)
    if (!wallet) return apiError(422, 'VALIDATION_ERROR', 'Selecione uma carteira cadastrada.', { walletId: 'Selecione uma carteira.' })
    if (wallet.network !== body.network) {
      return apiError(422, 'VALIDATION_ERROR', 'A carteira escolhida não opera nesta rede.', { network: 'Rede incompatível com a carteira.' })
    }

    // Revalida tudo no servidor: preços, disponibilidade, cupom e taxa.
    const cart = buildCart(`u:${user.id}`, body.network)
    if (!cart.items.length) return apiError(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
    if (cart.quote.issues.length) {
      return apiError(409, 'OUT_OF_STOCK', 'Alguns itens não estão mais disponíveis na quantidade escolhida.')
    }
    if (cart.quote.signature !== body.quoteSignature) {
      return apiError(409, 'QUOTE_CHANGED', 'Os valores do pedido mudaram. Revise e confirme novamente.')
    }

    const now = new Date()
    const order: DbOrder = {
      id: `ord_${crypto.randomUUID().slice(0, 12)}`,
      userId: user.id,
      status: 'pending',
      version: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      items: cart.items.map((item) => ({
        nftId: item.nftId,
        name: item.nft.name,
        image: item.nft.image,
        edition: item.edition,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotal: cart.quote.subtotal,
      discount: cart.quote.discount,
      networkFee: cart.quote.networkFee,
      total: cart.quote.total,
      coupon: cart.quote.coupon,
      network: body.network,
      wallet: { label: wallet.label, address: wallet.address },
      buyer: buyer.data,
      txHash: null,
      declineReason: null,
      idempotencyKey: key,
      requestHash,
      settleAt: new Date(now.getTime() + SETTLE_DELAY_MS).toISOString(),
      outcome: scenario.payment,
    }
    db.orders.push(order)
    persist()
    scheduleSettlement(order)

    // Cenário "timeout após criação": o pedido existe, mas a resposta chega tarde demais para o cliente.
    if (lateResponses.delete('orders.create')) await lateDelay()
    return ok<Order>(toPublicOrder(order), { status: 201 })
  }),

  http.get<{ id: string }>('/api/orders/:id', ({ cookies, params }) => {
    const user = requireUser(cookies)
    if (user instanceof Response) return user
    // Pedido de outro usuário responde 404, sem revelar que ele existe.
    const order = db.orders.find((item) => item.id === params.id && item.userId === user.id)
    if (!order) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
    settleOrder(order)
    return ok<Order>(toPublicOrder(order))
  }),
]
