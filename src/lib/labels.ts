import type { Category, EditionType, Network, Sort, Tab } from '@/types/nft'
import type { WalletProvider } from '@/types/user'

export const CATEGORY_LABELS: Record<Category, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const SORT_LABELS: Record<Sort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  popular: 'Mais populares',
}

export const TAB_LABELS: Record<Tab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}
export const EDITION_LABELS: Record<EditionType, string> = {
  '1/1': '1/1',
  '1/10': '1/10',
  '1/50': '1/50',
  open: 'Aberta',
}

export const PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`
