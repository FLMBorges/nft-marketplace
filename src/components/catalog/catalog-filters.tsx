import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEFAULT_CATALOG_SEARCH, parsePrice } from '@/lib/catalog-search'
import { CATEGORY_LABELS, NETWORK_LABELS } from '@/lib/labels'
import { CATEGORIES, NETWORKS, type NftListResponse } from '@/types/nft'

const route = getRouteApi('/')
const OPTION_CLASS =
  'flex justify-between py-1 text-sm hover:text-primary aria-[current=true]:font-semibold aria-[current=true]:text-primary aria-[current=true]:underline'

export function CatalogFilters({ facets }: { facets?: NftListResponse['facets'] }) {
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/' })

  function applyPrice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    navigate({
      search: (prev) => ({
        ...prev,
        minPrice: parsePrice(form.get('minPrice')),
        maxPrice: parsePrice(form.get('maxPrice')),
        page: 1,
      }),
      resetScroll: false,
    })
  }

  return (
    <aside aria-label="Filtros" className="space-y-8 self-start rounded-lg bg-card p-4">
      <FilterGroup title="Coleções">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <Link
              from="/"
              to="/"
              search={(prev) => ({ ...prev, category: prev.category === category ? undefined : category, page: 1 })}
              resetScroll={false}
              aria-current={search.category === category}
              className={OPTION_CLASS}
            >
              {CATEGORY_LABELS[category]} <span>({facets?.categories[category] ?? '–'})</span>
            </Link>
          </li>
        ))}
      </FilterGroup>

      <form onSubmit={applyPrice} key={`${search.minPrice}-${search.maxPrice}`}>
        <fieldset>
          <legend className="font-semibold">Faixa de preço (ETH)</legend>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm">
              Mínimo
              <Input
                name="minPrice"
                type="number"
                min={0}
                step={0.01}
                defaultValue={search.minPrice}
                placeholder={facets?.priceRange.min}
              />
            </label>
            <label className="text-sm">
              Máximo
              <Input
                name="maxPrice"
                type="number"
                min={0}
                step={0.01}
                defaultValue={search.maxPrice}
                placeholder={facets?.priceRange.max}
              />
            </label>
          </div>
        </fieldset>
        <Button type="submit" size="sm" className="mt-3">
          Aplicar
        </Button>
      </form>

      <FilterGroup title="Rede">
        {NETWORKS.map((network) => (
          <li key={network}>
            <Link
              from="/"
              to="/"
              search={(prev) => ({ ...prev, network: prev.network === network ? undefined : network, page: 1 })}
              resetScroll={false}
              aria-current={search.network === network}
              className={OPTION_CLASS}
            >
              {NETWORK_LABELS[network]} <span>({facets?.networks[network] ?? '–'})</span>
            </Link>
          </li>
        ))}
      </FilterGroup>

      <Link from="/" to="/" search={DEFAULT_CATALOG_SEARCH} resetScroll={false} className="text-sm underline">
        Limpar filtros
      </Link>
    </aside>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3">{children}</ul>
    </section>
  )
}
