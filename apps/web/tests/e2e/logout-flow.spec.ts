import { test, expect } from '@playwright/test';

// Pré-condição: usuário válido existente.
const EMAIL = 'aluno@example.com';
const PASSWORD = 'senha123';

test.describe('Fluxo Logout', () => {
  test('login -> portal -> sair -> redireciona /login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type=email]', EMAIL);
    await page.fill('input[type=password]', PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForURL('**/portal');
    // Garante que botão Sair existe
    const logoutBtn = page.getByRole('button', { name: /sair/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login$/);
    // Garantir que sessão acabou: tentar acessar /portal volta para /login
    await page.goto('/portal');
    await page.waitForURL('**/login');
  });
});
