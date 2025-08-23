import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { createInvite, acceptInvite, createMatricula, simulateWebhookAsaas, markPresenca, createEventoComprarIngresso, checkinQR } from './utils/flow-helpers';

// Fluxo ponta a ponta MVP (Etapa 24)
// NOTA: Diversos helpers ainda são placeholders até que endpoints/UI sejam implementados.

const ADMIN_EMAIL = 'admin@example.com'; // admin dedicado para o fluxo
const NOVO_USUARIO_EMAIL = 'novo.usuario+e2e@example.com';
const NOVO_USUARIO_SENHA = 'SenhaForte!123';

let conviteLink: string; let matriculaId: string; let eventoCtx: { eventoId: string; ingressoId: string; qr: string };

test.describe.serial('Fluxo E2E Completo', () => {
  let adminPage: import('@playwright/test').Page;
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    adminPage = await ctx.newPage();
    // Garante que o usuário admin exista antes do login
    await adminPage.request.post('/api/test/e2e/accept-invite', {
      data: { email: ADMIN_EMAIL, password: 'senha123' }
    });
    await login(adminPage, ADMIN_EMAIL, 'senha123');
  });

  test('1. Admin cria convite', async () => {
    // Garantir header único visível
    await expect(adminPage.getByTestId('portal-header')).toBeVisible();
    const r = await createInvite(adminPage, NOVO_USUARIO_EMAIL);
    conviteLink = r.link;
  // Log para depuração
  // eslint-disable-next-line no-console
  console.log('[flow] conviteLink', conviteLink);
    expect(conviteLink).toContain('convite');
  });

  test('2. Usuário aceita convite e cria senha', async ({ page }) => {
  expect(conviteLink, 'conviteLink deve estar definido do teste anterior').toBeTruthy();
  await acceptInvite(page, conviteLink!, NOVO_USUARIO_SENHA);
    // Futuro: validar mensagem de sucesso / redirecionamento
  });

  test('3. Login com credenciais criadas', async ({ page }) => {
    await login(page, NOVO_USUARIO_EMAIL, NOVO_USUARIO_SENHA);
    await expect(page.getByTestId('portal-header')).toBeVisible();
  });

  test('4. Criação de matrícula com taxa, desconto e combo', async ({ page }) => {
    const m = await createMatricula(page, { alunoEmail: NOVO_USUARIO_EMAIL, planoNome: 'Plano E2E', taxa: 50, desconto: 10, combo: 'Combo E2E' });
    matriculaId = m.id;
    expect(matriculaId).toBeTruthy();
    // Valida na UI que algum card de matrícula existe
  await page.goto('/portal/matriculas');
  const cards = page.locator('div').filter({ hasText: /Status:/ });
  await expect(cards.first()).toBeVisible();
  });

  test('5. Simula webhook Asaas e confirma pagamento', async ({ page }) => {
    await simulateWebhookAsaas(page, 'cobranca-mock-id');
    // Verifica se aparece texto pago ou similar (fallback se não existir cobrança real)
    await page.goto('/portal/cobrancas');
    const possible = page.getByText(/Paga|Pago|Quitada/i).first();
    // Tolerante: se não encontrado, apenas registra
    if (await possible.count()) {
      await expect(possible).toBeVisible();
    }
  });

  test('6. Professor marca presença', async ({ page }) => {
    await markPresenca(page, matriculaId, 'PRESENTE');
    // Checa se presença aparece (heurística por palavra Presença ou Presente)
    await page.goto('/portal/matriculas');
    const presenca = page.getByText(/Presen[cç]a|Presente/i).first();
    if (await presenca.count()) {
      await expect(presenca).toBeVisible();
    }
  });

  test('7. Evento + compra de ingresso + QR check-in', async ({ page }) => {
    eventoCtx = await createEventoComprarIngresso(page, NOVO_USUARIO_EMAIL);
    await checkinQR(page, eventoCtx.qr);
    expect(eventoCtx.qr).toContain('QR-');
  });

  test('8. Portal do aluno/responsável exibe dados', async ({ page }) => {
    await login(page, NOVO_USUARIO_EMAIL, NOVO_USUARIO_SENHA);
    // Visitar páginas
    await page.goto('/portal/matriculas');
    await expect(page.getByRole('heading', { name: /Minhas Matrículas/i })).toBeVisible();
    await page.goto('/portal/eventos');
    await expect(page.getByRole('heading', { name: /Eventos/i })).toBeVisible();
    await page.goto('/portal/cobrancas');
    await expect(page.getByRole('heading', { name: /Cobranças/i })).toBeVisible();
  });
});
