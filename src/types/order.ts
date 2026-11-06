import type { EditionType, Network } from './nft'

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Snapshot do pedido: valores copiados no momento da compra, não mudam se o catálogo mudar. */
export type Order = {
  id: string
  userId: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  items: {
    nftId: string
    name: string
    image: string
    edition: EditionType
    quantity: number
    unitPrice: string
    lineTotal: string
  }[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon: { code: string; percent: number } | null
  network: Network
  wallet: { label: string; address: string }
  buyer: { name: string; email: string }
  /** Referência simulada da transação. Só existe para pedido confirmado. */
  txHash: string | null
  declineReason: string | null
}

export type CreateOrderInput = {
  quoteSignature: string
  network: Network
  walletId: string
  buyer: { name: string; email: string }
}
