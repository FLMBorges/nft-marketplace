import { expect, login, mock, test, USERS } from './fixtures'

test.describe('Conta e sessão', () => {
  test('cadastro valida campos e trata e-mail já cadastrado', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    const name = page.getByLabel('Nome')
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    await expect(name).toBeFocused()
    await expect(page.getByText('Informe seu nome.')).toBeVisible()

    await name.fill('Carla Nova')
    await page.getByLabel('E-mail').fill(USERS.ana.email)
    await page.getByLabel('Senha', { exact: true }).fill('Senha1234')
    await page.getByLabel('Confirmar senha').fill('Senha1234')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()

    await page.getByLabel('E-mail').fill('carla@kurio.dev')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('link', { name: /Carla.*meu perfil/ })).toBeAttached()
  })

  test('login inválido, sessão após refresh e logout', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(USERS.ana.email)
    await page.getByLabel('Senha').fill('errada123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha incorretos.' })).toBeVisible()

    await login(page)
    await page.reload()
    await expect(page.getByRole('link', { name: /Ana.*meu perfil/ })).toBeAttached()

    await page.getByRole('button', { name: 'Sair da conta' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)
  })

  test('sessão expirada leva ao login e retoma a tela', async ({ page }) => {
    await login(page)
    await page.goto('/perfil')
    await mock(page, 'expireSessions')
    // A próxima chamada à API detecta a expiração (pode ser esta ou uma consulta em segundo plano).
    await page.getByRole('button', { name: 'Salvar', exact: true }).click({ timeout: 2000 }).catch(() => {})
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)
    await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar de onde parou.')).toBeVisible()
    await page.getByLabel('E-mail').fill(USERS.ana.email)
    await page.getByLabel('Senha').fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('troca de usuário não expõe dados da sessão anterior', async ({ page }) => {
    await login(page, USERS.ana)
    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: /Favoritar Emerald/ }).click()
    await expect(page.getByRole('button', { name: /Remover Emerald/ })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Sair da conta' }).click()

    await login(page, USERS.bruno)
    await page.goto('/perfil')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toHaveValue(USERS.bruno.email)
    await page.goto('/carteiras')
    await expect(page.getByLabel('Endereço da carteira').first()).not.toHaveValue(/0x7a42/)
  })
})
