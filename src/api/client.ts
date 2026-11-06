import axios, { isAxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/api'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

export const SESSION_EXPIRED_EVENT = 'kurio:session-expired'

/** Extrai o erro no formato do contrato, se a resposta tiver um. */
export function getApiError(error: unknown): ApiErrorBody['error'] | null {
  if (!isAxiosError<ApiErrorBody>(error)) return null
  return error.response?.data?.error ?? null
}

/** Falha temporária: sem resposta (rede/timeout) ou erro 5xx. Repetir um 4xx daria o mesmo erro. */
export const isTransient = (error: unknown) => isAxiosError(error) && (!error.response || error.response.status >= 500)

/** Mensagem amigável para qualquer erro, priorizando a mensagem da API. */
export function errorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.') {
  if (getApiError(error)) return getApiError(error)!.message
  if (isAxiosError(error) && !error.response) return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
  return fallback
}

// Sessão expirada em qualquer chamada: avisa a aplicação, que limpa os dados privados e leva ao login.
api.interceptors.response.use(undefined, (error) => {
  if (getApiError(error)?.code === 'SESSION_EXPIRED') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  return Promise.reject(error)
})
