import { expect, test } from './fixtures'

test.describe('Carregamento e falhas', () => {
  test.use({ scenario: { latency: 'slow' } })

  test('skeletons durante carregamento lento', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toBeHidden()

    await page.goto('/nft/sage-nomad-009')
    await expect(page.getByLabel('Carregando NFT')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Falha e recuperação', () => {
  // 3 falhas seguidas no catálogo esgotam as 2 repetições automáticas do React Query.
  test.use({ scenario: { latency: 'none', failures: { 'nfts.list': { mode: 'server', times: 3 } } } })

  test('falha do catálogo mostra erro e recupera com nova tentativa', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Não foi possível carregar o catálogo.')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#catalogo li a h3').first()).toBeVisible()
  })
})
