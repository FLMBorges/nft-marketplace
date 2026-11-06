import { includes } from '@/lib/includes'
import { isEth } from '@/lib/eth'
import type { EditionType } from '@/types/nft'
import { db, findNft, persist, resetDb } from './db'
import { disconnectAll, emitNftUpdated, emitStaleNftEvent, replayLastEvent } from './realtime'
import { failNext, FAILURE_KEYS, resetScenario, scenario, updateScenario, type FailureKey, type FailureMode, type Scenario } from './scenario'

/**
 * Painel de controle da simulação, usado pelo painel de cenários e pelos testes (`window.__kurioMock`).
 * Cada ação muda o "servidor": a REST passa a responder diferente e os eventos saem pelo Socket.IO.
 */
export const mockControl = {
  getScenario: (): Scenario => structuredClone(scenario),
  setScenario: (patch: Partial<Scenario>) => updateScenario(patch),
  failNext: (key: FailureKey, mode: FailureMode, times = 1) => {
    if (!includes(FAILURE_KEYS, key)) throw new Error(`Chave de falha desconhecida: ${key}`)
    failNext(key, mode, times)
  },

  /** Restaura dados e cenário ao estado inicial conhecido. */
  reset() {
    resetDb()
    resetScenario()
    disconnectAll()
  },

  /** Altera preço e/ou disponibilidade de um NFT e publica `nft.updated`. */
  updateNft(id: string, change: { price?: string; edition?: EditionType; available?: number }) {
    const nft = findNft(id)
    if (!nft) throw new Error(`NFT inexistente: ${id}`)
    if (change.price !== undefined) {
      if (!isEth(change.price)) throw new Error(`Preço inválido: ${change.price}`)
      nft.previousPrice = nft.price
      nft.price = change.price
    }
    if (change.edition && change.available !== undefined) {
      nft.editions = nft.editions.map((entry) => (entry.type === change.edition ? { ...entry, available: change.available! } : entry))
    }
    nft.version += 1
    persist()
    return emitNftUpdated(nft)
  },

  /** Ids dos NFTs no carrinho do usuário logado (ajuda o painel a escolher o que alterar). */
  cartNftIds: () => [...new Set(Object.values(db.carts).flatMap((cart) => cart.lines.map((line) => line.nftId)))],

  /** Resumo dos pedidos (para conferir que nenhuma compra foi duplicada). */
  orders: () => db.orders.map(({ id, userId, status, total }) => ({ id, userId, status, total })),

  replayLastEvent,
  emitStaleNftEvent: (id: string) => {
    const nft = findNft(id)
    if (!nft) throw new Error(`NFT inexistente: ${id}`)
    return emitStaleNftEvent(nft)
  },
  disconnectSockets: disconnectAll,

  /** Faz todas as sessões expirarem agora. */
  expireSessions() {
    const past = new Date(Date.now() - 1000).toISOString()
    db.sessions.forEach((session) => (session.expiresAt = past))
    persist()
  },
}

export type MockControl = typeof mockControl

declare global {
  interface Window {
    __kurioMock?: MockControl
  }
}
