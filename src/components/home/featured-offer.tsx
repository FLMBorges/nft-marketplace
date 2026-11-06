import { Link } from '@tanstack/react-router'

export function FeaturedOffer() {
  return (
    <Link
      to="/nft/$id"
      params={{ id: 'sage-nomad-009' }}
      className="mt-6 block rounded-lg bg-card p-4 text-center hover:bg-accent"
    >
      <p className="font-bold text-primary uppercase">NFT em destaque</p>
      <p className="font-bold uppercase">Oferta limitada</p>
      <img
        src="/images/nfts/sage-gorilla.webp"
        alt="Sage Nomad #009"
        width={600}
        height={600}
        loading="lazy"
        className="mt-3 aspect-square w-full rounded-lg object-cover"
      />
    </Link>
  )
}
