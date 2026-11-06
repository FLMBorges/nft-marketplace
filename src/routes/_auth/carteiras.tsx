import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { saveWallet, useWallets, walletsKey } from '@/api/account'
import { Field, FormError, SelectField } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormErrors } from '@/lib/form'
import { NETWORK_LABELS, PROVIDER_LABELS } from '@/lib/labels'
import { walletSchema } from '@/lib/schemas'
import { NETWORKS } from '@/types/nft'
import { WALLET_PROVIDERS, type Wallet, type WalletSlot } from '@/types/user'

export const Route = createFileRoute('/_auth/carteiras')({
  component: WalletsPage,
})

function WalletsPage() {
  const { data: wallets, isPending } = useWallets()

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Carteiras</h1>
      <p className="mt-2 text-sm text-muted-foreground">Cadastre a carteira principal e, se quiser, uma secundária para pagar seus pedidos.</p>
      {isPending ? (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <WalletForm slot="primary" wallet={wallets?.find((item) => item.slot === 'primary')} />
          <WalletForm slot="secondary" wallet={wallets?.find((item) => item.slot === 'secondary')} />
        </div>
      )}
    </section>
  )
}

function WalletForm({ slot, wallet }: { slot: WalletSlot; wallet?: Wallet }) {
  const { user } = Route.useRouteContext()
  const queryClient = useQueryClient()
  const { errors, formError, validate, fromApi } = useFormErrors()
  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => saveWallet(slot, body),
    onSuccess: (list) => queryClient.setQueryData(walletsKey(user.id), list),
  })
  const title = slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = validate(walletSchema, form)
    if (data) {
      mutation.mutate(data, {
        onSuccess: () => toast.success(`${title} salva.`),
        onError: (error) => fromApi(error, form),
      })
    }
  }

  return (
    <form noValidate onSubmit={submit} aria-labelledby={`wallet-${slot}`} className="space-y-4 rounded-lg bg-card p-6">
      <h2 id={`wallet-${slot}`} className="font-semibold">
        {title} {!wallet && <span className="text-sm font-normal text-muted-foreground">(não cadastrada)</span>}
      </h2>
      <FormError message={formError} />
      <Field label="Nome da carteira" name="label" defaultValue={wallet?.label} error={errors.label} />
      <SelectField
        label="Provedor"
        name="provider"
        defaultValue={wallet?.provider ?? 'metamask'}
        error={errors.provider}
        options={WALLET_PROVIDERS.map((provider) => [provider, PROVIDER_LABELS[provider]])}
      />
      <SelectField
        label="Rede"
        name="network"
        defaultValue={wallet?.network ?? 'ethereum'}
        error={errors.network}
        options={NETWORKS.map((network) => [network, NETWORK_LABELS[network]])}
      />
      <Field
        label="Endereço"
        name="address"
        autoComplete="off"
        spellCheck={false}
        defaultValue={wallet?.address}
        hint="Ethereum e Polygon: 0x seguido de 40 caracteres. Solana: 32 a 44 caracteres."
        error={errors.address}
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando…' : wallet ? 'Salvar alterações' : 'Cadastrar carteira'}
      </Button>
    </form>
  )
}
