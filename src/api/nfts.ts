import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import type { Nft, NftListParams, NftListResponse } from '@/types/nft'
import { api } from './client'

export const nftKeys = {
  all: ['nfts'] as const,
  list: (params: NftListParams) => [...nftKeys.all, 'list', params] as const,
  detail: (id: string) => [...nftKeys.all, 'detail', id] as const,
}

export const nftListQuery = (params: NftListParams) =>
  queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: async ({ signal }) => (await api.get<NftListResponse>('/nfts', { params, signal })).data,
    placeholderData: keepPreviousData,
  })

export const nftQuery = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: async ({ signal }) => (await api.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
  })