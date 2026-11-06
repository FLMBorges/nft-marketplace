import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/types/nft'

export function NftCard({ nft }: { nft: NftSummary }) {
  return (
    <Link
      to="/nft/$id"
      params={{ id: nft.id }}
      className="block rounded-lg bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {/* alt vazio: o nome logo abaixo já descreve o link, evitando leitura duplicada */}
      <img
        src={nft.image}
        alt=""
        width={600}
        height={600}
        loading="lazy"
        className="aspect-square w-full rounded-md object-cover"
      />
      <h2 className="mt-3 text-sm">{nft.name}</h2>
      <p className="text-sm font-semibold text-primary">
        {nft.price} ETH
        {nft.previousPrice && (
          <s className="ml-2 font-normal text-muted-foreground">
            <span className="sr-only">Preço anterior: </span>
            {nft.previousPrice} ETH
          </s>
        )}
      </p>
    </Link>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="rounded-lg bg-card p-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  )
}