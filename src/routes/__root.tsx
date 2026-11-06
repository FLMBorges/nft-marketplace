import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { SessionWatcher } from '@/components/session-watcher'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { RealtimeSync } from '@/realtime/realtime-sync'

const ScenarioPanel = import.meta.env.VITE_ENABLE_MOCKS === 'true' ? lazy(() => import('@/components/dev/scenario-panel')) : null

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster />
      <RealtimeSync />
      <SessionWatcher />
      {ScenarioPanel && (
        <Suspense fallback={null}>
          <ScenarioPanel />
        </Suspense>
      )}
    </>
  )
}

function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">O endereço acessado não existe.</p>
      <Button asChild className="mt-6">
        <Link to="/" search={DEFAULT_CATALOG_SEARCH}>
          Voltar ao início
        </Link>
      </Button>
    </section>
  )
}
