import { createFileRoute, Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2, TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { applyCoupon, removeCartItem, removeCoupon, updateCartItem, useCart, useCartMutation } from '@/api/cart'
import { errorMessage } from '@/api/client'
import { QuoteSummary } from '@/components/cart/quote-summary'
import { usePriceChanges } from '@/components/cart/use-price-changes'
import { Field } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { useFormErrors } from '@/lib/form'
import { EDITION_LABELS } from '@/lib/labels'
import type { CartItem } from '@/types/cart'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  const { data: cart, isPending, isError, refetch, isFetching } = useCart()
  const { changes, dismiss } = usePriceChanges(cart?.items)
  const coupon = useCartMutation(applyCoupon)
  const dropCoupon = useCartMutation(removeCoupon)
  const couponForm = useFormErrors()

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const code = String(new FormData(form).get('code') ?? '').trim()
    if (!code) return couponForm.fromApi(null)
    coupon.mutate(code, {
      onSuccess: () => {
        couponForm.reset()
        toast.success('Cupom aplicado.')
      },
      onError: (error) => couponForm.fromApi(error, form),
    })
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Carrinho de NFTs</h1>

      {changes.length > 0 && (
        <div role="alert" className="mt-6 flex gap-3 rounded-md border border-primary bg-primary/10 p-4 text-sm">
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
        <div aria-busy="true" aria-label="Carregando carrinho" className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ul aria-label="Itens do carrinho" aria-busy={isFetching} className="space-y-4">
            {cart.items.map((item) => (
              <li key={`${item.nftId}:${item.edition}`}>
                <CartLine item={item} />
              </li>
            ))}
          </ul>

          <aside aria-label="Resumo do pedido" className="h-fit space-y-6 rounded-lg bg-card p-6">
            <h2 className="font-semibold">Resumo</h2>
            {cart.quote.coupon ? (
              <p className="flex items-center justify-between text-sm">
                Cupom <strong>{cart.quote.coupon.code}</strong>
                <Button size="sm" variant="ghost" disabled={dropCoupon.isPending} onClick={() => dropCoupon.mutate(undefined)}>
                  Remover cupom
                </Button>
              </p>
            ) : (
              <form noValidate onSubmit={submitCoupon} className="flex items-end gap-2">
                <Field
                  label="Cupom de desconto"
                  name="code"
                  autoComplete="off"
                  placeholder="KURIO10"
                  error={couponForm.errors.code ?? couponForm.formError ?? undefined}
                  className="flex-1"
                />
                <Button type="submit" disabled={coupon.isPending} className={couponForm.errors.code || couponForm.formError ? 'mb-7' : ''}>
                  Aplicar
                </Button>
              </form>
            )}
            <QuoteSummary quote={cart.quote} />
            {cart.quote.issues.length > 0 && (
              <p role="alert" className="text-sm text-destructive">
                Ajuste os itens indisponíveis antes de finalizar.
              </p>
            )}
            <Button asChild className="w-full" aria-disabled={cart.quote.issues.length > 0}>
              <Link to="/checkout" disabled={cart.quote.issues.length > 0}>
                Finalizar compra
              </Link>
            </Button>
          </aside>
        </div>
      )}
    </section>
  )
}

function CartLine({ item }: { item: CartItem }) {
  const update = useCartMutation(updateCartItem)
  const remove = useCartMutation(removeCartItem)
  const busy = update.isPending || remove.isPending
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const setQuantity = (quantity: number) => update.mutate({ nftId: item.nftId, edition: item.edition, quantity }, { onError })

  return (
    <article className="flex gap-4 rounded-lg bg-card p-4">
      <img src={item.nft.image} alt="" width={600} height={600} className="size-24 rounded-md object-cover" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-2">
          <h2 className="font-semibold">
            <Link to="/nft/$id" params={{ id: item.nftId }} className="hover:text-primary">
              {item.nft.name}
            </Link>
          </h2>
          <p className="font-semibold text-primary">{item.lineTotal} ETH</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Edição {EDITION_LABELS[item.edition]} · {item.unitPrice} ETH cada · {item.available} disponível(is)
        </p>
        {item.available === 0 && <p className="text-sm text-destructive">Esta edição esgotou. Remova o item para continuar.</p>}
        {item.available > 0 && item.quantity > item.available && (
          <p className="text-sm text-destructive">Só restam {item.available}. Ajuste a quantidade.</p>
        )}
        <div className="mt-auto flex items-center gap-2">
          <div role="group" aria-label={`Quantidade de ${item.nft.name}`} className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Diminuir quantidade"
              disabled={busy || item.quantity <= 1}
              onClick={() => setQuantity(item.quantity - 1)}
            >
              <Minus aria-hidden />
            </Button>
            <output aria-live="polite" className="w-6 text-center text-sm">
              {item.quantity}
            </output>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Aumentar quantidade"
              disabled={busy || item.quantity >= item.available}
              onClick={() => setQuantity(item.quantity + 1)}
            >
              <Plus aria-hidden />
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive"
            disabled={busy}
            onClick={() => remove.mutate({ nftId: item.nftId, edition: item.edition }, { onError })}
          >
            <Trash2 aria-hidden />
            Remover
          </Button>
        </div>
      </div>
    </article>
  )
}
