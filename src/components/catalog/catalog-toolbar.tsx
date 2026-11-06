import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseText } from '@/lib/catalog-search'
import { SORT_LABELS, TAB_LABELS } from '@/lib/labels'
import { SORTS, TABS, type Sort } from '@/types/nft'

const route = getRouteApi('/')

export function CatalogToolbar() {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/' })

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <nav aria-label="Seções do catálogo">
        <ul className="flex gap-4 text-sm">
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

      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const q = parseText(new FormData(event.currentTarget).get('q'))
          navigate({ search: (prev) => ({ ...prev, q, page: 1 }), resetScroll: false })
        }}
      >
        <label htmlFor="catalog-search" className="sr-only">
          Buscar NFTs
        </label>
        <Input id="catalog-search" name="q" type="search" key={search.q} defaultValue={search.q} placeholder="Buscar NFTs" />
        <Button type="submit">Buscar</Button>
      </form>

      <label className="ml-auto flex items-center gap-2 text-sm">
        Ordenar por:
        <select
          value={search.sort}
          onChange={(event) =>
            navigate({ search: (prev) => ({ ...prev, sort: event.target.value as Sort, page: 1 }), resetScroll: false })
          }
          className="rounded-md border bg-background px-2 py-1"
        >
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}