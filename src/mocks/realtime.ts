import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { RealtimeEvent } from '@/types/events'
import type { Nft } from '@/types/nft'
import { currentUserIdFromDocument } from './auth'
import { db, persist } from './db'

/**
 * Servidor Socket.IO simulado. O `socket.io-client` da aplicação conecta via WebSocket,
 * o MSW intercepta a conexão e o `@mswjs/socket.io-binding` traduz o protocolo do Socket.IO.
 */
// O MSW remove o prefixo /socket.io/ antes de comparar, então o link é só a origem.
const link = ws.link(location.origin.replace(/^http/, 'ws'))

type Client = { emit: (event: string, payload: unknown) => void; close: () => void; userId: string | null }
const clients = new Set<Client>()
const history: RealtimeEvent[] = []

/** O binding faz o handshake mas não envia pings; sem eles o cliente desconecta após ~30s. */
const PING_INTERVAL_MS = 20_000

export const socketHandler = link.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
  // Eventos privados (pedidos) só vão para a conexão do dono, identificado no momento da conexão.
  const client: Client = {
    emit: (event, payload) => io.client.emit(event, payload),
    close: () => connection.client.close(),
    userId: currentUserIdFromDocument(),
  }
  clients.add(client)
  connection.client.addEventListener('close', () => {
    clearInterval(ping)
    clients.delete(client)
  })
})

function deliver(event: RealtimeEvent) {
  for (const client of clients) {
    if (event.type === 'order.updated' && client.userId !== event.userId) continue
    client.emit(event.type, event)
  }
}

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

export function emitEvent(event: WithoutId<RealtimeEvent>) {
  db.eventSeq += 1
  persist()
  const full = { ...event, id: `evt_${db.eventSeq}` } as RealtimeEvent
  history.push(full)
  deliver(full)
  return full
}

export function emitNftUpdated(nft: Nft) {
  return emitEvent({
    type: 'nft.updated',
    resourceId: nft.id,
    version: nft.version,
    data: { price: nft.price, previousPrice: nft.previousPrice, editions: nft.editions },
  })
}

/** Reenvia o último evento com o mesmo id (duplicata). */
export function replayLastEvent() {
  const last = history.at(-1)
  if (last) deliver(last)
  return last ?? null
}

/** Envia um evento novo, mas com versão antiga do recurso: o cliente deve ignorá-lo. */
export function emitStaleNftEvent(nft: Nft) {
  return emitEvent({
    type: 'nft.updated',
    resourceId: nft.id,
    version: Math.max(0, nft.version - 1),
    data: { price: '999', previousPrice: null, editions: nft.editions.map((edition) => ({ ...edition, available: 0 })) },
  })
}

export function disconnectAll() {
  for (const client of clients) client.close()
}
