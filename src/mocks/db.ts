import type { Nft } from '@/types/nft'
import { nftFixtures } from './fixtures/nfts'

type Db = {
  nfts: Nft[]
}

const STORAGE_KEY = 'kurio-mock-db:v1'

const seed = (): Db => structuredClone({ nfts: nftFixtures })

function load(): Db {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : seed()
  } catch {
    return seed()
  }
}

/** Estado do "servidor". Os handlers leem e alteram este objeto. */
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