import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { validateAuthSearch } from '@/lib/redirect'

export const Route = createFileRoute('/cadastro')({
  validateSearch: validateAuthSearch,
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  return <AuthDialog mode="register" redirect={redirect} />
}
