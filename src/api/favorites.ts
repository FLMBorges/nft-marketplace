import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from './client'
import { useSession } from './session'

const favoritesKey = (userId: string) => ['user', userId, 'favorites'] as const

export function useFavorites() {
  const userId = useSession().data?.user.id
  return useQuery({
    queryKey: favoritesKey(userId ?? ''),
    queryFn: async ({ signal }) => (await api.get<string[]>('/favorites', { signal })).data,
    enabled: !!userId,
  })
}

/**
 * Atualização otimista: o coração muda na hora; se a API falhar, volta ao estado anterior.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const key = favoritesKey(useSession().data?.user.id ?? '')

  return useMutation({
    mutationFn: async ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      (favorite ? await api.put<string[]>(`/favorites/${nftId}`) : await api.delete<string[]>(`/favorites/${nftId}`)).data,
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key)
      queryClient.setQueryData<string[]>(key, (old = []) => (favorite ? [...old, nftId] : old.filter((id) => id !== nftId)))
      return { previous }
    },
    onError: (_error, { favorite }, context) => {
      queryClient.setQueryData(key, context?.previous)
      toast.error(favorite ? 'Não foi possível favoritar. Tente novamente.' : 'Não foi possível remover dos favoritos.')
    },
    onSuccess: (_list, { favorite }) => toast.success(favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
