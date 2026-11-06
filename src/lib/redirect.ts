/**
 * Só aceita caminhos internos ("/carrinho"). Bloqueia "//site.com" e "https://site.com":
 * sem isso, um link de login malicioso poderia mandar o usuário para outro site depois de entrar (open redirect).
 */
export const safeRedirect = (value: unknown) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined
