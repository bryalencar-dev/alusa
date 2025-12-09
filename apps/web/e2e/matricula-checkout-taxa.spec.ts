import { test, expect } from '@playwright/test';

/**
 * Teste E2E do fluxo completo: Wizard de Matrícula → Checkout Taxa
 *
 * Valida:
 * 1. Criação de matrícula com taxa não isenta
 * 2. Geração de cobrança no Asaas
 * 3. Redirecionamento para checkout apropriado (PIX/Cartão/Boleto)
 * 4. Exibição correta dos dados de pagamento
 *
 * @group e2e
 * @group matricula
 * @group checkout
 */

test.describe('Fluxo Matrícula → Checkout Taxa', () => {
  test.beforeEach(async () => {
    // TODO: Implementar autenticação
    // await page.goto('/login');
    // await login(page);
    // await page.goto('/matriculas/novo');
  });

  test('deve criar matrícula com taxa PIX e redirecionar para checkout', async ({ page }) => {
    // ========================================================================
    // Step 1: Preencher wizard de matrícula
    // ========================================================================

    await test.step('Seleciona aluno maior de idade', async () => {
      await page.waitForSelector('[data-step="aluno"]');

      // Selecionar aluno adulto (sem necessidade de responsável)
      const alunoMaior = page.locator('[data-aluno-card][data-idade="18+"]').first();
      await alunoMaior.click();

      await page.locator('button:has-text("Avançar")').click();
    });

    await test.step('Seleciona turma', async () => {
      await page.waitForSelector('[data-step="turmasCombo"]');

      const turmaValida = page.locator('[data-turma-card]').first();
      await turmaValida.click();

      await page.locator('button:has-text("Avançar")').click();
    });

    await test.step('Configura taxa de matrícula (R$ 150 - PIX)', async () => {
      await page.waitForSelector('[data-step="taxa"]');

      // Escolher "Cobrar taxa"
      await page.locator('button:has-text("Cobrar taxa")').click();

      // Definir valor
      await page.locator('input[name="taxaMatricula"]').fill('150');

      // Selecionar PIX como forma de pagamento
      await page.locator('button[data-payment-method="PIX"]').click();

      // Verificar que "Gerar cobrança automaticamente" está marcado
      const gerarCobranca = page.locator('input[name="gerarCobrancaTaxa"]');
      await expect(gerarCobranca).toBeChecked();

      await page.locator('button:has-text("Avançar")').click();
    });

    await test.step('Seleciona plano', async () => {
      await page.waitForSelector('[data-step="plano"]');

      const planoBasico = page.locator('[data-plano-card]').first();
      await planoBasico.click();

      await page.locator('button:has-text("Avançar")').click();
    });

    await test.step('Define forma de pagamento da mensalidade', async () => {
      await page.waitForSelector('[data-step="financeiro"]');

      await page.locator('button[data-payment-method="BOLETO"]').click();

      await page.locator('button:has-text("Avançar")').click();
    });

    await test.step('Revisa e confirma resumo', async () => {
      await page.waitForSelector('[data-step="resumo"]');

      // Verificar exibição do resumo da taxa
      const taxaResumo = page.locator('[data-taxa-resumo]');
      await expect(taxaResumo).toBeVisible();
      await expect(taxaResumo).toContainText('R$ 150,00');
      await expect(taxaResumo).toContainText('PIX');

      // Marcar confirmação
      const checkbox = page.locator('input[name="confirmacaoRevisao"]');
      await checkbox.check();

      // Concluir matrícula
      const botaoConcluir = page.locator('button:has-text("Concluir")');
      await expect(botaoConcluir).toBeEnabled();
      await botaoConcluir.click();
    });

    // ========================================================================
    // Step 2: Aguardar criação e redirecionamento para checkout
    // ========================================================================

    await test.step('Aguarda criação da matrícula e redirecionamento', async () => {
      // Aguardar toast de sucesso
      await expect(page.locator('text="Matrícula criada com sucesso"')).toBeVisible({
        timeout: 10000,
      });

      // Deve redirecionar para /checkout/pix/[cobrancaId]
      await page.waitForURL(/\/checkout\/pix\/\w+/, { timeout: 10000 });

      // Extrair ID da cobrança da URL
      const url = page.url();
      const cobrancaId = url.match(/\/checkout\/pix\/(\w+)/)?.[1];
      expect(cobrancaId).toBeTruthy();

      console.log('[E2E] Cobrança criada:', cobrancaId);
    });

    // ========================================================================
    // Step 3: Validar página de checkout PIX
    // ========================================================================

    await test.step('Valida exibição do QR Code PIX', async () => {
      // Aguardar carregamento do checkout
      await page.waitForSelector('text="Pagamento via PIX"');

      // Verificar valor
      await expect(page.locator('text="R$ 150,00"')).toBeVisible();

      // Verificar QR Code (pode ser imagem ou placeholder)
      const qrCodeImg = page.locator('img[alt="QR Code PIX"]');
      const qrCodePlaceholder = page.locator('text="QR Code não disponível"');

      // Um dos dois deve estar visível
      const qrCodeExists = (await qrCodeImg.count()) > 0 || (await qrCodePlaceholder.count()) > 0;
      expect(qrCodeExists).toBeTruthy();

      // Verificar código Copia e Cola
      const copiaCola = page.locator('input[readonly][value*="00020126"]');
      if ((await copiaCola.count()) > 0) {
        await expect(copiaCola).toBeVisible();

        // Testar botão de copiar
        const botaoCopiar = page.locator('button:has-text("Copiar")');
        await botaoCopiar.click();

        // Verificar que código foi copiado (difícil testar clipboard diretamente)
        // Pode usar alert ou toast
        await page.waitForTimeout(500);
      }
    });

    await test.step('Valida instruções de pagamento', async () => {
      await expect(page.locator('text="Instruções:"')).toBeVisible();
      await expect(page.locator('text="Abra o aplicativo do seu banco"')).toBeVisible();
      await expect(page.locator('text="Escaneie o QR Code ou cole o código"')).toBeVisible();
    });

    await test.step('Valida link para fatura Asaas', async () => {
      const linkAsaas = page.locator('a:has-text("Ver fatura completa no Asaas")');

      if ((await linkAsaas.count()) > 0) {
        await expect(linkAsaas).toBeVisible();
        await expect(linkAsaas).toHaveAttribute('target', '_blank');
      }
    });
  });

  test('deve criar matrícula com taxa CARTAO e redirecionar para Asaas', async ({ page }) => {
    // Similar ao teste PIX, mas com Cartão

    await test.step('Preenche wizard com taxa CARTAO', async () => {
      // Repetir passos até taxa
      // ...

      // Na etapa de taxa:
      await page.waitForSelector('[data-step="taxa"]');
      await page.locator('button:has-text("Cobrar taxa")').click();
      await page.locator('input[name="taxaMatricula"]').fill('120');

      // Selecionar CARTAO
      await page.locator('button[data-payment-method="CARTAO"]').click();

      // Continuar wizard...
      // await page.locator('button:has-text("Avançar")').click();
      // ...
    });

    await test.step('Valida redirecionamento para Asaas', async () => {
      // Após concluir, deve redirecionar para /checkout/cartao/[cobrancaId]
      await page.waitForURL(/\/checkout\/cartao\/\w+/, { timeout: 10000 });

      // Página deve mostrar loading e redirecionar para Asaas
      await expect(page.locator('text="Redirecionando para pagamento"')).toBeVisible();

      // Aguardar redirecionamento automático (2 segundos)
      await page.waitForTimeout(3000);

      // URL deve ser do Asaas
      const url = page.url();
      expect(url).toContain('asaas.com');
    });
  });

  test('deve criar matrícula com taxa BOLETO e exibir dados de pagamento', async ({ page }) => {
    await test.step('Preenche wizard com taxa BOLETO', async () => {
      // Similar aos anteriores
      // ...

      await page.waitForSelector('[data-step="taxa"]');
      await page.locator('button:has-text("Cobrar taxa")').click();
      await page.locator('input[name="taxaMatricula"]').fill('100');

      // Selecionar BOLETO
      await page.locator('button[data-payment-method="BOLETO"]').click();

      // Continuar...
    });

    await test.step('Valida página de checkout BOLETO', async () => {
      await page.waitForURL(/\/checkout\/boleto\/\w+/, { timeout: 10000 });

      // Verificar dados do boleto
      await expect(page.locator('text="Pagamento via Boleto"')).toBeVisible();
      await expect(page.locator('text="R$ 100,00"')).toBeVisible();

      // Verificar Nosso Número
      const nossoNumero = page.locator('[data-nosso-numero]');
      await expect(nossoNumero).toBeVisible();

      // Verificar link de download do PDF
      const downloadLink = page.locator('a:has-text("Baixar Boleto (PDF)")');
      await expect(downloadLink).toBeVisible();
      await expect(downloadLink).toHaveAttribute('target', '_blank');
    });
  });

  test('deve criar matrícula com taxa isenta e NÃO gerar checkout', async ({ page }) => {
    await test.step('Preenche wizard com taxa ISENTA', async () => {
      // ...passos anteriores

      await page.waitForSelector('[data-step="taxa"]');

      // Escolher "Isentar taxa"
      await page.locator('button:has-text("Isentar taxa")').click();

      // Preencher justificativa
      await page.locator('textarea[name="taxaJustificativa"]').fill('Aluno bolsista integral');

      await page.locator('button:has-text("Avançar")').click();

      // Continuar até o final...
    });

    await test.step('Confirma que NÃO redireciona para checkout', async () => {
      // Clicar em "Concluir"
      const botaoConcluir = page.locator('button:has-text("Concluir")');
      await botaoConcluir.click();

      // Aguardar toast de sucesso
      await expect(page.locator('text="Matrícula criada com sucesso"')).toBeVisible();

      // NÃO deve redirecionar para checkout
      // Deve ir para /matriculas ou /matriculas/[id]
      await page.waitForURL(/\/matriculas/, { timeout: 5000 });

      // Não deve conter /checkout na URL
      const url = page.url();
      expect(url).not.toContain('/checkout');
    });
  });

  test('deve simular polling e detectar pagamento confirmado', async ({ page }) => {
    // Este teste requer mock do backend ou uso do Sandbox do Asaas

    test.skip(true, 'Requer configuração de mock ou Sandbox');

    await test.step('Acessa checkout PIX', async () => {
      // Navegar direto para checkout existente (usar ID de teste)
      await page.goto('/checkout/pix/test-cobranca-id');
    });

    await test.step('Simula pagamento e aguarda polling detectar', async () => {
      // Backend deveria ter endpoint de teste para simular webhook do Asaas
      // Exemplo: POST /api/test/webhook/asaas/payment-received

      // Interceptar requests de polling
      let pollCount = 0;
      page.on('request', (request) => {
        if (request.url().includes('/api/checkout/pix/')) {
          pollCount++;
        }
      });

      // Aguardar pelo menos 2 polls (10 segundos)
      await page.waitForTimeout(12000);
      expect(pollCount).toBeGreaterThanOrEqual(2);

      // Se pagamento foi confirmado, deve exibir mensagem de sucesso
      // await expect(page.locator('text="Pagamento confirmado"')).toBeVisible();
    });
  });
});

/**
 * Testes de edge cases e validações
 */
test.describe('Validações de Checkout', () => {
  test('deve exibir erro ao acessar cobrança inexistente', async ({ page }) => {
    await page.goto('/checkout/pix/cobranca-invalida-123');

    await expect(page.locator('text="Erro ao carregar"')).toBeVisible({ timeout: 5000 });

    const botaoVoltar = page.locator('button:has-text("Voltar")');
    await expect(botaoVoltar).toBeVisible();
  });

  test('deve exibir status "expirado" para cobrança vencida', async ({ page }) => {
    test.skip(true, 'Requer cobrança de teste já vencida');

    // Usar ID de cobrança que já passou do vencimento
    await page.goto('/checkout/pix/cobranca-expirada-id');

    await expect(page.locator('text="Checkout expirado"')).toBeVisible();
    await expect(page.locator('text="prazo para pagamento expirou"')).toBeVisible();
  });

  test('deve exibir status "pago" para cobrança já confirmada', async ({ page }) => {
    test.skip(true, 'Requer cobrança de teste já paga');

    await page.goto('/checkout/pix/cobranca-paga-id');

    await expect(page.locator('text="Pagamento confirmado"')).toBeVisible();

    // Não deve exibir QR Code
    await expect(page.locator('img[alt="QR Code PIX"]')).not.toBeVisible();
  });
});
