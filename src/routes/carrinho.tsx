import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  return <h1 className="mx-auto max-w-6xl px-4 py-12 text-2xl font-bold">Carrinho</h1>
}
