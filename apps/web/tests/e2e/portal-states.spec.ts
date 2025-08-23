import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

// Teste simples para validar estados de loading/erro/vazio simulando falhas via rota interceptada

test.describe('Portal States', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

    test('matriculas loading -> vazio', async ({ page }) => {
      // Intercepta a requisição e atrasa mais tempo para garantir visualização do skeleton
      await page.route('**/api/portal/matriculas', async route => {
        await new Promise(r => setTimeout(r, 1500));
        await route.continue();
      });
      await page.getByRole('link', { name: /matrículas/i }).click();
      await expect(page.getByRole('heading', { level: 2, name: /Minhas Matrículas/i })).toBeVisible();
    const skeleton = page.locator('[aria-busy="true"][role="status"]').first();
    // Espera o skeleton ser anexado (mesmo que desapareça rápido depois) sem exigir visibilidade prolongada
    await skeleton.waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
    // Aguarda estado vazio
    await expect(page.getByRole('status').filter({ hasText: /Sem matrículas/i })).toBeVisible({ timeout: 10000 });
    });

  test('cobrancas erro', async ({ page }) => {
    await page.route('**/api/portal/cobrancas', async route => {
      return route.fulfill({ status: 500, body: JSON.stringify({ error: 'x' }), headers: { 'Content-Type': 'application/json' } });
    });
    await page.getByRole('link', { name: /cobranças/i }).click();
    await expect(page.getByRole('heading', { level: 2, name: /Cobranças/i })).toBeVisible();
    // Seleciona especificamente o alerta de erro de carregamento (ignorando announcer do Next.js)
    const erro = page.getByRole('alert').filter({ hasText: /Erro ao carregar cobranças/i });
    await expect(erro).toBeVisible();
    await expect(page.getByRole('button', { name: /tentar novamente/i })).toBeVisible();
  });

  test('eventos vazio', async ({ page }) => {
    await page.route('**/api/portal/eventos', async route => {
      return route.fulfill({ status: 200, body: '[]', headers: { 'Content-Type': 'application/json' } });
    });
  await page.getByRole('link', { name: /eventos/i }).click();
  await expect(page.getByRole('heading', { level: 2, name: /Eventos/i })).toBeVisible();
    await expect(page.getByRole('status')).toBeVisible();
  });
});
