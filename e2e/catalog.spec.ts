import { expect, test } from './fixtures'

test.describe('Catálogo', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico @mobile', async ({ page, isMobile }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('72 NFTs encontrados')).toBeAttached()

    // Paginação
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeHidden()

    // Filtros combinados reiniciam a paginação
    if (isMobile) await page.getByRole('button', { name: 'Filtros' }).click()
    const filters = page.getByRole('complementary', { name: 'Filtros' })
    await filters.getByRole('link', { name: /^Jogos/ }).click()
    await expect(page).toHaveURL(/category=jogos/)
    await expect(page).not.toHaveURL(/page=/)
    if (isMobile) {
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'Filtros' }).click()
    }
    await filters.getByRole('link', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/category=jogos.*network=ethereum|network=ethereum.*category=jogos/)
    if (isMobile) await page.keyboard.press('Escape')

    // Ordenação por preço
    await page.getByLabel('Ordenar por:').selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(page.locator('#catalogo ul[aria-busy="false"]')).toBeVisible()
    const prices = await page.locator('#catalogo ul li p.text-primary').allInnerTexts()
    const values = prices.map((text) => Number.parseFloat(text))
    expect(values.length).toBeGreaterThan(0)
    expect(values).toEqual([...values].sort((a, b) => a - b))

    // Refresh mantém o estado; voltar no histórico desfaz o último passo
    await page.reload()
    await expect(page.getByLabel('Ordenar por:')).toHaveValue('price-asc')
    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await expect(page).toHaveURL(/network=ethereum/)
  })

  test('busca pelo header e resultado vazio', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Buscar NFTs' }).click()
    await page.getByLabel('Nome do NFT').fill('golden')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/q=golden/)
    await expect(page.getByText(/^Resultados para/)).toBeVisible()
    await expect(page.locator('#catalogo ul[aria-busy="false"]')).toBeVisible()
    const names = await page.locator('#catalogo li a h3').allInnerTexts()
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name.toLowerCase()).toContain('golden')

    await page.goto('/?q=nao-existe-nada')
    await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()
  })

  test('parâmetros inválidos na URL são descartados', async ({ page }) => {
    await page.goto('/?sort=hacker&page=-3&category=xyz')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveURL(/\/(#.*)?$/)
  })
})
