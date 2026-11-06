import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { changePassword, removeAvatar, updateAvatar, updateProfile } from '@/api/account'
import { errorMessage, getApiError } from '@/api/client'
import { useFavorites } from '@/api/favorites'
import { nftQuery } from '@/api/nfts'
import { useSession } from '@/api/session'
import { AccountLayout } from '@/components/account/account-layout'
import { NftCard } from '@/components/catalog/nft-card'
import { Field, FormError, PasswordField, RequiredMark } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formValues } from '@/lib/form'
import { avatarSchema, fieldErrors, passwordChangeSchema, profileSchema } from '@/lib/schemas'
import type { Session, User } from '@/types/user'

export const Route = createFileRoute('/_auth/perfil')({
  component: ProfilePage,
})

const MAX_AVATAR_BYTES = 1_000_000

function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const user = session?.user
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)

  /** A sessão em cache também guarda o usuário: atualiza para o header refletir na hora. */
  const syncUser = (updated: User) =>
    queryClient.setQueryData<Session | null>(['session'], (old) => (old ? { ...old, user: updated } : old))

  const save = useMutation({
    /** Salva os dados e, se algum campo de senha foi preenchido, também troca a senha. */
    mutationFn: async ({ profile, password }: { profile: Record<string, string>; password: Record<string, string> | null }) => {
      const updated = await updateProfile(profile)
      syncUser(updated)
      if (password) await changePassword(password)
      return !!password
    },
  })
  const avatar = useMutation({ mutationFn: updateAvatar, onSuccess: syncUser })
  const dropAvatar = useMutation({ mutationFn: removeAvatar, onSuccess: syncUser })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = formValues(form)
    const profile = profileSchema.safeParse(values)
    const wantsPassword = !!(values.currentPassword || values.newPassword || values.confirmPassword)
    const password = wantsPassword ? passwordChangeSchema.safeParse(values) : null
    const nextErrors = {
      ...(profile.success ? {} : fieldErrors(profile.error)),
      ...(password && !password.success ? fieldErrors(password.error) : {}),
    }
    setErrors(nextErrors)
    setFormError(null)
    const focusFirstError = () => requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    if (!profile.success || (password && !password.success)) return focusFirstError()

    save.mutate(
      { profile: profile.data, password: password?.success ? password.data : null },
      {
        onSuccess: (changedPassword) => {
          for (const name of ['currentPassword', 'newPassword', 'confirmPassword']) form.querySelector<HTMLInputElement>(`[name=${name}]`)!.value = ''
          toast.success(changedPassword ? 'Dados e senha atualizados.' : 'Dados atualizados.')
        },
        onError: (error) => {
          const fields = getApiError(error)?.fields
          setErrors(fields ?? {})
          setFormError(fields ? null : errorMessage(error))
          if (fields) focusFirstError()
        },
      },
    )
  }

  function pickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) return toast.error('A imagem precisa ter no máximo 1 MB.')
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = avatarSchema.safeParse({ dataUrl: reader.result })
      if (!parsed.success) return toast.error(parsed.error.issues[0].message)
      avatar.mutate(parsed.data.dataUrl, {
        onSuccess: () => toast.success('Avatar atualizado.'),
        onError: (error) => toast.error(errorMessage(error)),
      })
    }
    reader.readAsDataURL(file)
  }

  if (!user) return null

  return (
    <AccountLayout>
      <form noValidate onSubmit={submit} aria-labelledby="profile-title" className="space-y-8">
        <h1 id="profile-title" className="font-semibold">
          Perfil do colecionador
        </h1>
        <FormError message={formError} />

        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Nome de exibição" name="name" required autoComplete="name" defaultValue={user.name} error={errors.name} />
          <Field label="Nome de usuário" name="username" required autoComplete="username" defaultValue={user.username} error={errors.username} />
          <Field label="E-mail" name="email" type="email" required autoComplete="email" defaultValue={user.email} error={errors.email} />
          <EnsField defaultValue={user.ensName} error={errors.ensName} />

          <div className="space-y-1.5 sm:col-start-2">
            <p className="text-sm font-medium">Avatar</p>
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt="Seu avatar" width={40} height={40} className="size-10 rounded-full object-cover" />
              ) : (
                <span aria-hidden className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                  <ImageIcon className="size-4" />
                </span>
              )}
              <input
                ref={avatarInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={pickAvatar}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
              />
              <Button type="button" size="sm" disabled={avatar.isPending} onClick={() => avatarInput.current?.click()}>
                {avatar.isPending ? 'Enviando…' : 'Alterar avatar'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!user.avatar || dropAvatar.isPending}
                onClick={() => dropAvatar.mutate(undefined, { onSuccess: () => toast.success('Avatar removido.') })}
              >
                Remover avatar
              </Button>
            </div>
          </div>
        </div>

        <fieldset className="max-w-sm space-y-4">
          <legend className="mb-4 font-semibold">Alterar senha</legend>
          <PasswordField label="Senha atual" name="currentPassword" autoComplete="current-password" error={errors.currentPassword} />
          <PasswordField
            label="Nova senha"
            name="newPassword"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={errors.newPassword}
          />
          <PasswordField label="Confirmar nova senha" name="confirmPassword" autoComplete="new-password" error={errors.confirmPassword} />
        </fieldset>

        <Button type="submit" className="px-8" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </form>

      <Favorites />
    </AccountLayout>
  )
}

/** Nome ENS: o sufixo `.eth` é fixo e fica ao lado do campo. */
function EnsField({ defaultValue, error }: { defaultValue: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="profile-ens" className="text-sm font-medium">
        Nome ENS
        <RequiredMark />
      </label>
      <div className="flex">
        <span aria-hidden className="grid place-items-center rounded-l-md border border-r-0 border-input bg-secondary px-2 text-xs">
          .eth
        </span>
        <Input
          id="profile-ens"
          name="ensName"
          defaultValue={defaultValue}
          aria-invalid={!!error}
          aria-describedby={error ? 'profile-ens-error' : 'profile-ens-hint'}
          className="rounded-l-none"
        />
      </div>
      <p id="profile-ens-hint" className="sr-only">
        Sem o sufixo .eth
      </p>
      {error && (
        <p id="profile-ens-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Favorites() {
  const { data: ids = [], isPending } = useFavorites()
  const nfts = useQueries({ queries: ids.map((id) => nftQuery(id)) })

  return (
    <section id="favoritos" aria-labelledby="favorites-title" className="mt-12 scroll-mt-8">
      <h2 id="favorites-title" className="font-semibold">
        Lista de interesse
      </h2>
      {isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando favoritos…</p>
      ) : ids.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Você ainda não favoritou nenhum NFT.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {nfts.map(({ data }) => data && <li key={data.id}><NftCard nft={data} /></li>)}
        </ul>
      )}
    </section>
  )
}
