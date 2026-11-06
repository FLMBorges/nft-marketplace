import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

/** Falha temporária: sem resposta (rede/timeout) ou erro 5xx. Repetir um 4xx daria o mesmo erro. */
const isTransient = (error: unknown) => isAxiosError(error) && (!error.response || error.response.status >= 500)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    },
  },
})