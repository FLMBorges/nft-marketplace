import { addToCart, expect, login, test } from './fixtures'

/** Esconde o que não faz parte do layout (painel de cenários e notificações). */
const HIDE = '[data-testid="scenario-trigger"], [data-sonner-toaster] { display: none !important; }'

test.describe('Regressão visual', () => {
  test.skip(({ isMobile }) => isMobile, 'Baselines apenas no desktop')

  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect(page).toHaveScreenshot('inicio.png', { style: HIDE })
  })

  test('detalhe', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await expect(page).toHaveScreenshot('detalhe.png', { style: HIDE })
  })

  test('carrinho', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042')
    await expect(page.getByText('Total', { exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot('carrinho.png', { style: HIDE })
  })

  test('pagamento', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await page.goto('/checkout')
    await expect(page.getByRole('button', { name: 'Conectar carteira' })).toBeVisible()
    await expect(page).toHaveScreenshot('pagamento.png', { style: HIDE })
  })
})
