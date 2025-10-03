import { test, expect } from '@playwright/test';
import { resetDb } from './utils/reset-db';

async function firstRegister(page: import('@playwright/test').Page) {
  await page.goto('/register');
  await page.fill('[data-testid="register-escolaNome"]', 'Escola Integrações');
  await page.fill('[data-testid="register-cpfCnpj"]', '12345678901');
  await page.fill('[data-testid="register-nome"]', 'Admin Integrações');
  await page.fill('[data-testid="register-email"]', 'admin-int@example.com');
  await page.fill('[data-testid="register-senha"]', 'SenhaFort3!');
  await page.click('[data-testid="register-submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Configurações - Integrações (Asaas)', () => {
  test.beforeEach(async () => {
    await resetDb();
  });

  test('salva apenas o token e mostra feedback de sucesso', async ({ page }) => {
    await firstRegister(page);
    await page.goto('/admin/configuracoes/integracoes');

    // Preenche apenas o campo de token (seleciona pelo label)
    await page.getByLabel('Token da API do Asaas').fill('sk_test_1234567890abcdef');

    // Salvar e validar mensagem verde
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Token salvo com sucesso')).toBeVisible();
  });
});
