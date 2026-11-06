import { QueryClient } from '@tanstack/react-query'
import { isTransient } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Repete só falhas temporárias, no máximo 2 vezes. Um 404 ou 422 daria o mesmo erro de novo.
      retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    },
  },
})

/** Remove do cache tudo que pertence ao usuário. Usado no logout, na troca de usuário e na sessão expirada. */
export function clearPrivateData() {
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['cart'] })
  queryClient.setQueryData(['session'], null)
}
