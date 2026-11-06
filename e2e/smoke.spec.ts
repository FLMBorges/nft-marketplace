import { addToCart, expect, login, mock, test } from './fixtures'

test('smoke: catálogo, detalhe, login, carrinho e compra', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  await login(page)
  await addToCart(page, 'emerald-ape-042', '1/10', 2)
  await expect(page.getByText('Total', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Finalizar compra' }).click()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText('Carteira conectada.')).toBeVisible()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: /Confirmar compra/ }).click()
  await expect(page.getByRole('heading', { name: 'Pedido confirmado!' })).toBeVisible({ timeout: 15_000 })
  console.log('mock scenario', await mock(page, 'getScenario'))
  console.log('errors', errors)
})

test('smoke: evento de preço chega pelo Socket.IO', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  await addToCart(page, 'emerald-ape-042')
  await page.waitForTimeout(500)
  await mock(page, 'updateNft', 'emerald-ape-042', { price: '2.5' })
  await expect(page.getByText(/preço mudou de 1.19 para 2.5 ETH/)).toBeVisible()
  console.log('errors', errors)
})
