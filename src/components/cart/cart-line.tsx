import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { removeCartItem, updateCartItem, useCartMutation } from '@/api/cart'
import { errorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { EDITION_LABELS } from '@/lib/labels'
import type { CartItem } from '@/types/cart'

/** Mesma grade nas duas telas: colunas no desktop (Preço, Edições, Total) e cartão no mobile. */
export const CART_GRID = 'grid grid-cols-[4.5rem_1fr_auto] gap-x-3 md:grid-cols-[3rem_minmax(0,2fr)_1fr_1fr_1fr_2rem] md:gap-x-4'

export function CartLine({ item }: { item: CartItem }) {
  const update = useCartMutation(updateCartItem)
  const remove = useCartMutation(removeCartItem)
  const busy = update.isPending || remove.isPending
  const onError = (error: unknown) => toast.error(errorMessage(error))
  const setQuantity = (quantity: number) => update.mutate({ nftId: item.nftId, edition: item.edition, quantity }, { onError })
  const problem =
    item.available === 0
      ? 'Esta edição esgotou. Remova o item para continuar.'
      : item.quantity > item.available
        ? `Só restam ${item.available}. Ajuste a quantidade.`
        : null

  return (
    <article className={`${CART_GRID} items-center gap-y-1 rounded-md bg-card p-3 md:py-2`}>
      <img
        src={item.nft.image}
        alt=""
        width={600}
        height={600}
        className="row-span-3 size-18 rounded-md object-cover md:row-span-1 md:size-12"
      />
      <div className="col-start-2 row-span-2 row-start-1 min-w-0 md:row-span-1">
        <h2 className="truncate text-sm font-semibold">
          <Link to="/nft/$id" params={{ id: item.nftId }} className="hover:text-primary">
            {item.nft.name}
          </Link>
        </h2>
        <p className="text-xs text-muted-foreground">ID do token: {item.tokenId}</p>
        <p className="text-xs text-muted-foreground">
          Edição: {EDITION_LABELS[item.edition]} · {item.available} disponível(is)
        </p>
      </div>
      <p className="hidden text-sm font-semibold text-primary md:col-start-3 md:row-start-1 md:block">
        <span className="sr-only">Preço unitário: </span>
        {item.unitPrice} ETH
      </p>
      <div role="group" aria-label={`Quantidade de ${item.nft.name}`} className="col-start-3 row-start-1 flex items-center gap-2 md:col-start-4">
        <Button
          size="icon-xs"
          className="rounded-full"
          aria-label="Diminuir quantidade"
          disabled={busy || item.quantity <= 1}
          onClick={() => setQuantity(item.quantity - 1)}
        >
          <Minus aria-hidden />
        </Button>
        <output aria-live="polite" className="w-5 text-center text-sm">
          {item.quantity}
        </output>
        <Button
          size="icon-xs"
          className="rounded-full"
          aria-label="Aumentar quantidade"
          disabled={busy || item.quantity >= item.available}
          onClick={() => setQuantity(item.quantity + 1)}
        >
          <Plus aria-hidden />
        </Button>
      </div>
      <p className="col-start-2 row-start-3 font-semibold text-primary md:col-start-5 md:row-start-1 md:text-sm">
        <span className="sr-only">Total do item: </span>
        {item.lineTotal} ETH
      </p>
      <Button
        size="icon-sm"
        variant="ghost"
        className="col-start-3 row-start-3 justify-self-end text-primary md:col-start-6 md:row-start-1"
        aria-label={`Remover ${item.nft.name}`}
        disabled={busy}
        onClick={() => remove.mutate({ nftId: item.nftId, edition: item.edition }, { onError })}
      >
        <Trash2 aria-hidden />
      </Button>
      {problem && <p className="col-span-full text-sm text-destructive">{problem}</p>}
    </article>
  )
}
