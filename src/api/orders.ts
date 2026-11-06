import { queryOptions } from '@tanstack/react-query'
import type { CreateOrderInput, Order } from '@/types/order'
import { api } from './client'

export const orderQuery = (userId: string, id: string) =>
  queryOptions({
    queryKey: ['user', userId, 'order', id],
    queryFn: async ({ signal }) => (await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })).data,
    // Rede de segurança: enquanto pendente, confere a cada 4s mesmo se um evento se perder.
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4000 : false),
  })

export const createOrder = async ({ key, input }: { key: string; input: CreateOrderInput }) =>
  (await api.post<Order>('/orders', input, { headers: { 'Idempotency-Key': key } })).data

/**
 * A tentativa de compra fica salva até o pedido ser criado. Se a página recarregar
 * ou a resposta não chegar, reenviamos com a MESMA chave e a API devolve o mesmo pedido.
 */
const ATTEMPT_KEY = 'kurio-checkout-attempt'
export type CheckoutAttempt = { userId: string; key: string; input: CreateOrderInput }

export const checkoutAttempt = {
  read(userId: string): CheckoutAttempt | null {
    try {
      const attempt = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY) ?? 'null') as CheckoutAttempt | null
      return attempt?.userId === userId ? attempt : null
    } catch {
      return null
    }
  },
  save(attempt: CheckoutAttempt) {
    try {
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt))
    } catch {
      // Sem armazenamento: a proteção contra duplicidade continua valendo enquanto a página estiver aberta.
    }
  },
  clear: () => sessionStorage.removeItem(ATTEMPT_KEY),
}
