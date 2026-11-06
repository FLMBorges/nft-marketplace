import { useEffect, useRef, useState } from 'react'
import type { CartItem } from '@/types/cart'

/**
 * Compara o carrinho atual com o anterior e lista o que mudou (preço ou disponibilidade)
 * enquanto a página estava aberta, para avisar o usuário em vez de mudar valores em silêncio.
 */
export function usePriceChanges(items: CartItem[] | undefined) {
  const previous = useRef<Map<string, CartItem>>(null)
  const [changes, setChanges] = useState<string[]>([])

  useEffect(() => {
    if (!items) return
    const current = new Map(items.map((item) => [`${item.nftId}:${item.edition}`, item]))
    if (previous.current) {
      const changed = items.flatMap((item) => {
        const before = previous.current!.get(`${item.nftId}:${item.edition}`)
        if (!before) return []
        if (before.unitPrice !== item.unitPrice) return [`${item.nft.name}: preço mudou de ${before.unitPrice} para ${item.unitPrice} ETH.`]
        if (before.available !== item.available) return [`${item.nft.name}: disponibilidade mudou para ${item.available}.`]
        return []
      })
      if (changed.length) setChanges((old) => [...old, ...changed])
    }
    previous.current = current
  }, [items])

  return { changes, dismiss: () => setChanges([]) }
}
