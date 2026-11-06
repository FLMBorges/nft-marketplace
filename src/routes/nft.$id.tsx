import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/nft/$id')({
  component: NftPage,
})

function NftPage() {
  return <p>NFT: {Route.useParams().id}</p>
}