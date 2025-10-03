import { test, expect } from '@playwright/test';
import { login } from './utils/login';

// E2E básico: login e navegação até /financeiro/pagamentos

test.describe('Financeiro - Pagamentos', () => {
  test('lista de pagamentos renderiza elementos principais', async ({ page }) => {
    await login(page);
    await page.goto('/financeiro/pagamentos');
    await expect(page.getByRole('heading', { name: 'Pagamentos' })).toBeVisible();
    await expect(page.getByPlaceholder('Buscar aluno ou descrição...')).toBeVisible();
    await expect(page.getByText('Carregando...')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.getByRole('table')).toBeVisible();
  });
});
