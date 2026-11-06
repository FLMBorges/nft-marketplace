import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DEFAULT_CATALOG_SEARCH, type CatalogSearch } from '@/lib/catalog-search'

const BANNERS: { title: string; text: string; image: string; search: Partial<CatalogSearch> }[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revolução pública.',
    image: '/images/nfts/emerald-ape.webp',
    search: { tab: 'new' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/nfts/ivory-chimp.webp',
    search: { category: 'arte-digital' },
  },
]

export function PromoBanners() {
  return (
    <section aria-label="Coleções em destaque" className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-2">
      {BANNERS.map(({ title, text, image, search }) => (
        <article
          key={title}
          className="grid grid-cols-[8rem_1fr] items-center gap-4 rounded-lg bg-card p-4 sm:grid-cols-[10rem_1fr]"
        >
          <img
            src={image}
            alt=""
            width={600}
            height={600}
            loading="lazy"
            className="aspect-square w-full rounded-md object-cover"
          />
          <div className="text-right">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-xs text-muted-foreground">{text}</p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/" search={{ ...DEFAULT_CATALOG_SEARCH, ...search }} hash="catalogo">
                Explorar <ArrowRight aria-hidden />
                <span className="sr-only">{title}</span>
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
