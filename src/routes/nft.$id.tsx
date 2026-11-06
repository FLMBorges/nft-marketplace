import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { getApiError } from '@/api/client'
import { nftQuery } from '@/api/nfts'
import { NftDetail } from '@/components/nft/nft-detail'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'

export const Route = createFileRoute('/nft/$id')({
  component: NftPage,
})

function NftPage() {
  const { id } = Route.useParams()
  const { data, isPending, isError, error, refetch } = useQuery(nftQuery(id))

  if (isPending) return <NftDetailSkeleton />
  if (isError && getApiError(error)?.code === 'NOT_FOUND') {
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">NFT não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Este NFT não existe ou foi removido do mercado.</p>
        <Button asChild className="mt-6">
          <Link to="/" search={DEFAULT_CATALOG_SEARCH} hash="catalogo">
            Ver catálogo
          </Link>
        </Button>
      </section>
    )
  }
  if (isError) {
    return (
      <section role="alert" className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Não foi possível carregar este NFT</h1>
        <Button className="mt-6" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </section>
    )
  }
  // `key` reinicia edição/quantidade/galeria ao navegar para outro NFT.
  return <NftDetail key={data.id} nft={data} />
}

function NftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[auto_1fr_1fr]">
      <div className="hidden gap-2 lg:flex lg:flex-col">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="size-20" />
        ))}
      </div>
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
