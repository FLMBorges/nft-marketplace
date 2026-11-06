import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useFavorites, useToggleFavorite } from '@/api/favorites'
import { useSession } from '@/api/session'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FavoriteButton({ nftId, nftName }: { nftId: string; nftName: string }) {
  const { data: session } = useSession()
  const { data: favorites } = useFavorites()
  const toggle = useToggleFavorite()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const isFavorite = favorites?.includes(nftId) ?? false

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remover ${nftName} dos favoritos` : `Favoritar ${nftName}`}
      onClick={() =>
        session ? toggle.mutate({ nftId, favorite: !isFavorite }) : navigate({ to: '/login', search: { redirect: href } })
      }
      className="border-primary text-primary"
    >
      <Heart aria-hidden className={cn(isFavorite && 'fill-current')} />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  )
}
