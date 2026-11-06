import { comingSoon } from '@/lib/coming-soon'

const POSTS = [
  {
    date: '2026-09-12',
    readMinutes: 5,
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nfts/ivory-chimp.webp',
  },
  {
    date: '2026-09-13',
    readMinutes: 3,
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital na rede.',
    image: '/images/nfts/emerald-ape.webp',
  },
  {
    date: '2026-09-15',
    readMinutes: 3,
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, atributos e utilidade.',
    image: '/images/nfts/sage-gorilla.webp',
  },
  {
    date: '2026-09-15',
    readMinutes: 4,
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nfts/golden-monkey.webp',
  },
]

const formatDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

export function Journal() {
  return (
    <section aria-labelledby="journal-title" className="mx-auto max-w-6xl px-4 py-12">
      <h2 id="journal-title" className="text-center text-2xl font-bold">
        Diário da Cunhagem
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card">
              <img
                src={post.image}
                alt=""
                width={600}
                height={600}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-muted-foreground">
                  <time dateTime={post.date}>{formatDate.format(new Date(post.date))}</time> | Leitura de{' '}
                  {post.readMinutes} min
                </p>
                <h3 className="mt-2 text-sm font-semibold">{post.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{post.excerpt}</p>
                <button
                  type="button"
                  onClick={comingSoon}
                  className="mt-auto self-start pt-3 text-xs text-primary hover:underline"
                >
                  Ler mais →<span className="sr-only">: {post.title}</span>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
