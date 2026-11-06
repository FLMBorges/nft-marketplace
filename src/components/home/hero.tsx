import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { cn } from '@/lib/utils'
import type { Tab } from '@/types/nft'

const SLIDES: { eyebrow: string; title: string; text: string; image: string; tab: Tab }[] = [
  {
    eyebrow: 'Bem-vindo à Kurio',
    title: 'Seja dono do futuro da arte digital',
    text: 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    image: '/images/nfts/emerald-ape.webp',
    tab: 'all',
  },
  {
    eyebrow: 'Novos lançamentos',
    title: 'Edições limitadas direto dos criadores',
    text: 'Garanta as obras recém-cunhadas antes que as edições se esgotem.',
    image: '/images/nfts/sage-gorilla.webp',
    tab: 'new',
  },
  {
    eyebrow: 'Em alta',
    title: 'As obras mais disputadas da semana',
    text: 'Veja o que os colecionadores estão procurando agora.',
    image: '/images/nfts/golden-monkey.webp',
    tab: 'trending',
  },
]

export function Hero() {
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques" className="mx-auto max-w-6xl px-4 pt-8">
      <div className="grid grid-cols-[1fr_7rem] items-center gap-4 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_auto] md:gap-8 md:rounded-lg md:p-10">
        <div aria-live="polite">
          <p className="text-xs md:text-sm">{slide.eyebrow}</p>
          {current === 0 ? (
            <h1 className="mt-2 max-w-md text-lg leading-tight font-bold uppercase md:mt-4 md:text-4xl">{slide.title}</h1>
          ) : (
            <p className="mt-2 max-w-md text-lg leading-tight font-bold uppercase md:mt-4 md:text-4xl">{slide.title}</p>
          )}
          <p className="mt-2 line-clamp-3 max-w-md text-xs text-muted-foreground md:mt-4 md:line-clamp-none md:text-sm">{slide.text}</p>
          <Button asChild size="sm" className="mt-3 md:mt-6 md:h-8 md:px-2.5 md:text-sm">
            <Link to="/" search={{ ...DEFAULT_CATALOG_SEARCH, tab: slide.tab }} hash="catalogo">
              Explorar
            </Link>
          </Button>
        </div>

        <img
          src={slide.image}
          alt=""
          width={600}
          height={600}
          fetchPriority={current === 0 ? 'high' : 'auto'}
          className="aspect-square w-full self-start rounded-lg object-cover md:w-80 md:self-auto"
        />

        <ul className="col-span-2 flex justify-center">
          {SLIDES.map((item, i) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Mostrar destaque ${i + 1} de ${SLIDES.length}`}
                aria-current={i === current}
                className="grid h-6 min-w-6 place-items-center px-1"
              >
                {/* Área de toque de 24px; a bolinha visível continua pequena, como no Figma. */}
                <span className={cn('block size-2.5 rounded-full bg-muted-foreground/40', i === current && 'w-6 bg-primary')} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
