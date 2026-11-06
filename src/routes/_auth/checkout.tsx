import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plug, PlugZap, TriangleAlert, Wallet as WalletIcon } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { connectWallet, useWallets } from '@/api/account'
import { useCart } from '@/api/cart'
import { errorMessage, getApiError, isTransient } from '@/api/client'
import { checkoutAttempt, createOrder, orderQuery, type CheckoutAttempt } from '@/api/orders'
import { QuoteSummary } from '@/components/cart/quote-summary'
import { Field, FormError, SelectField } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { useFormErrors } from '@/lib/form'
import { NETWORK_LABELS, PROVIDER_LABELS, shortAddress } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
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
  const [buyer, setBuyer] = useState({ name: user.name, email: user.email, note: '' })
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

  const changeWallet = () => {
    setConnectedId(null)
    setReviewedSignature(null)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="mb-4 text-sm text-muted-foreground">
        <Link to="/" search={DEFAULT_CATALOG_SEARCH} className="hover:text-primary">
          Início
        </Link>{' '}
        /{' '}
        <Link to="/carrinho" className="hover:text-primary">
          Carrinho
        </Link>{' '}
        / <span aria-current="page">Pagamento</span>
      </nav>
      <h1 className="sr-only">Pagamento</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
        <form id="checkout-form" noValidate onSubmit={review} className="space-y-4">
          <h2 className="font-semibold">Perfil do colecionador</h2>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Nome de exibição" name="name" required autoComplete="name" defaultValue={buyer.name} error={form.errors.name} />
            <Field label="E-mail" name="email" type="email" required autoComplete="email" defaultValue={buyer.email} error={form.errors.email} />
            <SelectField
              label="Rede"
              name="network"
              required
              value={network}
              onChange={(event) => {
                setSelectedNetwork(event.target.value as Network)
                changeWallet()
              }}
              options={NETWORKS.map((item) => [item, NETWORK_LABELS[item]])}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="checkout-note" className="block text-sm font-medium">
                Observação do colecionador (opcional)
              </label>
              <textarea
                id="checkout-note"
                name="note"
                rows={4}
                maxLength={280}
                defaultValue={buyer.note}
                aria-invalid={!!form.errors.note}
                className="block w-full max-w-sm rounded-md border border-input bg-transparent px-2.5 py-2 text-sm"
              />
              {form.errors.note && <p className="text-sm text-destructive">{form.errors.note}</p>}
            </div>
          </div>
          <p className="text-sm">
            <Link to="/carteiras" className="text-primary underline">
              Usar outra carteira?
            </Link>{' '}
            <span className="text-muted-foreground">Cadastre ou edite suas carteiras.</span>
          </p>
        </form>

        <aside aria-label="Revisão do pedido" className="h-fit space-y-5">
          <div>
            <h2 className="font-semibold">Seus NFTs</h2>
            <div aria-hidden className="mt-2 flex justify-between text-sm font-semibold">
              <span>NFTs</span>
              <span>Subtotal</span>
            </div>
            <ul className="mt-2 space-y-2">
              {cart?.items.map((item) => (
                <li key={`${item.nftId}:${item.edition}`} className="flex items-center gap-3 rounded-md bg-card p-2 text-sm">
                  <img src={item.nft.image} alt="" width={600} height={600} className="size-10 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.nft.name}</p>
                    <p className="text-xs text-muted-foreground">ID do token: {item.tokenId}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <span className="sr-only">Quantidade: </span>(x {item.quantity})
                  </span>
                  <span className="font-semibold text-primary">{item.lineTotal} ETH</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-center text-xs">
              Tem um código promocional?{' '}
              <Link to="/carrinho" className="text-primary underline">
                Aplique aqui
              </Link>
            </p>
          </div>

          <QuoteSummary quote={quote} />

          <fieldset>
            <legend className="mb-3 w-full text-center font-semibold">Carteira e rede</legend>
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
              <div className="space-y-2">
                {networkWallets.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card p-3 text-sm has-checked:border-primary has-focus-visible:outline-2 has-focus-visible:outline-primary',
                    )}
                  >
                    <input
                      type="radio"
                      name="walletId"
                      value={item.id}
                      checked={wallet?.id === item.id}
                      onChange={() => {
                        setWalletId(item.id)
                        changeWallet()
                      }}
                      className="size-4 accent-primary"
                    />
                    <WalletIcon aria-hidden className="size-4 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {PROVIDER_LABELS[item.provider]} · {item.ens || shortAddress(item.address)} · Rede {NETWORK_LABELS[item.network]}
                      </span>
                    </span>
                  </label>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p role="status" className="text-sm">
                    {isConnected ? 'Carteira conectada.' : 'Carteira desconectada.'}
                  </p>
                  {isConnected ? (
                    <Button type="button" variant="outline" size="sm" onClick={changeWallet}>
                      <Plug aria-hidden /> Desconectar
                    </Button>
                  ) : (
                    <Button type="button" size="sm" disabled={connection.isPending} onClick={() => wallet && connection.mutate(wallet.id)}>
                      <PlugZap aria-hidden /> {connection.isPending ? 'Aguardando a carteira…' : 'Conectar carteira'}
                    </Button>
                  )}
                </div>
                {connection.isError && !isConnected && <FormError message={errorMessage(connection.error)} />}
              </div>
            )}
          </fieldset>

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
            <>
              <Button type="submit" form="checkout-form" className="w-full" disabled={!quote}>
                Revisar pedido
              </Button>
              <p className="text-center text-xs text-muted-foreground">Confira os dados, conecte a carteira e revise antes de confirmar.</p>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
