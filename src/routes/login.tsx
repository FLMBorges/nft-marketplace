import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { login } from '@/api/session'
import { useAuthSuccess } from '@/components/auth/use-auth-success'
import { Field, FormError } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { useFormErrors } from '@/lib/form'
import { safeRedirect } from '@/lib/redirect'
import { loginSchema } from '@/lib/schemas'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; expired?: boolean } => ({
    redirect: safeRedirect(search.redirect),
    expired: search.expired === true || search.expired === 'true' || undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect, expired } = Route.useSearch()
  const { errors, formError, validate, fromApi } = useFormErrors()
  const onSuccess = useAuthSuccess(redirect)
  const mutation = useMutation({ mutationFn: login, onSuccess })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = validate(loginSchema, form)
    if (data) mutation.mutate(data, { onError: (error) => fromApi(error, form) })
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-2 text-sm text-muted-foreground">Acesse sua conta para comprar, favoritar e acompanhar pedidos.</p>

      {expired && (
        <p role="status" className="mt-6 rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm">
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}

      <form noValidate onSubmit={submit} className="mt-8 space-y-4 rounded-lg bg-card p-6">
        <FormError message={formError} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Senha" name="password" type="password" autoComplete="current-password" error={errors.password} />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
        <p className="text-center text-sm">
          Não tem conta?{' '}
          <Link to="/cadastro" search={{ redirect }} className="text-primary underline">
            Cadastre-se
          </Link>
        </p>
      </form>

      <p className="mt-6 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        Demonstração: <strong>ana@kurio.dev</strong> ou <strong>bruno@kurio.dev</strong>, senha <strong>Kurio@2026</strong>.
      </p>
    </section>
  )
}
