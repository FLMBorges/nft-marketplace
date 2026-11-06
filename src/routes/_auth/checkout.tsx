import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plug, PlugZap, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { connectWallet, useWallets } from '@/api/account'
import { useCart } from '@/api/cart'
import { errorMessage, getApiError, isTransient } from '@/api/client'
import { checkoutAttempt, createOrder, orderQuery, type CheckoutAttempt } from '@/api/orders'
import { QuoteSummary } from '@/components/cart/quote-summary'
import { Field, FormError, SelectField } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { useFormErrors } from '@/lib/form'
import { EDITION_LABELS, NETWORK_LABELS, PROVIDER_LABELS, shortAddress } from '@/lib/labels'
import { buyerSchema } from '@/lib/schemas'
import { NETWORKS, type Network } from '@/types/nft'

export const Route = createFileRoute('/_auth/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const { user } = Route.useRouteContext()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: wallets = [], isPending: walletsPending } = useWallets()

  const [selectedNetwork, setSelectedNetwork] = useState<Network>()
  const network = selectedNetwork ?? wallets.find((wallet) => wallet.slot === 'primary')?.network ?? 'ethereum'
  const networkWallets = wallets.filter((wallet) => wallet.network === network)
  const [walletId, setWalletId] = useState<string>()
  const wallet = networkWallets.find((item) => item.id === walletId) ?? networkWallets[0]

  const { data: cart, isPending: cartPending } = useCart(network)
  const [connectedId, setConnectedId] = useState<string | null>(null)
  const [buyer, setBuyer] = useState({ name: user.name, email: user.email })
  const [reviewedSignature, setReviewedSignature] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const form = useFormErrors()

  const connection = useMutation({
    mutationFn: (id: string) => connectWallet(id),
    onSuccess: (_data, id) => setConnectedId(id),
  })

  const order = useMutation({
    mutationFn: (attempt: CheckoutAttempt) => createOrder(attempt),
    // Falha temporária (rede/timeout): repete com a MESMA chave. A API devolve o pedido já criado, sem duplicar.
    retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    retryDelay: 1000,
    onSuccess: (created) => {
      checkoutAttempt.clear()
      queryClient.setQueryData(orderQuery(user.id, created.id).queryKey, created)
      navigate({ to: '/pedido/$id', params: { id: created.id }, replace: true })
    },
    onError: (error) => {
      const code = getApiError(error)?.code
      if (code === 'QUOTE_CHANGED' || code === 'OUT_OF_STOCK' || code === 'IDEMPOTENCY_CONFLICT') {
        checkoutAttempt.clear()
        setReviewedSignature(null)
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
      setOrderError(errorMessage(error))
    },
  })

  // Retoma uma compra interrompida (refresh ou queda de conexão) com a mesma chave de idempotência.
  const resumed = useRef(false)
  useEffect(() => {
    const pending = checkoutAttempt.read(user.id)
    if (pending && !resumed.current) {
      resumed.current = true
      order.mutate(pending)
    }
  }, [order, user.id])

  const isConnected = !!wallet && connectedId === wallet.id
  const quote = cart?.quote
  const quoteChanged = !!reviewedSignature && !!quote && quote.signature !== reviewedSignature

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOrderError(null)
    const data = form.validate(buyerSchema, event.currentTarget)
    if (!data || !quote) return
    if (!isConnected) return setOrderError('Conecte a carteira para revisar o pedido.')
    if (quote.issues.length) return setOrderError('Há itens indisponíveis no carrinho. Ajuste-os antes de continuar.')
    setBuyer(data)
    setReviewedSignature(quote.signature)
  }

  function confirm() {
    if (!wallet || !quote) return
    const input = { quoteSignature: quote.signature, network, walletId: wallet.id, buyer }
    const saved = checkoutAttempt.read(user.id)
    // Mesma tentativa (mesmo conteúdo) reaproveita a chave; conteúdo novo ganha chave nova.
    const attempt =
      saved && JSON.stringify(saved.input) === JSON.stringify(input) ? saved : { userId: user.id, key: crypto.randomUUID(), input }
    checkoutAttempt.save(attempt)
    setOrderError(null)
    order.mutate(attempt)
  }

  if (order.isPending && !reviewedSignature) {
    return (
      <p role="status" className="mx-auto max-w-6xl px-4 py-24 text-center">
        Retomando sua compra anterior…
      </p>
    )
  }

  if (!cartPending && !cart?.items.length) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <Button asChild className="mt-6">
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Pagamento</h1>

        <form id="checkout-form" noValidate onSubmit={review} className="space-y-6">
          <fieldset className="space-y-4 rounded-lg bg-card p-6">
            <legend className="float-left mb-2 w-full font-semibold">1. Dados do colecionador</legend>
            <Field label="Nome completo" name="name" autoComplete="name" defaultValue={buyer.name} error={form.errors.name} />
            <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={buyer.email} error={form.errors.email} />
          </fieldset>

          <fieldset className="space-y-4 rounded-lg bg-card p-6">
            <legend className="float-left mb-2 w-full font-semibold">2. Carteira e rede</legend>
            <SelectField
              label="Rede"
              name="network"
              value={network}
              onChange={(event) => {
                setSelectedNetwork(event.target.value as Network)
                setReviewedSignature(null)
              }}
              options={NETWORKS.map((item) => [item, NETWORK_LABELS[item]])}
            />
            {walletsPending ? (
              <p className="text-sm text-muted-foreground">Carregando carteiras…</p>
            ) : networkWallets.length === 0 ? (
              <p className="text-sm">
                Nenhuma carteira cadastrada para {NETWORK_LABELS[network]}.{' '}
                <Link to="/carteiras" className="text-primary underline">
                  Cadastrar carteira
                </Link>
              </p>
            ) : (
              <>
                <SelectField
                  label="Carteira"
                  name="walletId"
                  value={wallet?.id}
                  onChange={(event) => {
                    setWalletId(event.target.value)
                    setReviewedSignature(null)
                  }}
                  options={networkWallets.map((item) => [item.id, `${item.label} · ${PROVIDER_LABELS[item.provider]} · ${shortAddress(item.address)}`])}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <p role="status" className="text-sm">
                    {isConnected ? 'Carteira conectada.' : 'Carteira desconectada.'}
                  </p>
                  {isConnected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConnectedId(null)
                        setReviewedSignature(null)
                      }}
                    >
                      <Plug aria-hidden /> Desconectar
                    </Button>
                  ) : (
                    <Button type="button" size="sm" disabled={connection.isPending} onClick={() => wallet && connection.mutate(wallet.id)}>
                      <PlugZap aria-hidden /> {connection.isPending ? 'Aguardando a carteira…' : 'Conectar carteira'}
                    </Button>
                  )}
                </div>
                {connection.isError && !isConnected && <FormError message={errorMessage(connection.error)} />}
              </>
            )}
          </fieldset>

          <Button type="submit" variant="outline" className="w-full border-primary" disabled={!quote}>
            Revisar pedido
          </Button>
        </form>
      </div>

      <aside aria-label="Revisão do pedido" className="h-fit space-y-5 rounded-lg bg-card p-6">
        <h2 className="font-semibold">3. Revisão</h2>
        <ul className="space-y-2 text-sm">
          {cart?.items.map((item) => (
            <li key={`${item.nftId}:${item.edition}`} className="flex justify-between gap-2">
              <span>
                {item.nft.name} · {EDITION_LABELS[item.edition]} × {item.quantity}
              </span>
              <span>{item.lineTotal} ETH</span>
            </li>
          ))}
        </ul>
        <QuoteSummary quote={quote} />

        {quoteChanged && (
          <div role="alert" className="flex gap-2 rounded-md border border-primary bg-primary/10 p-3 text-sm">
            <TriangleAlert aria-hidden className="size-5 shrink-0 text-primary" />
            <div>
              <p>Preço, disponibilidade ou taxas mudaram desde a sua revisão. Confira os novos valores.</p>
              <Button size="sm" className="mt-2" onClick={() => setReviewedSignature(quote.signature)}>
                Revisei os novos valores
              </Button>
            </div>
          </div>
        )}
        <FormError message={orderError} />

        {reviewedSignature ? (
          <Button className="w-full" disabled={quoteChanged || order.isPending} onClick={confirm}>
            {order.isPending ? 'Enviando pedido…' : `Confirmar compra de ${quote?.total} ETH`}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Preencha os dados, conecte a carteira e clique em “Revisar pedido”.</p>
        )}
      </aside>
    </section>
  )
}
