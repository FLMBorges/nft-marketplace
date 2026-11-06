import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
import { getApiError } from '@/api/client'
import { orderQuery } from '@/api/orders'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { EDITION_LABELS, NETWORK_LABELS, shortAddress } from '@/lib/labels'

export const Route = createFileRoute('/_auth/pedido/$id')({
  component: OrderPage,
})

function OrderPage() {
  const { user } = Route.useRouteContext()
  const { id } = Route.useParams()
  const { data: order, isPending, isError, error, refetch } = useQuery(orderQuery(user.id, id))

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Carregando pedido" className="mx-auto max-w-2xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }
  if (isError) {
    return (
      <section role="alert" className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{getApiError(error)?.code === 'NOT_FOUND' ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}</h1>
        <Button className="mt-6" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </section>
    )
  }

  if (order.status === 'pending') {
    return (
      <section role="status" className="mx-auto max-w-2xl px-4 py-24 text-center">
        <LoaderCircle aria-hidden className="mx-auto size-12 animate-spin text-primary motion-reduce:animate-none" />
        <h1 className="mt-4 text-2xl font-bold">Aguardando confirmação do pagamento</h1>
        <p className="mt-2 text-muted-foreground">
          Pedido {order.id}. Você pode recarregar ou fechar esta página: o pedido não será duplicado.
        </p>
      </section>
    )
  }

  if (order.status === 'declined') {
    return (
      <section role="alert" className="mx-auto max-w-2xl px-4 py-24 text-center">
        <CircleX aria-hidden className="mx-auto size-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Pagamento recusado</h1>
        <p className="mt-2 text-muted-foreground">{order.declineReason}</p>
        <p className="mt-1 text-sm text-muted-foreground">Nada foi cobrado e seus itens continuam no carrinho.</p>
        <Button asChild className="mt-6">
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <CircleCheck aria-hidden className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Pedido confirmado!</h1>
        <p className="mt-2 text-muted-foreground">Obrigado, {order.buyer.name}. Os NFTs já estão na sua carteira.</p>
      </div>

      <article aria-label="Recibo" className="mt-8 space-y-6 rounded-lg bg-card p-6 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Pedido</dt>
            <dd className="break-all">{order.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Data</dt>
            <dd>{new Date(order.updatedAt).toLocaleString('pt-BR')}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Transação (simulada)</dt>
            <dd className="font-mono break-all">{order.txHash}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rede</dt>
            <dd>{NETWORK_LABELS[order.network]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Carteira</dt>
            <dd>
              {order.wallet.label} ({shortAddress(order.wallet.address)})
            </dd>
          </div>
        </dl>

        <table className="w-full">
          <caption className="sr-only">Itens comprados</caption>
          <thead className="text-left text-muted-foreground">
            <tr>
              <th scope="col" className="pb-2 font-normal">
                Item
              </th>
              <th scope="col" className="pb-2 font-normal">
                Qtd.
              </th>
              <th scope="col" className="pb-2 text-right font-normal">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={`${item.nftId}:${item.edition}`} className="border-t border-border">
                <td className="py-2">
                  {item.name} <span className="text-muted-foreground">· {EDITION_LABELS[item.edition]}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">{item.unitPrice} ETH cada</span>
                </td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2 text-right">{item.lineTotal} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-1 border-t border-border pt-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{order.subtotal} ETH</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Desconto{order.coupon && ` (${order.coupon.code})`}</dt>
            <dd>{order.discount === '0' ? '—' : `− ${order.discount} ETH`}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Taxa de rede</dt>
            <dd>{order.networkFee} ETH</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd className="text-primary">{order.total} ETH</dd>
          </div>
        </dl>
      </article>

      <Button asChild className="mt-6 w-full">
        <Link to="/" search={DEFAULT_CATALOG_SEARCH} hash="catalogo">
          Continuar explorando
        </Link>
      </Button>
    </section>
  )
}
