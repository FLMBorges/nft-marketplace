import { test as base, expect, type Page } from '@playwright/test'
import type { MockControl } from '../src/mocks/control'
import type { Scenario } from '../src/mocks/scenario'

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'Kurio@2026', name: 'Ana' },
  bruno: { email: 'bruno@kurio.dev', password: 'Kurio@2026', name: 'Bruno' },
}

/**
 * Antes do app carregar, define o cenário (sem latência por padrão, para testes rápidos e estáveis).
 * O cenário é lido pelo MSW da página: as respostas REST e os eventos passam pela camada de rede real.
 */
export async function setScenario(page: Page, scenario: Partial<Scenario>) {
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('e2e-scenario-set')) {
      localStorage.setItem('kurio-mock-scenario:v1', JSON.stringify(value))
      sessionStorage.setItem('e2e-scenario-set', '1')
    }
  }, scenario)
}

/** Chama o painel de controle da simulação dentro da página (o mesmo que o painel "Cenários" usa). */
export async function mock<K extends keyof MockControl>(page: Page, method: K, ...args: Parameters<MockControl[K]>) {
  await page.waitForFunction(() => !!window.__kurioMock)
  return page.evaluate(
    ([name, params]) => (window.__kurioMock![name as keyof MockControl] as (...a: unknown[]) => unknown)(...(params as unknown[])),
    [method, args] as const,
  )
}

export async function login(page: Page, user = USERS.ana) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('link', { name: /meu perfil/i }).first()).toBeAttached()
}

/** Abre o detalhe, escolhe a edição e adiciona ao carrinho. */
export async function addToCart(page: Page, nftId: string, edition = '1/10', quantity = 1) {
  await page.goto(`/nft/${nftId}`)
  await page.getByText(edition, { exact: true }).click()
  for (let i = 1; i < quantity; i++) await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

export const test = base.extend<{ scenario: Partial<Scenario> }>({
  scenario: [{ latency: 'none' }, { option: true }],
  page: async ({ page, scenario }, use) => {
    await setScenario(page, scenario)
    await use(page)
  },
})

export { expect }

/** No checkout: conecta a carteira e revisa o pedido. */
export async function reviewCheckout(page: Page) {
  await page.goto('/checkout')
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada.')).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  return page.getByRole('button', { name: /Confirmar compra/ })
}
