import type { Nft } from './nft'
import type { Order } from './order'

/** Todo evento tem identidade única (para descartar duplicatas) e a versão do recurso (para descartar antigos). */
type EventBase<TType extends string, TData> = {
  id: string
  type: TType
  resourceId: string
  version: number
  data: TData
}

export type NftUpdatedEvent = EventBase<'nft.updated', Pick<Nft, 'price' | 'previousPrice' | 'editions'>>
export type OrderUpdatedEvent = EventBase<'order.updated', Order> & { userId: string }
export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent
