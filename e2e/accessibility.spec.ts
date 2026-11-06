import { expect, test } from './fixtures'

test.describe('Acessibilidade', () => {
  test('navegação por teclado: pular para o conteúdo e foco visível', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()
  })

  test('diálogo de busca prende o foco e devolve ao fechar', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Buscar NFTs' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('erros de formulário ficam associados aos campos', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    const email = page.getByLabel('E-mail')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Informe um e-mail válido.')
    await expect(email).toBeFocused()
  })
})
