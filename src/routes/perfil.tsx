import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/perfil')({
  component: ProfilePage,
})

function ProfilePage() {
  return <h1 className="mx-auto max-w-6xl px-4 py-12 text-2xl font-bold">Perfil</h1>
}
