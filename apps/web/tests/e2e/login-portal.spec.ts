import { test, expect } from '@playwright/test';

// Pré-condição: existir usuário no banco com email/senha conhecidos.
// Ajuste as credenciais conforme seed.
const EMAIL = 'aluno@example.com';
const PASSWORD = 'senha123';

test.describe('Fluxo Login -> Portal', () => {
  test('realiza login e acessa portal', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText(/login/i);
    await page.fill('input[type=email]', EMAIL);
    await page.fill('input[type=password]', PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForURL('**/portal');
    await expect(page.locator('h2')).toContainText(/Portal|Matrículas|Bem-vindo/i);
  });
});
