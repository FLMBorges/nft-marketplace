import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ITEM_CLASS =
  'grid size-9 place-items-center rounded-md text-sm hover:bg-accent aria-[current=page]:bg-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary-foreground'

/** Mostra a primeira, a última e as vizinhas da página atual, com "…" nos saltos. */
function visiblePages(page: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .flatMap((n, i, list) => (i > 0 && n - list[i - 1] > 1 ? (['gap', n] as const) : [n]))
}

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-8 flex justify-end">
      <ul className="flex items-center gap-1">
        {page > 1 && (
          <li>
            <Link from="/" to="/" search={(prev) => ({ ...prev, page: page - 1 })} aria-label="Página anterior" className={ITEM_CLASS}>
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          </li>
        )}
        {visiblePages(page, totalPages).map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden className="px-1">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                from="/"
                to="/"
                search={(prev) => ({ ...prev, page: n })}
                aria-label={`Página ${n}`}
                aria-current={n === page ? 'page' : undefined}
                className={ITEM_CLASS}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link from="/" to="/" search={(prev) => ({ ...prev, page: page + 1 })} aria-label="Próxima página" className={ITEM_CLASS}>
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}