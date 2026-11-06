import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { nftKeys } from '@/api/nfts'
import type { Cart } from '@/types/cart'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types/events'
import type { Nft, NftListResponse } from '@/types/nft'
import type { Order } from '@/types/order'

/** Aplica `nft.updated` nos caches de catálogo, detalhe e carrinho, sem regredir uma versão mais nova. */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const { resourceId, version, data } = event

  queryClient.setQueriesData<NftListResponse>({ queryKey: [...nftKeys.all, 'list'] }, (old) =>
    old && {
      ...old,
      items: old.items.map((item) =>
        item.id === resourceId && item.version < version ? { ...item, price: data.price, previousPrice: data.previousPrice, version } : item,
      ),
    },
  )

  queryClient.setQueryData<Nft>(nftKeys.detail(resourceId), (old) => (old && old.version < version ? { ...old, ...data, version } : old))

  // No carrinho, preço e total vêm da cotação da API: avisamos e buscamos de novo.
  const inCart = queryClient
    .getQueriesData<Cart>({ queryKey: ['cart'] })
    .flatMap(([, cart]) => cart?.items ?? [])
    .find((item) => item.nftId === resourceId)
  if (inCart) {
    toast.warning(`${inCart.nft.name}: preço ou disponibilidade foi atualizado.`, { id: `nft-${resourceId}` })
    queryClient.invalidateQueries({ queryKey: ['cart'] })
  }
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent) {
  const key = ['user', event.userId, 'order', event.resourceId]
  const previous = queryClient.getQueryData<Order>(key)
  if (previous && previous.version >= event.version) return
  queryClient.setQueryData<Order>(key, event.data)

  if (event.data.status === 'confirmed') {
    toast.success('Pagamento confirmado! Seu pedido foi concluído.', { id: `order-${event.resourceId}` })
    queryClient.invalidateQueries({ queryKey: ['cart'] })
  }
  if (event.data.status === 'declined') toast.error('Pagamento recusado. Seus itens continuam no carrinho.', { id: `order-${event.resourceId}` })
}
