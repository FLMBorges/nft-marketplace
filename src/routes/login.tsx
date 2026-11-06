import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return <h1 className="mx-auto max-w-6xl px-4 py-12 text-2xl font-bold">Entrar</h1>
}
