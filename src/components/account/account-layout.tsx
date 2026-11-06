import { Link, useRouterState } from '@tanstack/react-router'
import { BadgePercent, Download, Heart, LifeBuoy, LogOut, ShoppingBag, UserRound, Wallet, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLogout } from '@/components/auth/use-logout'
import { comingSoon } from '@/lib/coming-soon'

const ITEM_CLASS =
  'flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2 text-sm hover:text-primary aria-[current=page]:border-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary'

const SOON: [string, LucideIcon][] = [
  ['Atividade', ShoppingBag],
  ['Ofertas', BadgePercent],
  ['Arquivos baixados', Download],
  ['Suporte', LifeBuoy],
]

/** Moldura das telas de conta: menu lateral (vira faixa horizontal no mobile) + conteúdo. */
export function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const signOut = useLogout()

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[14rem_1fr]">
      <nav aria-label="Meu perfil" className="h-fit rounded-lg bg-card py-3">
        <p className="px-4 pb-2 font-semibold">Meu perfil</p>
        <ul className="flex overflow-x-auto md:block">
          <li className="shrink-0">
            <Link to="/perfil" activeOptions={{ includeHash: true }} aria-current={pathname === '/perfil' ? 'page' : undefined} className={ITEM_CLASS}>
              <UserRound aria-hidden className="size-4" /> Dados do perfil
            </Link>
          </li>
          <li className="shrink-0">
            <Link to="/carteiras" aria-current={pathname === '/carteiras' ? 'page' : undefined} className={ITEM_CLASS}>
              <Wallet aria-hidden className="size-4" /> Carteiras
            </Link>
          </li>
          <li className="shrink-0">
            <Link to="/perfil" hash="favoritos" activeOptions={{ includeHash: true }} className={ITEM_CLASS}>
              <Heart aria-hidden className="size-4" /> Lista de interesse
            </Link>
          </li>
          {SOON.map(([label, Icon]) => (
            <li key={label} className="shrink-0">
              <button type="button" onClick={comingSoon} className={ITEM_CLASS}>
                <Icon aria-hidden className="size-4" /> {label}
              </button>
            </li>
          ))}
          <li className="shrink-0 md:mt-2 md:border-t md:border-border md:pt-2">
            <button type="button" onClick={() => signOut.mutate()} disabled={signOut.isPending} className={ITEM_CLASS}>
              <LogOut aria-hidden className="size-4" /> Sair
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
