import { expect, login, mock, test } from './fixtures'

test('favoritos: atualização otimista, rollback na falha e persistência', async ({ page }) => {
  await login(page)
  await page.goto('/nft/sage-nomad-009')
  const button = page.getByRole('button', { name: /Sage Nomad/ })
  await expect(button).toHaveAttribute('aria-pressed', 'false')

  // Falha: o coração volta ao estado anterior e o usuário é avisado
  await mock(page, 'failNext', 'favorites', 'server')
  await button.click()
  await expect(page.getByText('Não foi possível favoritar. Tente novamente.')).toBeVisible()
  await expect(button).toHaveAttribute('aria-pressed', 'false')

  // Sucesso persiste após refresh
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: /Sage Nomad/ })).toHaveAttribute('aria-pressed', 'true')
})

test('favoritar sem login leva ao login', async ({ page }) => {
  await page.goto('/nft/sage-nomad-009')
  await page.getByRole('button', { name: /Favoritar Sage Nomad/ }).click()
  await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fsage-nomad-009/)
})
