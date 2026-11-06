import { Link } from '@tanstack/react-router'
import type { FormEvent, ReactNode } from 'react'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DEFAULT_CATALOG_SEARCH } from '@/lib/catalog-search'
import { comingSoon } from '@/lib/coming-soon'
import { CATEGORY_LABELS } from '@/lib/labels'
import type { Category } from '@/types/nft'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const FOOTER_CATEGORIES: Category[] = ['arte-digital', 'fotografia', 'musica', 'arte-3d', 'utilidade']
const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]
const PROFILE_LINKS = ['Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']
const SOCIAL = [
  { label: 'Facebook', Icon: FaFacebookF },
  { label: 'Instagram', Icon: FaInstagram },
  { label: 'Twitter', Icon: FaTwitter },
  { label: 'LinkedIn', Icon: FaLinkedinIn },
  { label: 'YouTube', Icon: FaYoutube },
]
const WALLETS = ['MetaMask', 'WalletConnect', 'Coinbase']

const LINK_CLASS = 'text-sm hover:text-primary'

function SoonLink({ children }: { children: ReactNode }) {
  return (
    <button type="button" onClick={comingSoon} className={LINK_CLASS}>
      {children}
    </button>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </section>
  )
}

export function SiteFooter() {
  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    comingSoon()
  }

  return (
    <footer className="mx-auto mt-16 max-w-6xl bg-card">
      <div className="grid gap-8 px-4 md:px-8 py-10 md:grid-cols-4">
        {FEATURES.map(({ letter, title, text }) => (
          <div key={title} className="md:border-r md:border-border md:pr-6">
            <span
              aria-hidden
              className="grid size-18 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            >
              {letter}
            </span>
            <h2 className="mt-4 font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}

        <form onSubmit={subscribe}>
          <h2 className="font-semibold">
            <label htmlFor="newsletter-email">Antecipe-se ao próximo lançamento</label>
          </h2>
          <div className="mt-3 flex">
            <Input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder="digite seu e-mail..."
              className="rounded-r-none border-none bg-secondary"
            />
            <Button type="submit" className="rounded-l-none font-bold">
              Enviar
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </form>
      </div>

      <div className="border-y border-dashed border-border bg-highlight">
        <div className="grid grid-cols-2 items-center gap-x-8 gap-y-2 px-4 md:px-8 py-6 text-sm md:grid-cols-4">
          <span className="font-bold tracking-widest">KURIO</span>
          <span className="max-w-[16rem]">Feito para colecionadores, criadores e cultura</span>
          <a href="mailto:contato@email.com" className="hover:text-primary">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="hover:text-primary">
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 px-4 md:px-8 py-10 md:grid-cols-4">
        <FooterColumn title="Meu perfil">
          <li>
            <Link to="/perfil" className={LINK_CLASS}>
              Meu perfil
            </Link>
          </li>
          {PROFILE_LINKS.map((label) => (
            <li key={label}>
              <SoonLink>{label}</SoonLink>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Central de ajuda">
          {HELP_LINKS.map((label) => (
            <li key={label}>
              <SoonLink>{label}</SoonLink>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title="Coleções">
          {FOOTER_CATEGORIES.map((category) => (
            <li key={category}>
              <Link to="/" search={{ ...DEFAULT_CATALOG_SEARCH, category }} hash="catalogo" className={LINK_CLASS}>
                {CATEGORY_LABELS[category]}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <div className="space-y-8">
          <section>
            <h2 className="font-semibold">Redes sociais</h2>
            <ul className="mt-3 flex gap-2">
              {SOCIAL.map(({ label, Icon }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={comingSoon}
                    aria-label={label}
                    className="grid size-8 place-items-center rounded-sm border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-semibold">Carteiras compatíveis</h2>
            <p className="mt-3 inline-block rounded-sm border border-border bg-secondary px-2 py-1 text-[0.625rem] font-bold text-primary uppercase">
              {WALLETS.join(' • ')}
            </p>
          </section>
        </div>
      </div>

      <p className="bg-background py-4 text-center text-xs">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
