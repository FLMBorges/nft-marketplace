export const CATEGORIES = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const
export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export const EDITION_TYPES = ['1/1', '1/10', '1/50', 'open'] as const
export const SORTS = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export const TABS = ['all', 'new', 'trending'] as const

export type Category = (typeof CATEGORIES)[number]
export type Network = (typeof NETWORKS)[number]
export type EditionType = (typeof EDITION_TYPES)[number]
export type Sort = (typeof SORTS)[number]
export type Tab = (typeof TABS)[number]

export type Edition = {
  type: EditionType
  available: number
}

/** Versão resumida, usada nos cards do catálogo. Valores em ETH são strings decimais. */
export type NftSummary = {
  id: string
  name: string
  image: string
  price: string
  previousPrice: string | null
  category: Category
  network: Network
  version: number
}

export type Nft = NftSummary & {
  images: string[]
  description: string
  details: string
  tokenId: string
  collection: string
  attributes: string[]
  editions: Edition[]
  contractAddress: string
  royaltyPercent: number
  rating: number
  reviewCount: number
  popularity: number
  createdAt: string
}

export type NftListParams = {
  q?: string
  category?: Category
  network?: Network
  minPrice?: string
  maxPrice?: string
  sort?: Sort
  tab?: Tab
  page?: number
}

export type NftListResponse = {
  items: NftSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: {
    categories: Record<Category, number>
    networks: Record<Network, number>
    priceRange: { min: string; max: string }
  }
}