import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/login')({
  validateSearch: validateAuthSearch,
  component: LoginPage,
})

function LoginPage() {
  const { redirect, expired } = Route.useSearch()
  return <AuthDialog mode="login" redirect={redirect} expired={expired} />
}
