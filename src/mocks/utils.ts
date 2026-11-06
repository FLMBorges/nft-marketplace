import { HttpResponse, type DefaultBodyType } from 'msw'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'

/** Resposta JSON tipada pelo contrato, mas com o mesmo tipo de retorno de `apiError` (os handlers devolvem os dois). */
export const ok = <T>(body: T, init?: ResponseInit) => HttpResponse.json(body as DefaultBodyType, init)

export function apiError(status: number, code: ApiErrorCode, message: string, fields?: Record<string, string>) {
  return ok<ApiErrorBody>({ error: { code, message, fields } }, { status })
}

/** Hash FNV-1a: curto e determinístico. Serve para assinaturas de cotação, não para segurança. */
export function fnv1a(text: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** Lê e valida o corpo JSON. Corpo inválido vira `null` e o handler responde 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
