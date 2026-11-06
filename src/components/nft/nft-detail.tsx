import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Minus, Plus, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { addCartItem, useCartMutation } from '@/api/cart'
import { errorMessage } from '@/api/client'
import { nftListQuery } from '@/api/nfts'
import { NftCard } from '@/components/catalog/nft-card'
import { Button } from '@/components/ui/button'
import { comingSoon } from '@/lib/coming-soon'
import { EDITION_LABELS, NETWORK_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { EDITION_TYPES, type EditionType, type Nft } from '@/types/nft'
import { FavoriteButton } from './favorite-button'

export function NftDetail({ nft }: { nft: Nft }) {
  const navigate = useNavigate()
  const [imageIndex, setImageIndex] = useState(0)
  const [edition, setEdition] = useState<EditionType | undefined>(
    () => nft.editions.find((item) => item.available > 0)?.type,
  )
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<'details' | 'reviews'>('details')
  const addToCart = useCartMutation(addCartItem)

  // A disponibilidade pode mudar em tempo real: o limite é recalculado a cada render.
  const available = nft.editions.find((item) => item.type === edition)?.available ?? 0
  const safeQuantity = Math.min(quantity, Math.max(available, 1))

  function buy() {
    if (!edition) return
    addToCart.mutate(
      { nftId: nft.id, edition, quantity: safeQuantity },
      {
        onSuccess: () => {
          toast.success(`${nft.name} adicionado ao carrinho.`)
          navigate({ to: '/carrinho' })
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="mb-4 text-sm text-muted-foreground">
        <Link to="/" search={{ sort: 'recent', tab: 'all', page: 1 }} className="hover:text-primary">
          Início
        </Link>{' '}
        /{' '}
        <Link to="/" search={{ sort: 'recent', tab: 'all', page: 1 }} hash="catalogo" className="hover:text-primary">
          Mercado
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[auto_1fr_1fr]">
        <ul aria-label="Galeria de imagens" className="order-2 flex gap-2 lg:order-none lg:flex-col">
          {nft.images.map((image, i) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setImageIndex(i)}
                aria-label={`Ver imagem ${i + 1} de ${nft.images.length}`}
                aria-pressed={i === imageIndex}
                className="block overflow-hidden rounded-md border-2 border-transparent aria-pressed:border-primary"
              >
                <img src={image} alt="" width={600} height={600} loading="lazy" className="size-16 object-cover lg:size-20" />
              </button>
            </li>
          ))}
        </ul>

        <img
          src={nft.images[imageIndex]}
          alt={`${nft.name}, imagem ${imageIndex + 1} de ${nft.images.length}`}
          width={600}
          height={600}
          fetchPriority="high"
          className="aspect-square w-full rounded-lg bg-card object-cover"
        />

        <div className="space-y-5">
          <header>
            <h1 className="text-2xl font-bold">{nft.name}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-2xl font-bold text-primary">
                {nft.price} ETH
                {nft.previousPrice && (
                  <s className="ml-2 text-base font-normal text-muted-foreground">
                    <span className="sr-only">Preço anterior: </span>
                    {nft.previousPrice} ETH
                  </s>
                )}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star aria-hidden className="size-4 fill-primary text-primary" />
                <span>
                  {nft.rating.toFixed(1)} · {nft.reviewCount} avaliações de colecionadores
                </span>
              </p>
            </div>
          </header>

          <section>
            <h2 className="text-sm font-semibold">Sobre este NFT:</h2>
            <p className="mt-1 text-sm text-muted-foreground">{nft.description}</p>
          </section>

          <fieldset>
            <legend className="text-sm font-semibold">Edição:</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {EDITION_TYPES.map((type) => {
                const offered = nft.editions.find((item) => item.type === type)
                const soldOut = !offered || offered.available === 0
                return (
                  <label
                    key={type}
                    className={cn(
                      'cursor-pointer rounded-full border border-border px-3 py-1 text-xs uppercase has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-primary',
                      soldOut && 'cursor-not-allowed line-through opacity-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="edition"
                      value={type}
                      checked={edition === type}
                      disabled={soldOut}
                      onChange={() => setEdition(type)}
                      className="sr-only"
                    />
                    {EDITION_LABELS[type]}
                    {soldOut && <span className="sr-only"> ({offered ? 'esgotada' : 'indisponível'})</span>}
                  </label>
                )
              })}
            </div>
            {!edition && <p className="mt-2 text-sm text-destructive">Todas as edições deste NFT estão esgotadas.</p>}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Quantidade" className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                aria-label="Diminuir quantidade"
                disabled={safeQuantity <= 1}
                onClick={() => setQuantity(safeQuantity - 1)}
              >
                <Minus aria-hidden />
              </Button>
              <output aria-live="polite" className="w-8 text-center">
                {safeQuantity}
              </output>
              <Button
                type="button"
                size="icon"
                aria-label="Aumentar quantidade"
                disabled={!edition || safeQuantity >= available}
                onClick={() => setQuantity(safeQuantity + 1)}
              >
                <Plus aria-hidden />
              </Button>
            </div>
            <Button type="button" onClick={buy} disabled={!edition || addToCart.isPending} className="ml-auto px-6">
              {addToCart.isPending ? 'Adicionando…' : 'Comprar'}
            </Button>
            <FavoriteButton nftId={nft.id} nftName={nft.name} />
          </div>
          {edition && <p className="text-xs text-muted-foreground">{available} disponível(is) nesta edição.</p>}

          <dl className="space-y-1 text-sm text-muted-foreground">
            <div>
              <dt className="inline">ID do token: </dt>
              <dd className="inline">{nft.tokenId}</dd>
            </div>
            <div>
              <dt className="inline">Coleção: </dt>
              <dd className="inline">{nft.collection}</dd>
            </div>
            <div>
              <dt className="inline">Atributos: </dt>
              <dd className="inline">{nft.attributes.join(', ')}</dd>
            </div>
          </dl>
          <p className="flex items-center gap-2 text-sm font-semibold">
            Compartilhar este NFT:
            <button type="button" onClick={comingSoon} className="text-xs font-normal text-primary underline">
              opções de compartilhamento
            </button>
          </p>
        </div>
      </div>

      <section className="mt-12">
        <div role="tablist" aria-label="Informações do NFT" className="flex gap-6 border-b border-border text-sm">
          {(
            [
              ['details', 'Detalhes do NFT'],
              ['reviews', `Avaliações de colecionadores (${nft.reviewCount})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`panel-${value}`}
              onClick={() => setTab(value)}
              className="-mb-px border-b-2 border-transparent pb-2 aria-selected:border-primary aria-selected:text-primary"
            >
              {label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-3 py-4 text-sm text-muted-foreground">
          {tab === 'details' ? (
            <>
              <p>{nft.details}</p>
              <p>
                <strong className="text-foreground">Rede:</strong> {NETWORK_LABELS[nft.network]}
              </p>
              <p>
                <strong className="text-foreground">Direitos autorais:</strong> {nft.royaltyPercent}% nas vendas secundárias.
              </p>
              <p>
                <strong className="text-foreground">Contrato:</strong> {nft.contractAddress}
              </p>
            </>
          ) : (
            <p>As avaliações detalhadas não fazem parte desta demonstração.</p>
          )}
        </div>
      </section>

      <MoreFromCollection nft={nft} />
    </article>
  )
}

function MoreFromCollection({ nft }: { nft: Nft }) {
  const { data } = useQuery(nftListQuery({ collection: nft.collection, sort: 'popular' }))
  const items = data?.items.filter((item) => item.id !== nft.id).slice(0, 5)
  if (!items?.length) return null

  return (
    <section aria-labelledby="more-title" className="mt-8">
      <h2 id="more-title" className="border-b border-border pb-2 font-semibold text-primary">
        Mais desta coleção
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
