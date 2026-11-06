export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAVAILABLE'

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
    fields?: Record<string, string>
  }
}