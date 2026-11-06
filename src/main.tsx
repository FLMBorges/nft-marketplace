import './index.css'

/**
 * Os mocks precisam ligar ANTES de a aplicação carregar: o socket.io-client guarda o `WebSocket`
 * do navegador quando o módulo é importado. Por isso a aplicação é importada só depois.
 */
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api')) print.error()
    },
  })
}

enableMocking()
  .then(() => import('./app'))
  .then(({ renderApp }) => renderApp())
