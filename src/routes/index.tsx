import { useQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { nftListQuery } from '@/api/nfts'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { CatalogToolbar } from '@/components/catalog/catalog-toolbar'
import { NftCard, NftCardSkeleton } from '@/components/catalog/nft-card'
import { FeaturedOffer } from '@/components/home/featured-offer'
import { Hero } from '@/components/home/hero'
import { Journal } from '@/components/home/journal'
import { PromoBanners } from '@/components/home/promo-banners'
import { Button } from '@/components/ui/button'
import { DEFAULT_CATALOG_SEARCH, toApiParams, validateCatalogSearch } from '@/lib/catalog-search'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  search: { middlewares: [stripSearchParams(DEFAULT_CATALOG_SEARCH)] },
  component: HomePage,
})

const GRID_CLASS = 'grid grid-cols-2 gap-4 lg:grid-cols-3'

function HomePage() {
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery(
    nftListQuery(toApiParams(Route.useSearch())),
  )

  return (
    <>
      <Hero />

      <section
        id="catalogo"
        aria-labelledby="catalog-title"
        className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[16rem_1fr]"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="hidden md:block">
          <CatalogFilters facets={data?.facets} />
          <FeaturedOffer />
        </div>

        <div className="min-w-0">
          <CatalogToolbar facets={data?.facets} />

          {isError ? (
            <div role="alert" className="py-16 text-center">
              <p>Não foi possível carregar o catálogo.</p>
              <Button className="mt-4" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : isPending ? (
            <ul aria-label="Carregando NFTs" className={GRID_CLASS}>
              {Array.from({ length: 9 }, (_, i) => (
                <li key={i}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : data.items.length === 0 ? (
            <p className="py-16 text-center">Nenhum NFT encontrado com esses filtros.</p>
          ) : (
            <>
              <ul aria-busy={isPlaceholderData} className={cn(GRID_CLASS, isPlaceholderData && 'opacity-60')}>
                {data.items.map((nft) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} />
                  </li>
                ))}
              </ul>
              <CatalogPagination page={data.page} totalPages={data.totalPages} />
            </>
          )}

          <p aria-live="polite" className="sr-only">
            {data && !isPlaceholderData ? `${data.total} NFTs encontrados` : ''}
          </p>
        </div>
      </section>

      <PromoBanners />
      <Journal />
    </>
  )
}
