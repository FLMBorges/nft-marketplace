import { addToCart, expect, login, test } from './fixtures'

import type { Page } from '@playwright/test'

/** Esconde o que não faz parte do layout (painel de cenários e notificações) antes da captura. */
const HIDE = '[data-testid="scenario-trigger"], [data-sonner-toaster], section[aria-label^="Notifications"] { display: none !important; }'
const hideExtras = (page: Page) => page.addStyleTag({ content: HIDE })

test.describe('Regressão visual', () => {
  test.skip(({ isMobile }) => isMobile, 'Baselines apenas no desktop')

  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await hideExtras(page)
    await expect(page).toHaveScreenshot('inicio.png')
  })

  test('detalhe', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await hideExtras(page)
    await expect(page).toHaveScreenshot('detalhe.png')
  })

  test('carrinho', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042')
    await expect(page.getByRole('complementary', { name: 'Resumo do pedido' }).getByText('1.194 ETH')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Colecionadores também viram' })).toBeVisible()
    await hideExtras(page)
    await expect(page).toHaveScreenshot('carrinho.png')
  })

  test('pagamento', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await page.goto('/checkout')
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
    await hideExtras(page)
    await expect(page).toHaveScreenshot('pagamento.png')
  })
})
