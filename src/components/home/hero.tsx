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
      <div className="grid items-center gap-8 rounded-lg border border-border bg-card p-6 md:grid-cols-[1fr_auto] md:p-10">
        <div aria-live="polite">
          <p className="text-sm">{slide.eyebrow}</p>
          {current === 0 ? (
            <h1 className="mt-4 max-w-md text-3xl leading-tight font-bold uppercase md:text-4xl">{slide.title}</h1>
          ) : (
            <p className="mt-4 max-w-md text-3xl leading-tight font-bold uppercase md:text-4xl">{slide.title}</p>
          )}
          <p className="mt-4 max-w-md text-sm text-muted-foreground">{slide.text}</p>
          <Button asChild className="mt-6">
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
          className="aspect-square w-full rounded-lg object-cover md:w-80"
        />

        <ul className="flex justify-center gap-2 md:col-span-2">
          {SLIDES.map((item, i) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Mostrar destaque ${i + 1} de ${SLIDES.length}`}
                aria-current={i === current}
                className={cn('size-2.5 rounded-full bg-muted-foreground/40', i === current && 'w-6 bg-primary')}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
