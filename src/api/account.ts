import { useQuery } from '@tanstack/react-query'
import type { User, Wallet, WalletSlot } from '@/types/user'
import { api } from './client'
import { useSession } from './session'

export const walletsKey = (userId: string) => ['user', userId, 'wallets'] as const

export function useWallets() {
  const userId = useSession().data?.user.id
  return useQuery({
    queryKey: walletsKey(userId ?? ''),
    queryFn: async ({ signal }) => (await api.get<Wallet[]>('/wallets', { signal })).data,
    enabled: !!userId,
  })
}

export const updateProfile = async (body: Record<string, string>) => (await api.put<User>('/profile', body)).data
export const updateAvatar = async (dataUrl: string) => (await api.put<User>('/profile/avatar', { dataUrl })).data
export const changePassword = (body: Record<string, string>) => api.put('/profile/password', body)
export const saveWallet = async (slot: WalletSlot, body: Record<string, string>) => (await api.put<Wallet[]>(`/wallets/${slot}`, body)).data
export const connectWallet = (id: string) => api.post(`/wallets/${id}/connect`)
