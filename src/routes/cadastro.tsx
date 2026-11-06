import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { register } from '@/api/session'
import { useAuthSuccess } from '@/components/auth/use-auth-success'
import { Field, FormError } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { useFormErrors } from '@/lib/form'
import { safeRedirect } from '@/lib/redirect'
import { registerSchema } from '@/lib/schemas'

export const Route = createFileRoute('/cadastro')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({ redirect: safeRedirect(search.redirect) }),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  const { errors, formError, validate, fromApi } = useFormErrors()
  const onSuccess = useAuthSuccess(redirect)
  const mutation = useMutation({ mutationFn: register, onSuccess })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = validate(registerSchema, form)
    if (data) mutation.mutate(data, { onError: (error) => fromApi(error, form) })
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">Comece sua coleção de arte digital.</p>

      <form noValidate onSubmit={submit} className="mt-8 space-y-4 rounded-lg bg-card p-6">
        <FormError message={formError} />
        <Field label="Nome" name="name" autoComplete="name" error={errors.name} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          error={errors.password}
        />
        <Field label="Confirmar senha" name="confirmPassword" type="password" autoComplete="new-password" error={errors.confirmPassword} />
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
        <p className="text-center text-sm">
          Já tem conta?{' '}
          <Link to="/login" search={{ redirect }} className="text-primary underline">
            Entrar
          </Link>
        </p>
      </form>
    </section>
  )
}
