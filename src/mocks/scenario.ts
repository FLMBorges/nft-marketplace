import { delay, http, HttpResponse } from 'msw'
import { apiError } from './utils'

export const FAILURE_KEYS = [
  'nfts.list',
  'nfts.detail',
  'auth',
  'cart',
  'favorites',
  'orders.create',
  'orders.read',
  'profile',
  'wallets',
] as const
export type FailureKey = (typeof FAILURE_KEYS)[number]

/** `network`: sem conexão. `server`: HTTP 503. `timeout`: o servidor processa, mas responde depois do limite do cliente. */
export type FailureMode = 'network' | 'server' | 'timeout'

export type Scenario = {
  latency: 'none' | 'normal' | 'slow' | 'variable'
  payment: 'confirm' | 'decline'
  walletConnection: 'approve' | 'refuse'
  failures: Partial<Record<FailureKey, { mode: FailureMode; times: number }>>
}

const STORAGE_KEY = 'kurio-mock-scenario:v1'
const CLIENT_TIMEOUT_MS = 10_000
/** Sequência fixa: requisições seguidas terminam fora de ordem, sempre do mesmo jeito. */
const VARIABLE_LATENCIES = [1500, 150, 900, 300]

export const DEFAULT_SCENARIO: Scenario = { latency: 'normal', payment: 'confirm', walletConnection: 'approve', failures: {} }

function load(): Scenario {
  try {
    return { ...DEFAULT_SCENARIO, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
  } catch {
    return { ...DEFAULT_SCENARIO }
  }
}

export const scenario = load()
let variableIndex = 0
/** Rotas que devem processar normalmente e só então atrasar a resposta (ex.: pedido criado, mas o cliente não recebe). */
export const lateResponses = new Set<FailureKey>()
export const lateDelay = () => delay(CLIENT_TIMEOUT_MS + 1500)

export function updateScenario(patch: Partial<Scenario>) {
  Object.assign(scenario, patch)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario))
  } catch {
    // Sem armazenamento: o cenário vale só até recarregar.
  }
}

export const resetScenario = () => updateScenario(structuredClone(DEFAULT_SCENARIO))

export function failNext(key: FailureKey, mode: FailureMode, times = 1) {
  updateScenario({ failures: { ...scenario.failures, [key]: { mode, times } } })
}

function failureKeyFor(method: string, pathname: string): FailureKey | null {
  const [, , resource, id] = pathname.split('/')
  if (resource === 'nfts') return id ? 'nfts.detail' : 'nfts.list'
  if (resource === 'orders') return method === 'POST' ? 'orders.create' : 'orders.read'
  // Em favoritos, a falha simulada vale para incluir/remover (a ação com atualização otimista), não para a leitura.
  if (resource === 'favorites') return method === 'GET' ? null : 'favorites'
  if (resource === 'cart' || resource === 'profile' || resource === 'wallets') return resource
  if (resource === 'auth') return 'auth'
  return null
}

/**
 * Handler que roda antes de todos: aplica latência e falhas configuradas.
 * Quando não retorna nada, o MSW segue para o handler real da rota.
 */
export const scenarioHandler = http.all('/api/*', async ({ request }) => {
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/api/__mock')) return

  if (scenario.latency === 'normal') await delay()
  if (scenario.latency === 'slow') await delay(3000)
  if (scenario.latency === 'variable') await delay(VARIABLE_LATENCIES[variableIndex++ % VARIABLE_LATENCIES.length])

  const key = failureKeyFor(request.method, pathname)
  const failure = key && scenario.failures[key]
  if (!key || !failure) return

  const { [key]: _consumed, ...rest } = scenario.failures
  updateScenario({ failures: failure.times > 1 ? { ...rest, [key]: { ...failure, times: failure.times - 1 } } : rest })

  if (failure.mode === 'network') return HttpResponse.error()
  if (failure.mode === 'server') return apiError(503, 'UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente.')
  // timeout: na criação de pedido, o handler processa e depois atrasa; nas demais rotas, a resposta nunca chega a tempo.
  if (key === 'orders.create') lateResponses.add(key)
  else await lateDelay()
})
