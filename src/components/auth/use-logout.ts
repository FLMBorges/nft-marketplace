import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { clearPrivateData } from '@/api/query-client'
import { logout } from '@/api/session'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logout,
    // Mesmo se a chamada falhar, o cliente descarta tudo da sessão: dados privados não ficam na tela.
    onSettled: () => {
      clearPrivateData()
      toast.success('Você saiu da conta.')
      navigate({ to: '/', search: DEFAULT_CATALOG_SEARCH })
    },
  })
}
