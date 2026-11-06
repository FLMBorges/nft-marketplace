import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { FaFacebook } from 'react-icons/fa6'
import { FcGoogle } from 'react-icons/fc'
import { login, register } from '@/api/session'
import { Hero } from '@/components/home/hero'
import { Field, FormError, PasswordField } from '@/components/form/field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { comingSoon } from '@/lib/coming-soon'
import { useFormErrors } from '@/lib/form'
import { loginSchema, registerSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { useAuthSuccess } from './use-auth-success'

type Mode = 'login' | 'register'
const TAB_CLASS = 'px-2 hover:text-primary aria-[current=page]:text-primary'

/**
 * Login e cadastro abrem como janela sobre a home (como no Figma). No mobile a janela ocupa a tela toda.
 * A home ao fundo é decorativa: fica inerte (sem foco e fora da árvore de acessibilidade).
 */
export function AuthDialog({ mode, redirect, expired }: { mode: Mode; redirect?: string; expired?: boolean }) {
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  return (
    <>
      <div inert aria-hidden className="pointer-events-none opacity-50 select-none">
        <Hero />
      </div>
      <Dialog open onOpenChange={(open) => !open && navigate({ to: '/', search: DEFAULT_CATALOG_SEARCH })}>
        <DialogContent className="gap-0 border-0 border-b-4 border-b-primary bg-card p-0 max-sm:flex max-sm:h-dvh max-sm:max-w-none max-sm:flex-col max-sm:justify-center max-sm:rounded-none max-sm:border-b-0 sm:max-w-sm">
          <p aria-hidden className="mb-10 text-center text-2xl font-bold tracking-[0.3em] sm:hidden">
            KURIO
          </p>
          <nav aria-label="Acesso" className="flex items-center justify-center gap-1 pt-6 text-sm">
            <Link to="/login" search={{ redirect }} replace aria-current={isLogin ? 'page' : undefined} className={TAB_CLASS}>
              Entrar
            </Link>
            <span aria-hidden className="text-muted-foreground">
              |
            </span>
            <Link to="/cadastro" search={{ redirect }} replace aria-current={isLogin ? undefined : 'page'} className={TAB_CLASS}>
              Criar conta
            </Link>
          </nav>
          <DialogTitle className="sr-only">{isLogin ? 'Entrar na Kurio' : 'Criar conta na Kurio'}</DialogTitle>
          <DialogDescription className="mx-auto mt-3 max-w-64 text-center text-xs text-muted-foreground">
            {isLogin
              ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
              : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
          </DialogDescription>

          {expired && (
            <p role="status" className="mx-6 mt-4 rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs">
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </p>
          )}

          <div className="px-6 pt-5 pb-6">{isLogin ? <LoginForm redirect={redirect} /> : <RegisterForm redirect={redirect} />}</div>

          <div className="border-t border-border px-6 py-5">
            <p className="mb-3 text-center text-xs">Ou continue com</p>
            <div className="space-y-2">
              <Button type="button" variant="outline" className="w-full" onClick={comingSoon}>
                <FcGoogle aria-hidden /> Continuar com Google
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={comingSoon}>
                <FaFacebook aria-hidden className="text-[#1877f2]" /> Continuar com Facebook
              </Button>
            </div>
            <p className="mt-5 text-center text-xs text-muted-foreground sm:hidden">
              {isLogin ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
              <Link to={isLogin ? '/cadastro' : '/login'} search={{ redirect }} replace className="text-primary underline">
                {isLogin ? 'Crie uma conta' : 'Entre'}
              </Link>
            </p>
          </div>

          {isLogin && (
            <p className={cn('px-6 pb-4 text-center text-[0.7rem] text-muted-foreground')}>
              Demonstração: <strong>ana@kurio.dev</strong> ou <strong>bruno@kurio.dev</strong>, senha <strong>Kurio@2026</strong>.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function LoginForm({ redirect }: { redirect?: string }) {
  const { errors, formError, validate, fromApi } = useFormErrors()
  const mutation = useMutation({ mutationFn: login, onSuccess: useAuthSuccess(redirect) })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = validate(loginSchema, form)
    if (data) mutation.mutate(data, { onError: (error) => fromApi(error, form) })
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-3">
      <FormError message={formError} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="contato@email.com" error={errors.email} labelClassName="sr-only" />
      <PasswordField label="Senha" name="password" autoComplete="current-password" placeholder="Senha" error={errors.password} labelClassName="sr-only" />
      <div className="text-right">
        <button type="button" onClick={comingSoon} className="text-xs text-primary hover:underline">
          Esqueceu a senha?
        </button>
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

function RegisterForm({ redirect }: { redirect?: string }) {
  const { errors, formError, validate, fromApi } = useFormErrors()
  const mutation = useMutation({ mutationFn: register, onSuccess: useAuthSuccess(redirect) })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = validate(registerSchema, form)
    if (data) mutation.mutate(data, { onError: (error) => fromApi(error, form) })
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-3">
      <FormError message={formError} />
      <Field label="Nome de usuário" name="name" autoComplete="name" placeholder="Nome de usuário" error={errors.name} labelClassName="sr-only" />
      <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="Digite seu e-mail" error={errors.email} labelClassName="sr-only" />
      <PasswordField
        label="Senha"
        name="password"
        autoComplete="new-password"
        placeholder="Senha"
        hint="Mínimo de 8 caracteres, com letras e números."
        error={errors.password}
        labelClassName="sr-only"
      />
      <PasswordField
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword}
        labelClassName="sr-only"
      />
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
