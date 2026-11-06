import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { saveWallet, useWallets, walletsKey } from '@/api/account'
import { AccountLayout } from '@/components/account/account-layout'
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
    <AccountLayout>
      <h1 className="sr-only">Carteiras</h1>
      {isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="space-y-12">
          <WalletSection slot="primary" wallet={wallets?.find((item) => item.slot === 'primary')} />
          <WalletSection
            slot="secondary"
            wallet={wallets?.find((item) => item.slot === 'secondary')}
            locked={!wallets?.some((item) => item.slot === 'primary')}
          />
        </div>
      )}
    </AccountLayout>
  )
}

function WalletSection({ slot, wallet, locked = false }: { slot: WalletSlot; wallet?: Wallet; locked?: boolean }) {
  const [open, setOpen] = useState(!!wallet || slot === 'primary')
  const title = slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'

  return (
    <section aria-labelledby={`wallet-${slot}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={`wallet-${slot}`} className="font-semibold">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {slot === 'primary'
              ? 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.'
              : wallet
                ? 'Use como alternativa no pagamento.'
                : 'Você ainda não adicionou uma carteira secundária.'}
          </p>
        </div>
        {!open && (
          <Button variant="link" className="h-auto p-0 text-primary" disabled={locked} onClick={() => setOpen(true)}>
            Adicionar
          </Button>
        )}
      </div>
      {locked && !open && <p className="mt-2 text-xs text-muted-foreground">Cadastre a carteira principal primeiro.</p>}
      {open && <WalletForm slot={slot} wallet={wallet} title={title} />}
    </section>
  )
}

function WalletForm({ slot, wallet, title }: { slot: WalletSlot; wallet?: Wallet; title: string }) {
  const { user } = Route.useRouteContext()
  const queryClient = useQueryClient()
  const { errors, formError, validate, fromApi } = useFormErrors()
  const mutation = useMutation({
    mutationFn: (body: Record<string, string>) => saveWallet(slot, body),
    onSuccess: (list) => queryClient.setQueryData(walletsKey(user.id), list),
  })

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
    <form noValidate onSubmit={submit} aria-label={title} className="mt-6 space-y-4">
      <FormError message={formError} />
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field label="Apelido da carteira" name="label" required defaultValue={wallet?.label} error={errors.label} />
        <SelectField
          label="Tipo de carteira"
          name="provider"
          required
          defaultValue={wallet?.provider ?? 'metamask'}
          error={errors.provider}
          options={WALLET_PROVIDERS.map((provider) => [provider, PROVIDER_LABELS[provider]])}
        />
        <SelectField
          label="Rede"
          name="network"
          required
          defaultValue={wallet?.network ?? 'ethereum'}
          error={errors.network}
          options={NETWORKS.map((network) => [network, NETWORK_LABELS[network]])}
        />
        <Field
          label="Endereço da carteira"
          name="address"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="Endereço 0x da carteira"
          defaultValue={wallet?.address}
          hint="Ethereum e Polygon: 0x seguido de 40 caracteres. Solana: 32 a 44 caracteres."
          error={errors.address}
        />
        <Field
          label="Nome ENS (opcional)"
          name="ens"
          autoComplete="off"
          placeholder="nome.eth"
          defaultValue={wallet?.ens}
          error={errors.ens}
        />
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
