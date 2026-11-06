/**
 * Auditoria Lighthouse: início e detalhe do NFT, perfis mobile e desktop, 3 medições cada.
 * Reporta a mediana de cada categoria e as métricas LCP, CLS e TBT.
 *
 * Uso: npm run build && npm run preview (em outro terminal) e depois `npm run lighthouse`.
 * Variáveis: LH_URL (padrão http://localhost:4173) e CHROME_PATH (opcional).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const BASE_URL = process.env.LH_URL ?? 'http://localhost:4173'
const RUNS = 3
const OUT_DIR = 'lighthouse'
const PAGES = { inicio: '/', detalhe: '/nft/emerald-ape-042' }
const PROFILES = { mobile: undefined, desktop: desktopConfig }
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = { LCP: 'largest-contentful-paint', CLS: 'cumulative-layout-shift', TBT: 'total-blocking-time' }
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

await mkdir(OUT_DIR, { recursive: true })
const summary = []
let chromeVersion = ''

for (const [pageName, path] of Object.entries(PAGES)) {
  for (const [profile, config] of Object.entries(PROFILES)) {
    const runs = []
    for (let run = 1; run <= RUNS; run++) {
      // Navegador novo a cada medição: sem cache, sem service worker registrado, sem dados salvos.
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] })
      try {
        const result = await lighthouse(`${BASE_URL}${path}`, { port: chrome.port, output: ['html', 'json'], logLevel: 'error' }, config)
        const [html, json] = result.report
        const name = `${pageName}-${profile}-${run}`
        await writeFile(`${OUT_DIR}/${name}.html`, html)
        await writeFile(`${OUT_DIR}/${name}.json`, json)
        chromeVersion = result.lhr.environment.hostUserAgent.match(/Chrome\/[\d.]+/)?.[0] ?? chromeVersion
        runs.push({
          scores: Object.fromEntries(CATEGORIES.map((id) => [id, Math.round(result.lhr.categories[id].score * 100)])),
          metrics: Object.fromEntries(Object.entries(METRICS).map(([label, id]) => [label, result.lhr.audits[id].numericValue])),
        })
        console.log(`${name}:`, runs.at(-1).scores)
      } finally {
        await chrome.kill()
      }
    }
    summary.push({
      page: pageName,
      profile,
      scores: Object.fromEntries(CATEGORIES.map((id) => [id, median(runs.map((r) => r.scores[id]))])),
      metrics: Object.fromEntries(Object.keys(METRICS).map((label) => [label, median(runs.map((r) => r.metrics[label]))])),
      runs,
    })
  }
}

const require = createRequire(import.meta.url)
const environment = {
  date: new Date().toISOString(),
  url: BASE_URL,
  lighthouse: require('lighthouse/package.json').version,
  chrome: chromeVersion,
  node: process.version,
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  cpus: os.cpus().length,
  runsPerPage: RUNS,
  conditions: 'Build de produção (vite build + vite preview) com os mocks ligados e o cenário padrão. Mobile: throttling simulado padrão do Lighthouse (4x CPU, rede 4G lenta). Desktop: preset desktop do Lighthouse.',
}

const fmt = (label, value) => (label === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`)
const flag = (id, score) => (score >= TARGETS[id] ? `${score}` : `**${score}** ⚠️`)
const table = [
  '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...summary.map(
    ({ page, profile, scores, metrics }) =>
      `| ${page} | ${profile} | ${CATEGORIES.map((id) => flag(id, scores[id])).join(' | ')} | ${Object.entries(metrics)
        .map(([label, value]) => fmt(label, value))
        .join(' | ')} |`,
  ),
].join('\n')

await writeFile(`${OUT_DIR}/summary.json`, JSON.stringify({ environment, summary }, null, 2))
await writeFile(
  `${OUT_DIR}/summary.md`,
  `# Auditoria Lighthouse (mediana de ${RUNS} medições)\n\n${table}\n\n## Ambiente\n\n${Object.entries(environment)
    .map(([key, value]) => `- **${key}**: ${value}`)
    .join('\n')}\n`,
)
console.log(`\n${table}`)
