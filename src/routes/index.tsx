import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <h1 className="text-3xl font-bold">NFT Marketplace</h1>,
})