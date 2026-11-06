import { Link, useRouterState } from '@tanstack/react-router'
import { Heart, House, Search, ShoppingCart, UserRound } from 'lucide-react'
import { useCart } from '@/api/cart'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'

const ITEM = 'relative grid size-11 place-items-center rounded-full text-muted-foreground aria-[current=page]:text-primary'

/** Barra inferior do mobile (como no Figma). No desktop, a navegação fica no header. */
export function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { data: cart } = useCart()
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <nav aria-label="Navegação rápida" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card md:hidden">
      <ul className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        <li>
          <Link to="/" search={DEFAULT_CATALOG_SEARCH} aria-label="Início" aria-current={pathname === '/' ? 'page' : undefined} className={ITEM}>
            <House aria-hidden className="size-5" />
          </Link>
        </li>
        <li>
          <Link to="/perfil" hash="favoritos" aria-label="Lista de interesse" className={ITEM}>
            <Heart aria-hidden className="size-5" />
          </Link>
        </li>
        <li>
          <Link
            to="/"
            search={DEFAULT_CATALOG_SEARCH}
            hash="catalogo"
            aria-label="Explorar catálogo"
            className="-mt-8 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <Search aria-hidden className="size-5" />
          </Link>
        </li>
        <li>
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
            aria-current={pathname === '/carrinho' ? 'page' : undefined}
            className={ITEM}
          >
            <ShoppingCart aria-hidden className="size-5" />
            {count > 0 && (
              <span aria-hidden className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link to="/perfil" aria-label="Meu perfil" aria-current={pathname === '/perfil' ? 'page' : undefined} className={ITEM}>
            <UserRound aria-hidden className="size-5" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
