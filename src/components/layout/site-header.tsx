import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogIn, Menu, Search, ShoppingCart } from 'lucide-react'
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
          <Button variant="ghost" size="icon" asChild>
            <Link to="/carrinho" aria-label="Carrinho">
              <ShoppingCart aria-hidden />
            </Link>
          </Button>
          <Button size="sm" asChild className="ml-2 hidden sm:inline-flex">
            <Link to="/login">
              <LogIn aria-hidden />
              Entrar
            </Link>
          </Button>

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
              <Button asChild className="mt-6 sm:hidden">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <LogIn aria-hidden />
                  Entrar
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
