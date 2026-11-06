import { expect, test } from './fixtures'

test.describe('Detalhe do NFT', () => {
  test('acesso direto, edição esgotada e limite de quantidade', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('1.19 ETH').first()).toBeVisible()

    // A edição 1/1 está esgotada nos dados de exemplo
    await expect(page.getByRole('radio', { name: '1/1 (esgotada)' })).toBeDisabled()

    // 1/10 tem 3 unidades: o botão de aumentar trava no limite
    await page.getByText('1/10', { exact: true }).click()
    const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
    await plus.click()
    await plus.click()
    await expect(page.getByRole('group', { name: 'Quantidade' }).locator('output')).toHaveText('3')
    await expect(plus).toBeDisabled()
  })

  test('NFT inexistente mostra página própria', async ({ page }) => {
    await page.goto('/nft/nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await page.getByRole('link', { name: 'Ver catálogo' }).click()
    await expect(page).toHaveURL(/#catalogo/)
  })

  test('rota inexistente mostra 404', async ({ page }) => {
    await page.goto('/rota/que/nao/existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })
})
