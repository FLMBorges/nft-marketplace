import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { SESSION_EXPIRED_EVENT } from '@/api/client'
import { clearPrivateData } from '@/api/query-client'

/** Reage à sessão expirada: limpa dados privados e, se a tela for privada, leva ao login voltando para cá depois. */
export function SessionWatcher() {
  const router = useRouter()

  useEffect(() => {
    function handleExpired() {
      clearPrivateData()
      const isPrivate = router.state.matches.some((match) => match.routeId.startsWith('/_auth'))
      if (isPrivate) router.navigate({ to: '/login', search: { redirect: router.state.location.href, expired: true } })
      else toast.warning('Sua sessão expirou. Entre novamente quando quiser.', { id: 'session-expired' })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [router])

  return null
}
