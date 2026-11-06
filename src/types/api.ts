export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'OUT_OF_STOCK'
  | 'QUOTE_CHANGED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'COUPON_INVALID'
  | 'COUPON_EXPIRED'
  | 'WALLET_REFUSED'
  | 'UNAVAILABLE'

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
    /** Erros por campo de formulário, como `{ email: 'E-mail já cadastrado.' }`. */
    fields?: Record<string, string>
  }
}
