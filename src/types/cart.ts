import type { EditionType, Network, NftSummary } from './nft'

export type CartItem = {
  nftId: string
  edition: EditionType
  quantity: number
  /** Disponibilidade atual da edição (pode ser menor que `quantity` se mudou depois de adicionar). */
  available: number
  unitPrice: string
  lineTotal: string
  nft: NftSummary
}

export type QuoteIssue = {
  nftId: string
  edition: EditionType
  reason: 'unavailable' | 'insufficient'
}

/** Cotação calculada pela API. É a referência para finalizar o pedido. */
export type Quote = {
  /** Identifica esta combinação exata de itens, preços, cupom e taxa. Muda se qualquer valor mudar. */
  signature: string
  network: Network
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon: { code: string; percent: number } | null
  issues: QuoteIssue[]
}

export type Cart = {
  items: CartItem[]
  quote: Quote
}

export type AddCartItemInput = { nftId: string; edition: EditionType; quantity: number }
