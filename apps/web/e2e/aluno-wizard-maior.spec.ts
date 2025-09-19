import { test, expect } from '@playwright/test';

// Fluxo: aluno >= 18 anos (sem responsável)
// Pré-requisito: rota /alunos ou página que contenha botão para abrir wizard.
// Assumimos que há um botão 'Cadastrar aluno' (ajuste se diferente).

test('Cadastro de aluno maior de idade sem responsável', async ({ page }) => {
  await page.goto('/alunos');

  const suffix = Date.now().toString().slice(-6);
  const cpfDigits = '9' + Date.now().toString().slice(-10); // 11 dígitos
  const cpfFormatted = `${cpfDigits.slice(0,3)}.${cpfDigits.slice(3,6)}.${cpfDigits.slice(6,9)}-${cpfDigits.slice(9)}`;
  const email = `aluno.maior+${suffix}@example.com`;

  // Abrir wizard (usa data-testid para estabilidade)
  await page.getByTestId('abrir-wizard-aluno').click();
  const wizard = page.getByTestId('aluno-wizard');
  await expect(wizard).toBeVisible();

  // Step 1: Identificação
  await page.getByLabel('Nome completo').fill('Aluno Maior Teste');
  await page.getByLabel('Data de nascimento').fill('2000-01-01');
  await page.getByLabel('CPF').fill(cpfFormatted);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Telefone').fill('(11) 98888-7777');
  await page.getByTestId('wizard-next').click();

  // Step 2: Endereço
  await page.getByLabel('CEP').fill('01001-000');
  // Aguarda auto lookup (timeout leve)
  await page.waitForTimeout(800);
  // Campo número é obrigatório no schema backend
  await page.getByLabel('Número').fill('123');
  await page.getByTestId('wizard-next').click();

  // Step 3: Saúde & Emergência (deixa em branco)
  await page.getByTestId('wizard-next').click();

  // Step 4: Perfil & Classificação
  await page.getByPlaceholder('Ex.: Ballet').fill('Ballet');
  await page.getByPlaceholder('Ex.: Intermediário').fill('Intermediário');
  await page.getByTestId('wizard-next').click();

  // Step 5: Foto (pula)
  await page.getByTestId('wizard-next').click();

  // Step 6: Confirmar (sem responsável adicionado)
  await page.getByTestId('wizard-submit').click();
  // Aguarda resposta da API de criação
  const resp = await page.waitForResponse(r => r.url().includes('/api/alunos') && r.request().method()==='POST');
  try {
    const body = await resp.json();
    // eslint-disable-next-line no-console
    console.log('DEBUG create aluno status', resp.status(), body);
  } catch {/* noop */}
  expect(resp.status()).toBe(201);
  // Aguarda nome aparecer em linha da tabela (data-testid)
  await expect(page.locator('[data-testid^="aluno-nome-"]').filter({ hasText: 'Aluno Maior Teste' }).first()).toBeVisible({ timeout: 15000 });
});
