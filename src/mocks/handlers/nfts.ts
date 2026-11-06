import { http } from 'msw'
import { fromWei, isEth, toWei } from '@/lib/eth'
import {
  CATEGORIES,
  NETWORKS,
  SORTS,
  TABS,
  type Nft,
  type NftListResponse,
  type NftSummary,
  type Sort,
} from '@/types/nft'
import { db } from '../db'
import { includes } from '@/lib/includes'
import { apiError, ok } from '../utils'

const PAGE_SIZE = 9
const NEW_SINCE = '2026-10-01'
const TRENDING_MIN_POPULARITY = 80

function byPrice(a: Nft, b: Nft) {
  const diff = toWei(a.price) - toWei(b.price)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

const comparators: Record<Sort, (a: Nft, b: Nft) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'price-asc': byPrice,
  'price-desc': (a, b) => byPrice(b, a),
  popular: (a, b) => b.popularity - a.popularity,
}

function toSummary({ id, name, image, price, previousPrice, category, network, version }: Nft): NftSummary {
  return { id, name, image, price, previousPrice, category, network, version }
}

function getFacets(): NftListResponse['facets'] {
  const prices = db.nfts.map((nft) => toWei(nft.price))
  const count = (key: 'category' | 'network', value: string) => db.nfts.filter((nft) => nft[key] === value).length

  return {
    categories: Object.fromEntries(CATEGORIES.map((c) => [c, count('category', c)])) as NftListResponse['facets']['categories'],
    networks: Object.fromEntries(NETWORKS.map((n) => [n, count('network', n)])) as NftListResponse['facets']['networks'],
    priceRange: {
      min: fromWei(prices.reduce((a, b) => (a < b ? a : b), prices[0] ?? 0n)),
      max: fromWei(prices.reduce((a, b) => (a > b ? a : b), prices[0] ?? 0n)),
    },
  }
}

export const nftHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')?.trim().toLowerCase() ?? ''
    const category = params.get('category')
    const network = params.get('network')
    const minPrice = params.get('minPrice')
    const maxPrice = params.get('maxPrice')
    const sort = params.get('sort') ?? 'recent'
    const tab = params.get('tab') ?? 'all'
    const collection = params.get('collection')
    const page = Number(params.get('page') ?? '1')

    if (
      (category && !includes(CATEGORIES, category)) ||
      (network && !includes(NETWORKS, network)) ||
      (minPrice && !isEth(minPrice)) ||
      (maxPrice && !isEth(maxPrice)) ||
      !includes(SORTS, sort) ||
      !includes(TABS, tab) ||
      !Number.isInteger(page) ||
      page < 1
    ) {
      return apiError(400, 'VALIDATION_ERROR', 'Parâmetros de busca inválidos.')
    }

    const matches = db.nfts
      .filter(
        (nft) =>
          nft.name.toLowerCase().includes(q) &&
          (!category || nft.category === category) &&
          (!network || nft.network === network) &&
          (!collection || nft.collection === collection) &&
          (!minPrice || toWei(nft.price) >= toWei(minPrice)) &&
          (!maxPrice || toWei(nft.price) <= toWei(maxPrice)) &&
          (tab !== 'new' || nft.createdAt >= NEW_SINCE) &&
          (tab !== 'trending' || nft.popularity >= TRENDING_MIN_POPULARITY),
      )
      .sort((a, b) => comparators[sort](a, b) || a.id.localeCompare(b.id))

    return ok<NftListResponse>({
      items: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toSummary),
      page,
      pageSize: PAGE_SIZE,
      total: matches.length,
      totalPages: Math.max(1, Math.ceil(matches.length / PAGE_SIZE)),
      facets: getFacets(),
    })
  }),

  http.get<{ id: string }>('/api/nfts/:id', async ({ params }) => {
    const nft = db.nfts.find((item) => item.id === params.id)
    return nft ? ok<Nft>(nft) : apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
  }),
]