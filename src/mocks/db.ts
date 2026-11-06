import type { EditionType, Nft } from '@/types/nft'
import type { Order } from '@/types/order'
import type { Wallet } from '@/types/user'
import { nftFixtures } from './fixtures/nfts'
import { userFixtures, walletFixtures, type DbUser } from './fixtures/users'

export type DbCartLine = { nftId: string; edition: EditionType; quantity: number }
export type DbOrder = Order & {
  idempotencyKey: string
  requestHash: string
  /** Momento em que a simulação resolve o pagamento. */
  settleAt: string
  /** Resultado decidido pelo cenário no momento da criação: torna o teste reproduzível. */
  outcome: 'confirm' | 'decline'
}

type Db = {
  nfts: Nft[]
  users: DbUser[]
  sessions: { token: string; userId: string; expiresAt: string }[]
  favorites: Record<string, string[]>
  /** Chave `u:<userId>` para usuário autenticado ou `g:<guestId>` para visitante. */
  carts: Record<string, { lines: DbCartLine[]; coupon: string | null }>
  wallets: (Wallet & { userId: string })[]
  orders: DbOrder[]
  eventSeq: number
}

const STORAGE_KEY = 'kurio-mock-db:v3'

const seed = (): Db =>
  structuredClone({
    nfts: nftFixtures,
    users: userFixtures,
    sessions: [],
    favorites: {},
    carts: {},
    wallets: walletFixtures,
    orders: [],
    eventSeq: 0,
  })

function load(): Db {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : seed()
  } catch {
    return seed()
  }
}

/** Estado do "servidor". Os handlers leem e alteram este objeto e chamam `persist()`. */
export const db = load()

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sem armazenamento (aba anônima, cota cheia): os dados ficam só na memória.
  }
}

export function resetDb() {
  Object.assign(db, seed())
  persist()
}

export const findNft = (id: string) => db.nfts.find((nft) => nft.id === id)
