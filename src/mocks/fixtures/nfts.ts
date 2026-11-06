import { fromWei, toWei } from '@/lib/eth'
import { CATEGORIES, EDITION_TYPES, NETWORKS, type EditionType, type Nft } from '@/types/nft'

const TOTAL = 72

const DESIGNS = [
  { image: '/images/nfts/emerald-ape.webp', collection: 'Kurio Apes', attributes: ['Óculos', 'Esmeralda', 'Raro'] },
  { image: '/images/nfts/sage-gorilla.webp', collection: 'Kurio Nomads', attributes: ['Chapéu', 'Moletom', 'Incomum'] },
  { image: '/images/nfts/ivory-chimp.webp', collection: 'Kurio Barons', attributes: ['Terno', 'Marfim', 'Raro'] },
  { image: '/images/nfts/golden-monkey.webp', collection: 'Kurio Beats', attributes: ['Fones', 'Dourado', 'Comum'] },
]

const SUPPLY: Record<EditionType, number> = { '1/1': 1, '1/10': 10, '1/50': 50, open: 100 }
const ADJECTIVES = ['Emerald', 'Sage', 'Neon', 'Cosmic', 'Violet', 'Ivory', 'Golden', 'Crimson', 'Azure', 'Onyx', 'Amber', 'Jade']
const NOUNS = ['Ape', 'Nomad', 'Vessel', 'Bloom', 'Baron', 'Beat', 'Signal', 'Pulse', 'Echo', 'Drift']

type Seed = [name: string, price: string, previousPrice: string | null, design: number]

/** Os 9 primeiros reproduzem a vitrine do Figma, na mesma ordem. */
const FIGMA: Seed[] = [
  ['Emerald Ape #042', '1.19', null, 0],
  ['Sage Nomad #009', '1.69', null, 1],
  ['Neon Vessel #552', '1.99', '2.29', 2],
  ['Cosmic Bloom #118', '1.29', null, 1],
  ['Violet Nomad #314', '1.39', null, 1],
  ['Ivory Baron #088', '1.79', null, 2],
  ['Golden Beat #207', '0.99', null, 3],
  ['Golden Pulse #233', '0.59', null, 3],
  ['Golden Signal #160', '0.39', null, 3],
]

/** Gerador pseudoaleatório com semente fixa: os dados saem iguais em toda execução. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)
const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)]

function randomSeed(i: number): Seed {
  const cents = 2 + Math.floor(rand() * 1229)
  const price = `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
  return [
    `${pick(ADJECTIVES)} ${pick(NOUNS)} #${500 + i * 7}`,
    price,
    rand() < 0.15 ? fromWei((toWei(price) * 115n) / 100n) : null,
    Math.floor(rand() * DESIGNS.length),
  ]
}

function randomEditions() {
  const editions = EDITION_TYPES.filter(() => rand() > 0.25).map((type) => ({
    type,
    available: rand() < 0.15 ? 0 : 1 + Math.floor(rand() * SUPPLY[type]),
  }))
  return editions.length ? editions : [{ type: 'open' as const, available: SUPPLY.open }]
}

export const nftFixtures = Array.from({ length: TOTAL }, (_, i): Nft => {
  const [name, price, previousPrice, designIndex] = FIGMA[i] ?? randomSeed(i)
  const design = DESIGNS[designIndex]

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    image: design.image,
    images: [design.image, ...DESIGNS.filter((other) => other !== design).map((other) => other.image)],
    price,
    previousPrice,
    category: i === 0 ? 'arte-digital' : pick(CATEGORIES),
    network: i === 0 ? 'ethereum' : pick(NETWORKS),
    version: 1,
    description: `Um colecionável digital finalizado à mão da coleção ${design.collection}, com arte desbloqueável e acesso para colecionadores.`,
    details: `${name} é uma obra digital da coleção ${design.collection}. Cada atributo fica armazenado nos metadados do token.`,
    tokenId: `#${name.split('#')[1].padStart(4, '0')}`,
    collection: design.collection,
    attributes: design.attributes,
    editions:
      i === 0
        ? [
            { type: '1/1', available: 0 },
            { type: '1/10', available: 3 },
            { type: '1/50', available: 12 },
            { type: 'open', available: 100 },
          ]
        : randomEditions(),
    contractAddress: '0x7A42…19E9',
    royaltyPercent: 5,
    rating: 4 + Math.floor(rand() * 11) / 10,
    reviewCount: i === 0 ? 19 : Math.floor(rand() * 50),
    popularity: Math.floor(rand() * 100),
    createdAt: new Date(Date.UTC(2026, 10, 1 - i)).toISOString(),
  }
})