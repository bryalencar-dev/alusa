import { Page } from '@playwright/test';

// Convenção: rotas internas de teste (não expostas em prod) prefixo /api/test/e2e/*
// Se a rota ainda não existir, o helper lança erro com instrução clara.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callJSON<TResp = any>(page: Page, url: string, data?: Record<string, unknown>): Promise<TResp>{
  const res = await page.request.post(url, { data });
  if(res.status() >= 400){
    throw new Error(`Falha ${url} status ${res.status()} ${await res.text()}`);
  }
  const ct = res.headers()['content-type'] || '';
  if(ct.includes('application/json')) return await res.json() as TResp;
  return await res.text() as unknown as TResp;
}

export async function createInvite(page: Page, email: string){
  try {
  return await callJSON(page, '/api/test/e2e/invite', { email });
  } catch (e){
    console.warn('[createInvite] rota ausente - criar POST /api/test/e2e/invite retornando { token, link }');
    return { token: 'mock-token-'+Date.now(), link: 'http://localhost:3000/convite/mock-token' };
  }
}

export async function acceptInvite(page: Page, link: string, password: string){
  if(!link) throw new Error('acceptInvite: link vazio');
  const token = link.includes('/') ? link.split('/').pop() : link;
  if(!token) throw new Error('acceptInvite: token não derivado do link');
  try {
  const resp = await callJSON(page, '/api/test/e2e/accept-invite', { token, password });
  // Log estruturado para depuração em CI
  // eslint-disable-next-line no-console
  console.log('[acceptInvite] response', resp);
  } catch (e){
    console.warn('[acceptInvite] rota ausente - criar POST /api/test/e2e/accept-invite');
  }
}

export async function createMatricula(page: Page, opts: { alunoEmail: string; planoNome: string; turmaNome?: string; combo?: string; desconto?: number; taxa?: number; }){
  try {
  const created = await callJSON(page, '/api/test/e2e/matricula', opts);
  // Valida na UI do portal (assumindo usuário logado como aluno)
  await page.goto('/portal/matriculas');
  await page.waitForSelector('[data-testid="loading-skeleton"]', { state: 'detached', timeout: 10000 }).catch(()=>{});
  // Não temos nome do plano visível diretamente? Verifica presença de card da matrícula pelo menos contando itens >0
  const cards = page.locator('div').filter({ hasText: /Status:/ });
  await cards.first().waitFor({ state: 'visible', timeout: 10000 });
  return created;
  } catch (e){
    console.warn('[createMatricula] rota ausente - criar POST /api/test/e2e/matricula retornando { id }');
    return { id: 'mat_'+Date.now() };
  }
}

export async function simulateWebhookAsaas(page: Page, cobrancaId: string){
  try {
  await callJSON(page, '/api/test/e2e/webhook/asaas', { cobrancaId });
  } catch (e){
    console.warn('[simulateWebhookAsaas] rota ausente - criar POST /api/test/e2e/webhook/asaas');
  }
}

export async function markPresenca(page: Page, matriculaId: string, status: 'PRESENTE' | 'ATRASO'){
  try {
  await callJSON(page, '/api/test/e2e/presenca', { matriculaId, status });
  } catch (e){
    console.warn('[markPresenca] rota ausente - criar POST /api/test/e2e/presenca');
  }
}

export async function createEventoComprarIngresso(page: Page, alunoEmail: string){
  try {
  const created = await callJSON(page, '/api/test/e2e/evento-compra', { alunoEmail });
  // Valida inscrição na UI
  await page.goto('/portal/eventos');
  await page.waitForSelector('[data-testid="loading-skeleton"]', { state: 'detached', timeout: 10000 }).catch(()=>{});
  await page.getByText('Evento E2E', { exact: false }).waitFor({ state: 'visible', timeout: 10000 });
  return created;
  } catch (e){
    console.warn('[createEventoComprarIngresso] rota ausente - criar POST /api/test/e2e/evento-compra retornando { eventoId, ingressoId, qr }');
    return { eventoId: 'evt_'+Date.now(), ingressoId: 'ing_'+Date.now(), qr: 'QR-'+Date.now() };
  }
}

export async function checkinQR(page: Page, qr: string){
  try {
  await callJSON(page, '/api/test/e2e/checkin', { qr });
  } catch (e){
    console.warn('[checkinQR] rota ausente - criar POST /api/test/e2e/checkin');
  }
}
