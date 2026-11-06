import type { User, Wallet } from '@/types/user'

export type DbUser = User & { salt: string; passwordHash: string }

/**
 * Usuários de demonstração. Senha de ambos: Kurio@2026.
 * Guardamos só o hash SHA-256 de `salt:senha`, nunca a senha em claro.
 */
export const userFixtures: DbUser[] = [
  {
    id: 'usr_ana',
    name: 'Ana Colecionadora',
    email: 'ana@kurio.dev',
    username: 'ana.coleciona',
    ensName: 'ana',
    avatar: null,
    salt: 'a1f3c9e2',
    passwordHash: '25687746db8a1d3b3034f6875df24e3bb9784c1fab79cff995d1614e7b781b19',
  },
  {
    id: 'usr_bruno',
    name: 'Bruno Criador',
    email: 'bruno@kurio.dev',
    username: 'bruno.cria',
    ensName: '',
    avatar: null,
    salt: 'b7d4e810',
    passwordHash: '9af4365d3e3683e62797e426f578b80fe1a5be4d4842a40bb204c758a455689f',
  },
]

export const walletFixtures: (Wallet & { userId: string })[] = [
  {
    id: 'wal_ana_primary',
    userId: 'usr_ana',
    slot: 'primary',
    label: 'MetaMask principal',
    provider: 'metamask',
    network: 'ethereum',
    address: '0x7a42c0ffee254729296a45a3885639AC7E10F9d5',
    ens: 'ana.eth',
  },
  {
    id: 'wal_bruno_primary',
    userId: 'usr_bruno',
    slot: 'primary',
    label: 'Coinbase',
    provider: 'coinbase',
    network: 'polygon',
    address: '0x19E9b52a1a7E4d3C6f2B8a0D5c7E9F1a2B3c4D5e',
    ens: '',
  },
]

export const COUPONS: Record<string, { percent: number; expired: boolean }> = {
  KURIO10: { percent: 10, expired: false },
  BEMVINDO15: { percent: 15, expired: false },
  EXPIRADO10: { percent: 10, expired: true },
}
