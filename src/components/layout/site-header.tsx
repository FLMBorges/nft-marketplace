import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogIn, LogOut, Menu, Search, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DEFAULT_CATALOG_SEARCH, parseText } from '@/lib/catalog-search'
import { useCart } from '@/api/cart'
import { useSession } from '@/api/session'
import { useLogout } from '@/components/auth/use-logout'
import { comingSoon } from '@/lib/coming-soon'

const NAV_CLASS =
  'border-b-2 border-transparent pb-1 text-sm hover:text-primary aria-[current=page]:border-primary aria-[current=page]:text-primary'

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <>
      <li>
        <Link
          to="/"
          search={DEFAULT_CATALOG_SEARCH}
          aria-current={pathname === '/' ? 'page' : undefined}
          onClick={onNavigate}
          className={NAV_CLASS}
        >
          Início
        </Link>
      </li>
      <li>
        <Link
          to="/"
          search={DEFAULT_CATALOG_SEARCH}
          hash="catalogo"
          aria-current={pathname.startsWith('/nft') ? 'page' : undefined}
          onClick={onNavigate}
          className={NAV_CLASS}
        >
          Mercado
        </Link>
      </li>
      {['Criadores', 'Aprenda'].map((label) => (
        <li key={label}>
          <button type="button" onClick={comingSoon} className={NAV_CLASS}>
            {label}
          </button>
        </li>
      ))}
    </>
  )
}

function SearchDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Buscar NFTs">
          <Search aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar NFTs</DialogTitle>
          <DialogDescription>Pesquise pelo nome do NFT.</DialogDescription>
        </DialogHeader>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            const q = parseText(new FormData(event.currentTarget).get('q'))
            navigate({ to: '/', search: { ...DEFAULT_CATALOG_SEARCH, q }, hash: 'catalogo' })
            setOpen(false)
          }}
        >
          <label htmlFor="header-search" className="sr-only">
            Nome do NFT
          </label>
          <Input id="header-search" name="q" type="search" placeholder="Ex.: Emerald Ape" />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CartLink() {
  const { data: cart } = useCart()
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link to="/carrinho" aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}>
        <ShoppingCart aria-hidden />
        {count > 0 && (
          <span aria-hidden className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[0.625rem] font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </Link>
    </Button>
  )
}

function AccountActions({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { data: session } = useSession()
  const signOut = useLogout()

  if (!session) {
    return (
      <Button size="sm" asChild className={mobile ? 'mt-6 sm:hidden' : 'ml-2 hidden sm:inline-flex'}>
        <Link to="/login" onClick={onNavigate}>
          <LogIn aria-hidden />
          Entrar
        </Link>
      </Button>
    )
  }

  const { user } = session
  return (
    <div className={mobile ? 'mt-6 flex flex-col items-start gap-4 sm:hidden' : 'ml-2 hidden items-center gap-1 sm:flex'}>
      <Link to="/perfil" onClick={onNavigate} className="flex items-center gap-2 text-sm hover:text-primary">
        {user.avatar ? (
          <img src={user.avatar} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
        ) : (
          <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user.name[0]}
          </span>
        )}
        <span className={mobile ? '' : 'hidden lg:inline'}>{user.name.split(' ')[0]}</span>
        <span className="sr-only">: meu perfil</span>
      </Link>
      {mobile && (
        <Link to="/carteiras" onClick={onNavigate} className="text-sm hover:text-primary">
          Carteiras
        </Link>
      )}
      <Button
        variant="ghost"
        size={mobile ? 'sm' : 'icon'}
        aria-label="Sair da conta"
        disabled={signOut.isPending}
        onClick={() => {
          onNavigate?.()
          signOut.mutate()
        }}
      >
        <LogOut aria-hidden />
        {mobile && 'Sair'}
      </Button>
    </div>
  )
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" search={DEFAULT_CATALOG_SEARCH} className="font-bold tracking-widest">
          KURIO
        </Link>

        <nav aria-label="Principal" className="mx-auto hidden md:block">
          <ul className="flex gap-8">
            <NavItems />
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <SearchDialog />
          <CartLink />
          <AccountActions />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu" className="md:hidden">
                <Menu aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="px-6">
              <SheetHeader className="px-0">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Principal">
                <ul className="flex flex-col items-start gap-4">
                  <NavItems onNavigate={() => setMenuOpen(false)} />
                </ul>
              </nav>
              <AccountActions mobile onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
