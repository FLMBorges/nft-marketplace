import { fromWei, toWei } from '@/lib/eth'
import type { Cart, CartItem, QuoteIssue } from '@/types/cart'
import type { Network, Nft } from '@/types/nft'
import { db, findNft } from './db'
import { COUPONS } from './fixtures/users'
import { fnv1a } from './utils'

export const NETWORK_FEES: Record<Network, string> = { ethereum: '0.004', polygon: '0.0008', solana: '0.0002' }

export const getCartRecord = (key: string) => (db.carts[key] ??= { lines: [], coupon: null })

const toSummary = ({ id, name, image, price, previousPrice, category, network, version }: Nft) => ({
  id,
  name,
  image,
  price,
  previousPrice,
  category,
  network,
  version,
})

/** Monta o carrinho com a cotação. Todas as contas em wei (bigint): sem erro de arredondamento. */
export function buildCart(key: string, network: Network): Cart {
  const record = getCartRecord(key)
  const issues: QuoteIssue[] = []
  const items: CartItem[] = []

  for (const line of record.lines) {
    const nft = findNft(line.nftId)
    if (!nft) continue
    const available = nft.editions.find((edition) => edition.type === line.edition)?.available ?? 0
    if (available === 0) issues.push({ nftId: nft.id, edition: line.edition, reason: 'unavailable' })
    else if (line.quantity > available) issues.push({ nftId: nft.id, edition: line.edition, reason: 'insufficient' })
    items.push({
      ...line,
      available,
      unitPrice: nft.price,
      lineTotal: fromWei(toWei(nft.price) * BigInt(line.quantity)),
      nft: toSummary(nft),
    })
  }

  const subtotal = items.reduce((sum, item) => sum + toWei(item.lineTotal), 0n)
  const coupon = record.coupon ? { code: record.coupon, percent: COUPONS[record.coupon].percent } : null
  const discount = coupon ? (subtotal * BigInt(coupon.percent)) / 100n : 0n
  const fee = items.length ? toWei(NETWORK_FEES[network]) : 0n
  const quote = {
    network,
    subtotal: fromWei(subtotal),
    discount: fromWei(discount),
    networkFee: fromWei(fee),
    total: fromWei(subtotal - discount + fee),
    coupon,
    issues,
  }
  const signature = fnv1a(JSON.stringify([items.map((item) => [item.nftId, item.edition, item.quantity, item.unitPrice]), quote]))

  return { items, quote: { ...quote, signature } }
}
