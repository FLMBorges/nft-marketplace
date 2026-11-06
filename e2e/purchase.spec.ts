import { addToCart, expect, login, mock, reviewCheckout, test } from './fixtures'

test.describe('Compra', () => {
  test('compra completa do catálogo ao recibo confirmado @mobile', async ({ page }) => {
    await login(page)
    await page.goto('/')
    await page.getByRole('link', { name: /Emerald Ape #042/ }).first().click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)
    await page.getByText('1/50', { exact: true }).click()
    await page.getByRole('button', { name: 'Comprar', exact: true }).click()
    await expect(page).toHaveURL(/\/carrinho$/)
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await page.getByRole('button', { name: 'Confirmar compra de 1.194 ETH' }).click()

    await expect(page.getByRole('heading', { name: 'Aguardando confirmação do pagamento' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    const receipt = page.getByRole('group', { name: 'Recibo' })
    await expect(receipt.getByText('Emerald Ape #042')).toBeVisible()
    await expect(receipt.getByText('1.194 ETH').last()).toBeVisible()
    await expect(page.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/)).toBeVisible()

    // O recibo é um snapshot: mudar o catálogo depois não altera os valores
    await mock(page, 'updateNft', 'emerald-ape-042', { price: '9.99' })
    await page.reload()
    await expect(receipt.getByText('1.194 ETH').last()).toBeVisible()

    // Só o item comprado sai do carrinho
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio.')).toBeVisible()
  })

  test('validação dos dados do colecionador e carteira recusada', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await page.goto('/checkout')
    await mock(page, 'setScenario', { walletConnection: 'refuse' })
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('A conexão foi recusada na carteira.')).toBeVisible()

    await mock(page, 'setScenario', { walletConnection: 'approve' })
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await page.getByLabel('E-mail').fill('invalido')
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeFocused()

    await page.getByRole('button', { name: 'Desconectar' }).click()
    await expect(page.getByText('Carteira desconectada.')).toBeVisible()
  })
})

test.describe('Falhas de pagamento e idempotência', () => {
  test('pagamento recusado mantém os itens no carrinho', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    await mock(page, 'setScenario', { payment: 'decline' })
    await (await reviewCheckout(page)).click()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('clique repetido cria um único pedido', async ({ page }) => {
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    const confirm = await reviewCheckout(page)
    await confirm.dblclick()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 10_000 })
    expect(await mock(page, 'orders')).toHaveLength(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await addToCart(page, 'emerald-ape-042')
    const confirm = await reviewCheckout(page)
    await mock(page, 'failNext', 'orders.create', 'timeout')
    await confirm.click()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 30_000 })
    expect(await mock(page, 'orders')).toHaveLength(1)
  })
})
