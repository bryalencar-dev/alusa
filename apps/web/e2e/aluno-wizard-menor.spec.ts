import { test, expect } from '@playwright/test';

// Fluxo: aluno menor de idade (responsável obrigatório)

test('Cadastro de aluno menor com responsável', async ({ page }) => {
  await page.goto('/alunos');

  await page.getByTestId('abrir-wizard-aluno').click();
  const wizard = page.getByTestId('aluno-wizard');
  await expect(wizard).toBeVisible();

  // Step 1: Identificação (menor => data recente)
  await page.getByLabel('Nome completo').fill('Aluno Menor Teste');
  await page.getByLabel('Data de nascimento').fill('2012-05-10');
  await page.getByLabel('CPF').fill('987.654.321-00');
  await page.getByLabel('Email').fill('aluno.menor@example.com');
  await page.getByLabel('Telefone').fill('(11) 97777-6666');
  await page.getByTestId('wizard-next').click();

  // Step 2: Endereço
  await page.getByLabel('CEP').fill('01001-000');
  await page.waitForTimeout(800);
  await page.getByLabel('Número').fill('55');
  await page.getByLabel('Número').fill('77');
  await page.getByTestId('wizard-next').click();

  // Step 3: Saúde & Emergência
  await page.getByPlaceholder('Pessoa para contato').fill('Tia Maria');
  await page.getByLabel('Telefone de emergência').fill('(11) 95555-4444');
  await page.getByTestId('wizard-next').click();

  // Step 4: Perfil
  await page.getByPlaceholder('Ex.: Ballet').fill('Jazz');
  await page.getByTestId('wizard-next').click();

  // Step 5: Foto (pula)
  await page.getByTestId('wizard-next').click();

  // Step 6: Responsável (aparece por ser menor)
  await page.getByLabel('Nome do responsável').fill('Responsável Teste');
  await page.getByLabel('CPF do responsável').fill('222.333.444-55');
  await page.getByLabel('E-mail').fill('responsavel@example.com');
  await page.getByLabel('Telefone do responsável').fill('(11) 96666-5555');
  await page.getByLabel('CEP do responsável').fill('01001-000');
  await page.waitForTimeout(800);
  await page.getByTestId('wizard-next').click();

  // Step 7: Confirmar
  await page.getByTestId('wizard-submit').click();

  await expect(page.getByText('Aluno cadastrado com sucesso', { exact: false })).toBeVisible();
  await expect(page.getByText('Aluno Menor Teste')).toBeVisible();
});
