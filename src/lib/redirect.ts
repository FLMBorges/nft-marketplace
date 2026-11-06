/**
 * Só aceita caminhos internos ("/carrinho"). Bloqueia "//site.com" e "https://site.com":
 * sem isso, um link de login malicioso poderia mandar o usuário para outro site depois de entrar (open redirect).
 */
export const safeRedirect = (value: unknown) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined

export type AuthSearch = { redirect?: string; expired?: boolean }

/** Parâmetros de /login e /cadastro: para onde voltar e se a sessão expirou. */
export const validateAuthSearch = (search: Record<string, unknown>): AuthSearch => ({
  redirect: safeRedirect(search.redirect),
  expired: search.expired === true || search.expired === 'true' || undefined,
})
