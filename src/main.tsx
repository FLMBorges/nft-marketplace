import './index.css'

/**
 * A aplicação e os mocks são baixados EM PARALELO, mas a aplicação só é renderizada depois que o MSW liga.
 * O socket.io-client é importado sob demanda (em RealtimeSync), depois do render: assim ele usa o
 * `WebSocket` já interceptado pelo MSW.
 */
const app = import('./app')

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  const { worker } = await import('./mocks/browser')
  await worker.start({
    quiet: import.meta.env.PROD,
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api')) print.error()
    },
  })
}

Promise.all([app, enableMocking()]).then(([{ renderApp }]) => renderApp())
