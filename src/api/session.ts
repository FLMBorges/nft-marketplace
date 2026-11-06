import { queryOptions, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { Session } from '@/types/user'
import { api } from './client'

export const sessionQuery = queryOptions({
  queryKey: ['session'],
  queryFn: async ({ signal }) => {
    try {
      return (await api.get<Session | null>('/auth/session', { signal })).data
    } catch (error) {
      // Sessão expirada (401) também significa "visitante" daqui para frente.
      if (isAxiosError(error) && error.response?.status === 401) return null
      throw error
    }
  },
  staleTime: 60_000,
})

export const useSession = () => useQuery(sessionQuery)

export const login = async (body: { email: string; password: string }) => (await api.post<Session>('/auth/login', body)).data
export const register = async (body: Record<string, string>) => (await api.post<Session>('/auth/register', body)).data
export const logout = () => api.post('/auth/logout')
