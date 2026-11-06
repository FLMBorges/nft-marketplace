import type { Network } from './nft'

export type User = {
  id: string
  name: string
  email: string
  username: string
  /** Nome ENS sem o sufixo `.eth`. */
  ensName: string
  avatar: string | null
}

export type Session = {
  user: User
  expiresAt: string
}

export const WALLET_SLOTS = ['primary', 'secondary'] as const
export const WALLET_PROVIDERS = ['metamask', 'walletconnect', 'coinbase'] as const

export type WalletSlot = (typeof WALLET_SLOTS)[number]
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export type Wallet = {
  id: string
  slot: WalletSlot
  label: string
  provider: WalletProvider
  network: Network
  address: string
  /** Nome ENS opcional (ex.: `nova.kurio.eth`). */
  ens: string
}
