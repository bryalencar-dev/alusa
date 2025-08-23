import { test, expect } from '@playwright/test';

const EMAIL = 'aluno@example.com';
const PASSWORD = 'senha123';

async function login(page: any){
  await page.goto('/login');
  await page.fill('input[type=email]', EMAIL);
  await page.fill('input[type=password]', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL('**/portal');
}

test.describe('Portal Pages Navegação', () => {
  test('matrículas, cobranças e eventos carregam', async ({ page }) => {
    await login(page);
    // Matriculas
    await page.click('a[href="/portal/matriculas"]');
    await page.waitForURL('**/portal/matriculas');
    await expect(page.locator('h2')).toHaveText(/M(inhas )?Matr[íi]culas|Matrículas/i);
    // Cobrancas
    await page.click('a[href="/portal/cobrancas"]');
    await page.waitForURL('**/portal/cobrancas');
    await expect(page.locator('h2')).toHaveText(/Cobranças/i);
    // Eventos
    await page.click('a[href="/portal/eventos"]');
    await page.waitForURL('**/portal/eventos');
    await expect(page.locator('h2')).toHaveText(/Eventos|Inscri[cç][õo]es/i);
  });
});
