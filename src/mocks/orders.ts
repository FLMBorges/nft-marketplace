import { fromWei, toWei } from '@/lib/eth'
import { db, findNft, persist, type DbOrder } from './db'
import { emitEvent, emitNftUpdated } from './realtime'
import { fnv1a } from './utils'

export const SETTLE_DELAY_MS = 2500
const timers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Resolve o pagamento simulado. Roda pelo timer e também ao consultar o pedido,
 * então um pedido pendente se resolve mesmo depois de recarregar a página.
 */
export function settleOrder(order: DbOrder) {
  if (order.status !== 'pending' || new Date(order.settleAt) > new Date()) return

  const shortage = order.items.find((item) => {
    const edition = findNft(item.nftId)?.editions.find((entry) => entry.type === item.edition)
    return !edition || edition.available < item.quantity
  })

  if (order.outcome === 'decline' || shortage) {
    order.status = 'declined'
    order.declineReason = shortage
      ? `A edição ${shortage.edition} de ${shortage.name} esgotou durante o processamento.`
      : 'O pagamento foi recusado pela carteira.'
  } else {
    order.status = 'confirmed'
    order.txHash = `0x${fnv1a(order.id).repeat(8)}`
    for (const item of order.items) {
      const nft = findNft(item.nftId)!
      nft.editions = nft.editions.map((entry) =>
        entry.type === item.edition ? { ...entry, available: entry.available - item.quantity } : entry,
      )
      nft.version += 1
      emitNftUpdated(nft)
    }
    // Remove do carrinho apenas o que foi comprado, na quantidade comprada.
    const cart = db.carts[`u:${order.userId}`]
    if (cart) {
      cart.lines = cart.lines
        .map((line) => {
          const bought = order.items.find((item) => item.nftId === line.nftId && item.edition === line.edition)
          return bought ? { ...line, quantity: line.quantity - bought.quantity } : line
        })
        .filter((line) => line.quantity > 0)
      if (!cart.lines.length) cart.coupon = null
    }
  }

  order.version += 1
  order.updatedAt = new Date().toISOString()
  persist()
  emitEvent({ type: 'order.updated', resourceId: order.id, version: order.version, userId: order.userId, data: toPublicOrder(order) })
}

export function scheduleSettlement(order: DbOrder) {
  if (order.status !== 'pending' || timers.has(order.id)) return
  const wait = Math.max(0, new Date(order.settleAt).getTime() - Date.now())
  timers.set(
    order.id,
    setTimeout(() => {
      timers.delete(order.id)
      settleOrder(order)
    }, wait),
  )
}

export const toPublicOrder = ({ idempotencyKey: _k, requestHash: _h, settleAt: _s, outcome: _o, ...order }: DbOrder) => order

export const sumWei = (values: string[]) => fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))

// Pedidos que ficaram pendentes quando a página fechou voltam a ser agendados.
db.orders.forEach(scheduleSettlement)
