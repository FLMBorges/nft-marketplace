import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleX, LoaderCircle, MailCheck, X } from 'lucide-react'
import { toast } from 'sonner'
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
    <section className="mx-auto max-w-lg px-4 py-12">
      <article aria-labelledby="receipt-title" className="relative overflow-hidden rounded-lg border-b-4 border-primary bg-card text-sm">
        <Link
          to="/"
          search={DEFAULT_CATALOG_SEARCH}
          aria-label="Fechar e voltar ao início"
          className="absolute top-3 right-3 text-primary hover:opacity-80"
        >
          <X aria-hidden className="size-4" />
        </Link>
        <header className="px-6 pt-8 pb-4 text-center">
          <MailCheck aria-hidden className="mx-auto size-12 text-primary" />
          <h1 id="receipt-title" className="mt-3 font-semibold">
            Seus NFTs agora estão na sua carteira
          </h1>
          <p className="sr-only">Pedido confirmado.</p>
        </header>

        <dl className="grid grid-cols-2 gap-3 border-y border-primary/60 px-6 py-3 text-xs sm:grid-cols-4 sm:divide-x sm:divide-border sm:gap-0">
          <div className="sm:pr-3">
            <dt className="font-semibold">ID da transação</dt>
            <dd className="text-muted-foreground" title={order.txHash ?? undefined}>
              {order.txHash ? shortAddress(order.txHash) : '—'}
            </dd>
          </div>
          <div className="sm:px-3">
            <dt className="font-semibold">Data</dt>
            <dd className="text-muted-foreground">
              {new Date(order.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </dd>
          </div>
          <div className="sm:px-3">
            <dt className="font-semibold">Total</dt>
            <dd className="text-muted-foreground">{order.total} ETH</dd>
          </div>
          <div className="sm:pl-3">
            <dt className="font-semibold">Carteira</dt>
            <dd className="truncate text-muted-foreground">{order.wallet.label}</dd>
          </div>
        </dl>

        <div className="px-6 py-4" aria-label="Recibo" role="group">
          <h2 className="font-semibold">Detalhes da transação</h2>
          <table className="mt-2 w-full">
            <caption className="sr-only">Itens comprados</caption>
            <thead className="border-b border-border text-left">
              <tr>
                <th scope="col" className="pb-1 font-semibold">
                  NFTs
                </th>
                <th scope="col" className="pb-1 text-center font-semibold">
                  Edições
                </th>
                <th scope="col" className="pb-1 text-right font-semibold">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={`${item.nftId}:${item.edition}`}>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <img src={item.image} alt="" width={600} height={600} className="size-9 rounded object-cover" />
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID do token: {item.tokenId} · {EDITION_LABELS[item.edition]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-center text-xs text-muted-foreground">(x {item.quantity})</td>
                  <td className="py-2 text-right font-semibold text-primary">{item.lineTotal} ETH</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-2 ml-auto w-2/3 space-y-1">
            {order.discount !== '0' && (
              <div className="flex justify-between">
                <dt>Desconto{order.coupon && ` (${order.coupon.code})`}</dt>
                <dd>(-) {order.discount} ETH</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Taxa de rede</dt>
              <dd>{order.networkFee} ETH</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Total</dt>
              <dd className="text-primary">{order.total} ETH</dd>
            </div>
          </dl>
        </div>

        <footer className="border-t border-border px-6 py-5 text-center">
          <p className="text-xs text-muted-foreground">
            Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida para sua carteira conectada (
            {shortAddress(order.wallet.address)}) e registrada na rede.
          </p>
          <Button
            className="mt-4"
            onClick={() => toast.info(`Explorador simulado: a transação ${order.txHash} existe apenas nesta demonstração.`)}
          >
            Ver no explorador (simulado)
          </Button>
        </footer>
      </article>
    </section>
  )
}
