import { expect, login, test } from './fixtures'

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Perfil e carteiras', () => {
  test('edita dados, avatar e senha com validação', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')

    await page.getByLabel('Telefone').fill('abc')
    await page.getByRole('button', { name: 'Salvar dados' }).click()
    await expect(page.getByText('Informe um telefone válido.')).toBeVisible()

    await page.getByLabel('Nome').fill('Ana Atualizada')
    await page.getByLabel('Telefone').fill('+55 11 91234-5678')
    await page.getByRole('button', { name: 'Salvar dados' }).click()
    await expect(page.getByText('Dados atualizados.')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Nome')).toHaveValue('Ana Atualizada')

    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha1')
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()
    await page.getByLabel('Senha atual').fill('Kurio@2026')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada.')).toBeVisible()
  })

  test('cadastra carteira secundária com validação e conflito', async ({ page }) => {
    await login(page)
    await page.goto('/carteiras')
    const secondary = page.getByRole('form', { name: /Carteira secundária/ })

    await secondary.getByLabel('Nome da carteira').fill('Reserva')
    await secondary.getByLabel('Endereço').fill('0x123')
    await secondary.getByRole('button', { name: 'Cadastrar carteira' }).click()
    await expect(secondary.getByText('Endereço inválido para a rede escolhida.')).toBeVisible()

    await secondary.getByLabel('Endereço').fill('0x7a42c0ffee254729296a45a3885639AC7E10F9d5')
    await secondary.getByRole('button', { name: 'Cadastrar carteira' }).click()
    await expect(secondary.getByText('Endereço já usado na outra carteira.')).toBeVisible()

    await secondary.getByLabel('Endereço').fill('0x1111111111111111111111111111111111111111')
    await secondary.getByRole('button', { name: 'Cadastrar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('form', { name: /Carteira secundária/ }).getByLabel('Endereço')).toHaveValue(
      '0x1111111111111111111111111111111111111111',
    )
  })
})
