import { addToCart, expect, login, test } from './fixtures'

test.describe('Carrinho', () => {
  test('quantidades, cupom, remoção e persistência', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042', '1/10')
    const summary = page.getByRole('complementary', { name: 'Resumo do pedido' })
    await expect(summary.getByText('1.194 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(summary.getByText('2.384 ETH')).toBeVisible()

    // Cupons inválido e expirado
    const coupon = page.getByLabel('Código promocional')
    await coupon.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom inválido.')).toBeVisible()
    await coupon.fill('EXPIRADO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Este cupom expirou.')).toBeVisible()

    // Cupom válido: 10% de 2.38 = 0.238 → total 2.38 - 0.238 + 0.004
    await coupon.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary.getByText('2.146 ETH')).toBeVisible()

    await page.reload()
    await expect(summary.getByText('2.146 ETH')).toBeVisible()
    await page.getByRole('button', { name: 'Remover cupom' }).click()
    await expect(summary.getByText('2.384 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click()
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  })

  test('itens do visitante são preservados ao entrar na conta', async ({ page }) => {
    await addToCart(page, 'golden-beat-207', 'Aberta')
    await expect(page.getByRole('link', { name: /Carrinho, 1 item/ })).toBeVisible()
    await login(page)
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()
  })
})
