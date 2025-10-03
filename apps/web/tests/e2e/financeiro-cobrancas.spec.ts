import { test, expect } from '@playwright/test';
import { login } from './utils/login';

// E2E básico: login e navegação até /financeiro/cobrancas exibindo tabela

test.describe('Financeiro - Cobranças', () => {
  test('lista de cobranças renderiza elementos principais', async ({ page }) => {
    await login(page);
    await page.goto('/financeiro/cobrancas');
    await expect(page.getByRole('heading', { name: 'Cobranças' })).toBeVisible();
    await expect(page.getByPlaceholder('Buscar aluno ou descrição...')).toBeVisible();
    // Esperar pelo estado de carregamento e depois tabela
    await expect(page.getByText('Carregando...')).toBeVisible();
    await page.waitForTimeout(500); // pequeno debounce + fetch
    await expect(page.getByRole('table')).toBeVisible();
  });
});
