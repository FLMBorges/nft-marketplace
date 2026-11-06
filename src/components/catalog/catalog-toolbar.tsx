import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SORT_LABELS, TAB_LABELS } from '@/lib/labels'
import { SORTS, TABS, type NftListResponse, type Sort } from '@/types/nft'
import { CatalogFilters } from './catalog-filters'

const route = getRouteApi('/')

export function CatalogToolbar({ facets }: { facets?: NftListResponse['facets'] }) {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/' })

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <nav aria-label="Seções do catálogo">
          <ul className="flex flex-wrap gap-4 text-sm">
            {TABS.map((tab) => (
              <li key={tab}>
                <Link
                  from="/"
                  to="/"
                  search={(prev) => ({ ...prev, tab, page: 1 })}
                  resetScroll={false}
                  aria-current={search.tab === tab ? 'page' : undefined}
                  className="border-b-2 border-transparent pb-1 hover:text-primary aria-[current=page]:border-primary aria-[current=page]:text-primary"
                >
                  {TAB_LABELS[tab]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden">
              <SlidersHorizontal aria-hidden />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <CatalogFilters facets={facets} />
          </SheetContent>
        </Sheet>

        <label className="ml-auto flex items-center gap-2 text-sm">
          Ordenar por:
          <select
            value={search.sort}
            onChange={(event) =>
              navigate({
                search: (prev) => ({ ...prev, sort: event.target.value as Sort, page: 1 }),
                resetScroll: false,
              })
            }
            className="rounded-md border border-input bg-background px-2 py-1"
          >
            {SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {search.q && (
        <p className="text-sm">
          Resultados para <strong>“{search.q}”</strong>{' '}
          <Link
            from="/"
            to="/"
            search={(prev) => ({ ...prev, q: undefined, page: 1 })}
            resetScroll={false}
            className="ml-2 text-primary underline"
          >
            Limpar busca
          </Link>
        </p>
      )}
    </div>
  )
}
