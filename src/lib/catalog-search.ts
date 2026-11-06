import {
  CATEGORIES,
  NETWORKS,
  SORTS,
  TABS,
  type Category,
  type Network,
  type NftListParams,
  type Sort,
  type Tab,
} from '@/types/nft'
import { includes } from './includes'

/** Estado do catálogo guardado na URL. */
export type CatalogSearch = {
  q?: string
  category?: Category
  network?: Network
  minPrice?: number
  maxPrice?: number
  sort: Sort
  tab: Tab
  page: number
}

/** Valores padrão: não aparecem na URL. */
export const DEFAULT_CATALOG_SEARCH = { sort: 'recent', tab: 'all', page: 1 } satisfies Partial<CatalogSearch>

const isPrimitive = (value: unknown) => typeof value === 'string' || typeof value === 'number'

export const parseText = (value: unknown) => (isPrimitive(value) && String(value).trim()) || undefined

export const parsePrice = (value: unknown) =>
  isPrimitive(value) && value !== '' && Number(value) >= 0 ? Number(value) : undefined

/** Aceita qualquer coisa vinda da URL e devolve um estado válido, descartando o que for inválido. */
export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const page = Number(search.page)

  return {
    q: parseText(search.q),
    category: includes(CATEGORIES, search.category) ? search.category : undefined,
    network: includes(NETWORKS, search.network) ? search.network : undefined,
    minPrice: parsePrice(search.minPrice),
    maxPrice: parsePrice(search.maxPrice),
    sort: includes(SORTS, search.sort) ? search.sort : DEFAULT_CATALOG_SEARCH.sort,
    tab: includes(TABS, search.tab) ? search.tab : DEFAULT_CATALOG_SEARCH.tab,
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_CATALOG_SEARCH.page,
  }
}

/** Converte o estado da URL nos parâmetros da API (preços viajam como texto). */
export const toApiParams = ({ minPrice, maxPrice, ...rest }: CatalogSearch): NftListParams => ({
  ...rest,
  minPrice: minPrice?.toFixed(2),
  maxPrice: maxPrice?.toFixed(2),
})