import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useSession } from '@/api/session'
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/types/events'
import { applyNftUpdated, applyOrderUpdated } from './apply-events'

/**
 * Mantém uma conexão Socket.IO por sessão. Trocar de usuário (ou sair) fecha a conexão anterior
 * e abre outra: eventos privados da sessão antiga nunca chegam na nova.
 */
export function RealtimeSync() {
  const queryClient = useQueryClient()
  const { data: session, isPending } = useSession()
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (isPending) return
    const socket = io({ path: '/socket.io', transports: ['websocket'] })
    const seenIds = new Set<string>()
    const versions = new Map<string, number>()

    /** Descarta duplicatas (mesmo id) e eventos antigos (versão menor ou igual à última aplicada). */
    function accept(event: RealtimeEvent) {
      const key = `${event.type}:${event.resourceId}`
      if (seenIds.has(event.id) || (versions.get(key) ?? 0) >= event.version) return false
      seenIds.add(event.id)
      versions.set(key, event.version)
      return true
    }

    socket.on('nft.updated', (event: NftUpdatedEvent) => {
      if (accept(event)) applyNftUpdated(queryClient, event)
    })
    socket.on('order.updated', (event: OrderUpdatedEvent) => {
      if (event.userId === userId && accept(event)) applyOrderUpdated(queryClient, event)
    })
    // Eventos podem ter se perdido enquanto desconectado: reconcilia o que está na tela com a API REST.
    socket.io.on('reconnect', () => queryClient.invalidateQueries({ type: 'active' }))

    return () => {
      socket.removeAllListeners()
      socket.io.removeAllListeners()
      socket.disconnect()
    }
  }, [queryClient, userId, isPending])

  return null
}
