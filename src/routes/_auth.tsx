import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQuery } from '@/api/session'

/** Rotas privadas (checkout, perfil, carteiras, pedidos): sem sessão, vai para o login e volta depois. */
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { user: session.user }
  },
  component: Outlet,
})
