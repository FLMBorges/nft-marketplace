import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { changePassword, updateAvatar, updateProfile } from '@/api/account'
import { errorMessage } from '@/api/client'
import { useFavorites } from '@/api/favorites'
import { nftQuery } from '@/api/nfts'
import { useSession } from '@/api/session'
import { NftCard } from '@/components/catalog/nft-card'
import { Field, FormError } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { useFormErrors } from '@/lib/form'
import { avatarSchema, passwordChangeSchema, profileSchema } from '@/lib/schemas'
import type { Session, User } from '@/types/user'

export const Route = createFileRoute('/_auth/perfil')({
  component: ProfilePage,
})

const MAX_AVATAR_BYTES = 1_000_000

function ProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const user = session?.user
  const profileForm = useFormErrors()
  const passwordForm = useFormErrors()
  const avatarInput = useRef<HTMLInputElement>(null)

  /** A sessão em cache também guarda o usuário: atualiza para o header refletir na hora. */
  const syncUser = (updated: User) =>
    queryClient.setQueryData<Session | null>(['session'], (old) => (old ? { ...old, user: updated } : old))

  const profile = useMutation({ mutationFn: updateProfile, onSuccess: syncUser })
  const avatar = useMutation({ mutationFn: updateAvatar, onSuccess: syncUser })
  const password = useMutation({ mutationFn: changePassword })

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = profileForm.validate(profileSchema, form)
    if (data) {
      profile.mutate(data, {
        onSuccess: () => toast.success('Dados atualizados.'),
        onError: (error) => profileForm.fromApi(error, form),
      })
    }
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = passwordForm.validate(passwordChangeSchema, form)
    if (data) {
      password.mutate(data, {
        onSuccess: () => {
          form.reset()
          toast.success('Senha alterada.')
        },
        onError: (error) => passwordForm.fromApi(error, form),
      })
    }
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
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt="Seu avatar" width={80} height={80} className="size-20 rounded-full object-cover" />
        ) : (
          <span aria-hidden className="grid size-20 place-items-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {user.name[0]}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} className="sr-only" tabIndex={-1} aria-hidden />
          <Button variant="outline" disabled={avatar.isPending} onClick={() => avatarInput.current?.click()}>
            {avatar.isPending ? 'Enviando…' : 'Alterar avatar'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/carteiras">Minhas carteiras</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <form noValidate onSubmit={submitProfile} aria-labelledby="profile-title" className="space-y-4 rounded-lg bg-card p-6">
          <h2 id="profile-title" className="font-semibold">
            Dados pessoais
          </h2>
          <FormError message={profileForm.formError} />
          <Field label="Nome" name="name" autoComplete="name" defaultValue={user.name} error={profileForm.errors.name} />
          <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={user.email} error={profileForm.errors.email} />
          <Field label="Telefone" name="phone" type="tel" autoComplete="tel" defaultValue={user.phone} error={profileForm.errors.phone} />
          <Button type="submit" disabled={profile.isPending}>
            {profile.isPending ? 'Salvando…' : 'Salvar dados'}
          </Button>
        </form>

        <form noValidate onSubmit={submitPassword} aria-labelledby="password-title" className="space-y-4 rounded-lg bg-card p-6">
          <h2 id="password-title" className="font-semibold">
            Alterar senha
          </h2>
          <FormError message={passwordForm.formError} />
          <Field label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" error={passwordForm.errors.currentPassword} />
          <Field
            label="Nova senha"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={passwordForm.errors.newPassword}
          />
          <Field label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" error={passwordForm.errors.confirmPassword} />
          <Button type="submit" disabled={password.isPending}>
            {password.isPending ? 'Alterando…' : 'Alterar senha'}
          </Button>
        </form>
      </div>

      <Favorites />
    </section>
  )
}

function Favorites() {
  const { data: ids = [], isPending } = useFavorites()
  const nfts = useQueries({ queries: ids.map((id) => nftQuery(id)) })

  return (
    <section aria-labelledby="favorites-title">
      <h2 id="favorites-title" className="font-semibold">
        Favoritos
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
