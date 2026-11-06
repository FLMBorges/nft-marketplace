import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { applyCoupon, removeCoupon, useCart, useCartMutation } from '@/api/cart'
import { nftListQuery } from '@/api/nfts'
import { CART_GRID, CartLine } from '@/components/cart/cart-line'
import { QuoteSummary } from '@/components/cart/quote-summary'
import { usePriceChanges } from '@/components/cart/use-price-changes'
import { NftCard } from '@/components/catalog/nft-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { useFormErrors } from '@/lib/form'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  const { data: cart, isPending, isError, refetch, isFetching } = useCart()
  const { changes, dismiss } = usePriceChanges(cart?.items)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="mb-2 text-sm text-muted-foreground">
        <Link to="/" search={DEFAULT_CATALOG_SEARCH} className="hover:text-primary">
          Início
        </Link>{' '}
        /{' '}
        <Link to="/" search={DEFAULT_CATALOG_SEARCH} hash="catalogo" className="hover:text-primary">
          Mercado
        </Link>{' '}
        / <span aria-current="page">Carrinho</span>
      </nav>
      <h1 className="text-2xl font-bold md:sr-only">Carrinho de NFTs</h1>

      {changes.length > 0 && (
        <div role="alert" className="mt-4 flex gap-3 rounded-md border border-primary bg-primary/10 p-4 text-sm">
          <TriangleAlert aria-hidden className="size-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">Alguns valores foram atualizados enquanto você navegava:</p>
            <ul className="mt-1 list-disc pl-5">
              {changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
          <Button size="sm" variant="outline" onClick={dismiss}>
            Entendi
          </Button>
        </div>
      )}

      {isError ? (
        <div role="alert" className="py-16 text-center">
          <p>Não foi possível carregar o carrinho.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isPending ? (
        <div aria-busy="true" aria-label="Carregando carrinho" className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="rounded-lg bg-card p-6">
            <QuoteSummary />
          </div>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="py-16 text-center">
          <p>Seu carrinho está vazio.</p>
          <Button asChild className="mt-4">
            <Link to="/" search={DEFAULT_CATALOG_SEARCH} hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <div aria-hidden className={`${CART_GRID} hidden border-b border-border px-3 pb-2 text-sm font-semibold md:grid`}>
              <span className="col-span-2">NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            <ul aria-label="Itens do carrinho" aria-busy={isFetching} className="mt-3 space-y-2">
              {cart.items.map((item) => (
                <li key={`${item.nftId}:${item.edition}`}>
                  <CartLine item={item} />
                </li>
              ))}
            </ul>
          </div>

          <CartSummary />
        </div>
      )}

      <AlsoViewed exclude={cart?.items.map((item) => item.nftId) ?? []} />
    </section>
  )
}

function CartSummary() {
  const { data: cart } = useCart()
  const coupon = useCartMutation(applyCoupon)
  const dropCoupon = useCartMutation(removeCoupon)
  const couponForm = useFormErrors()
  const blocked = !!cart?.quote.issues.length
  const couponError = couponForm.errors.code ?? couponForm.formError

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const code = String(new FormData(form).get('code') ?? '').trim()
    if (!code) return
    coupon.mutate(code, {
      onSuccess: () => {
        couponForm.reset()
        toast.success('Cupom aplicado.')
      },
      onError: (error) => couponForm.fromApi(error, form),
    })
  }

  return (
    <aside aria-label="Resumo do pedido" className="h-fit space-y-5">
      <h2 className="border-b border-border pb-2 font-semibold">Resumo da carteira</h2>
      {cart?.quote.coupon ? (
        <p className="flex items-center justify-between text-sm">
          <span>
            Código promocional <strong>{cart.quote.coupon.code}</strong>
          </span>
          <Button size="sm" variant="ghost" disabled={dropCoupon.isPending} onClick={() => dropCoupon.mutate(undefined)}>
            Remover cupom
          </Button>
        </p>
      ) : (
        <form noValidate onSubmit={submitCoupon}>
          <label htmlFor="coupon-code" className="text-sm font-medium">
            Código promocional
          </label>
          <div className="mt-1.5 flex">
            <Input
              id="coupon-code"
              name="code"
              autoComplete="off"
              placeholder="Digite o código promocional..."
              aria-invalid={!!couponError}
              aria-describedby={couponError ? 'coupon-error' : undefined}
              className="rounded-r-none border-primary"
            />
            <Button type="submit" disabled={coupon.isPending} className="rounded-l-none">
              Aplicar
            </Button>
          </div>
          {couponError && (
            <p id="coupon-error" className="mt-1.5 text-sm text-destructive">
              {couponError}
            </p>
          )}
        </form>
      )}
      <QuoteSummary quote={cart?.quote} />
      {blocked && (
        <p role="alert" className="text-sm text-destructive">
          Ajuste os itens indisponíveis antes de finalizar.
        </p>
      )}
      <Button asChild className="w-full" aria-disabled={blocked}>
        <Link to="/checkout" disabled={blocked}>
          Conectar e finalizar
        </Link>
      </Button>
      <p className="text-center">
        <Link to="/" search={DEFAULT_CATALOG_SEARCH} hash="catalogo" className="text-sm text-primary hover:underline">
          Continuar explorando
        </Link>
      </p>
    </aside>
  )
}

function AlsoViewed({ exclude }: { exclude: string[] }) {
  const { data } = useQuery(nftListQuery({ sort: 'popular' }))
  const items = data?.items.filter((item) => !exclude.includes(item.id)).slice(0, 5)
  if (!items?.length) return null

  return (
    <section aria-labelledby="also-viewed" className="mt-16">
      <h2 id="also-viewed" className="border-b border-border pb-2 font-semibold text-primary">
        Colecionadores também viram
      </h2>
      <ul className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.id} className="w-40 shrink-0 snap-start sm:w-auto">
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
