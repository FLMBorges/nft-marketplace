import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AddCartItemInput, Cart } from '@/types/cart'
import type { EditionType, Network } from '@/types/nft'
import { api } from './client'
import { useSession } from './session'

/** O carrinho é isolado por dono (usuário ou visitante) e pela rede usada na cotação. */
export const cartQuery = (owner: string, network: Network) =>
  queryOptions({
    queryKey: ['cart', owner, network],
    queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { params: { network }, signal })).data,
  })

export function useCart(network: Network = 'ethereum') {
  const { data: session, isPending } = useSession()
  return useQuery({ ...cartQuery(session?.user.id ?? 'guest', network), enabled: !isPending })
}

/** Toda mutation do carrinho devolve o carrinho inteiro: grava no cache e invalida as outras redes. */
export function useCartMutation<TVariables>(request: (variables: TVariables) => Promise<{ data: Cart }>) {
  const queryClient = useQueryClient()
  const owner = useSession().data?.user.id ?? 'guest'
  return useMutation({
    mutationFn: async (variables: TVariables) => (await request(variables)).data,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQuery(owner, cart.quote.network).queryKey, cart)
      queryClient.invalidateQueries({ queryKey: ['cart', owner], refetchType: 'none' })
    },
  })
}

export const addCartItem = (input: AddCartItemInput) => api.post<Cart>('/cart/items', input)
export const updateCartItem = (input: AddCartItemInput) => api.patch<Cart>('/cart/items', input)
export const removeCartItem = (input: { nftId: string; edition: EditionType }) => api.delete<Cart>('/cart/items', { params: input })
export const applyCoupon = (code: string) => api.put<Cart>('/cart/coupon', { code })
export const removeCoupon = () => api.delete<Cart>('/cart/coupon')
