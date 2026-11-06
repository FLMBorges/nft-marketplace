import { HttpResponse } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'

export function apiError(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string>) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message, fields } }, { status })
}