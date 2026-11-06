import { expect, login, test } from './fixtures'

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Perfil e carteiras', () => {
  test('edita dados, avatar e senha com validação', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')
    const save = page.getByRole('button', { name: 'Salvar', exact: true })

    await page.getByLabel('Nome de usuário').fill('a')
    await save.click()
    await expect(page.getByText('Use de 3 a 30 letras, números, ponto ou sublinhado.')).toBeVisible()
    await expect(page.getByLabel('Nome de usuário')).toBeFocused()

    await page.getByLabel('Nome de exibição').fill('Ana Atualizada')
    await page.getByLabel('Nome de usuário').fill('ana.nova')
    await save.click()
    await expect(page.getByText('Dados atualizados.')).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Atualizada')
    await expect(page.getByRole('link', { name: /Ana.*meu perfil/ })).toBeAttached()

    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeHidden()

    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha1')
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha1')
    await save.click()
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()
    await page.getByLabel('Senha atual').fill('Kurio@2026')
    await save.click()
    await expect(page.getByText('Dados e senha atualizados.')).toBeVisible()
  })

  test('cadastra carteira secundária com validação e conflito', async ({ page }) => {
    await login(page)
    await page.goto('/carteiras')
    await page.getByRole('region', { name: 'Carteira secundária' }).getByRole('button', { name: 'Adicionar' }).click()
    const secondary = page.getByRole('form', { name: 'Carteira secundária' })

    await secondary.getByLabel('Apelido da carteira').fill('Reserva')
    await secondary.getByLabel('Endereço da carteira').fill('0x123')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(secondary.getByText('Endereço inválido para a rede escolhida.')).toBeVisible()

    await secondary.getByLabel('Endereço da carteira').fill('0x7a42c0ffee254729296a45a3885639AC7E10F9d5')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(secondary.getByText('Endereço já usado na outra carteira.')).toBeVisible()

    await secondary.getByLabel('Endereço da carteira').fill('0x1111111111111111111111111111111111111111')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('form', { name: 'Carteira secundária' }).getByLabel('Endereço da carteira')).toHaveValue(
      '0x1111111111111111111111111111111111111111',
    )
  })
})
