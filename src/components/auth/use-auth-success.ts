import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { Session } from '@/types/user'

/** Depois de entrar: troca os dados em cache pelos do novo usuário e volta para onde a pessoa estava. */
export function useAuthSuccess(redirect: string | undefined) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return (session: Session) => {
    queryClient.removeQueries({ queryKey: ['user'] })
    queryClient.removeQueries({ queryKey: ['cart'] })
    queryClient.setQueryData(['session'], session)
    router.navigate({ href: redirect ?? '/' })
  }
}
