import { test, expect, Page } from '@playwright/test';
import { login } from './utils/auth';

// Assumindo páginas /dashboard/financeiro (ADMIN only) e /portal para outros.
// Se /dashboard/financeiro não existir ainda, o teste marcará como pendente.

const ADMIN = { email: 'aluno@example.com', senha: 'senha123' };
const PROFESSOR = { email: 'professor@example.com', senha: 'senha123' };
const RESPONSAVEL = { email: 'responsavel@example.com', senha: 'senha123' };

async function safeGoto(page: Page, url: string){
  try { await page.goto(url); } catch { /* ignore */ }
}

test.describe('Roles Access Control', () => {
  test.beforeAll(async ({ request }) => {
    // Garante existência dos usuários professor e responsável com senha padrão
    for (const u of [PROFESSOR, RESPONSAVEL]) {
      await request.post('/api/test/e2e/accept-invite', { data: { email: u.email, password: u.senha, role: 'USER' } });
    }
  });
  test('Admin acessa financeiro', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.senha);
    await safeGoto(page, '/dashboard/financeiro');
    // Validação flexível: presence de heading ou marcador
    const heading = page.getByRole('heading', { name: /Financeiro|Dashboard Financeiro/i });
    await expect(heading).toBeVisible();
  });

  test('Professor bloqueado no financeiro', async ({ page }) => {
    await login(page, PROFESSOR.email, PROFESSOR.senha);
    await safeGoto(page, '/dashboard/financeiro');
    // Deve exibir alguma indicação de bloqueio (403, mensagem, redirecionamento)
  const denied = page.getByText(/(sem permissão|acesso negado|forbidden|403|não possui acesso)/i).first();
    await expect(denied).toBeVisible();
  });

  test('Responsável vê portal básico', async ({ page }) => {
    await login(page, RESPONSAVEL.email, RESPONSAVEL.senha);
    await page.goto('/portal');
    await expect(page.getByTestId('portal-header')).toBeVisible();
    // Não deve ver elementos administrativos
    const adminTerm = page.getByText(/Financeiro|Administração/i).first();
    await expect(adminTerm).toHaveCount(0);
  });
});
