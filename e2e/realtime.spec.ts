import { addToCart, expect, login, mock, reviewCheckout, test } from './fixtures'

test.describe('Tempo real (Socket.IO)', () => {
  test('preço muda durante o checkout e exige nova confirmação', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    const confirm = await reviewCheckout(page)
    await expect(confirm).toHaveText('Confirmar compra de 1.194 ETH')

    await mock(page, 'updateNft', 'emerald-ape-042', { price: '1.5' })
    await expect(page.getByText(/mudaram desde a sua revisão/)).toBeVisible()
    await expect(confirm).toBeDisabled()

    await page.getByRole('button', { name: 'Revisei os novos valores' }).click()
    await expect(confirm).toHaveText('Confirmar compra de 1.504 ETH')
    await confirm.click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
  })

  test('edição esgotada no carrinho aparece na hora', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042', '1/50')
    await mock(page, 'updateNft', 'emerald-ape-042', { edition: '1/50', available: 0 })
    await expect(page.getByText('Esta edição esgotou. Remova o item para continuar.')).toBeVisible()
    await expect(page.getByText(/disponibilidade mudou para 0/)).toBeVisible()
  })

  test('eventos duplicados ou antigos não regridem o estado', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByText('1.19 ETH').first()).toBeVisible()
    await page.waitForTimeout(300)

    await mock(page, 'updateNft', 'emerald-ape-042', { price: '2' })
    await expect(page.getByRole('heading', { level: 1 }).locator('xpath=..').getByText(/^2 ETH/)).toBeVisible()

    await mock(page, 'replayLastEvent')
    await mock(page, 'emitStaleNftEvent', 'emerald-ape-042')
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { level: 1 }).locator('xpath=..').getByText(/^2 ETH/)).toBeVisible()
    await expect(page.getByText('999 ETH')).toHaveCount(0)
  })

  test('desconexão com pedido pendente: retoma após reconectar e recarregar', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await (await reviewCheckout(page)).click()
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' })).toBeVisible()

    await mock(page, 'disconnectSockets')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })
    expect(await mock(page, 'orders')).toHaveLength(1)
  })
})
