/**
 * Script para sincronizar formaPagamento das cobranças com base no billingType do Asaas
 *
 * Este script:
 * 1. Busca todas as cobranças com asaasPaymentId (vinculadas ao Asaas)
 * 2. Consulta a API do Asaas para obter o billingType real de cada pagamento
 * 3. Atualiza o formaPagamento na cobrança local para refletir o método real usado
 *
 * Casos de uso:
 * - Cobranças criadas antes da correção do webhook
 * - Pagamentos onde o usuário mudou o método (ex: criado como BOLETO mas pagou com CARTAO)
 * - Sincronização manual para garantir consistência dos dados
 *
 * Uso:
 * ```bash
 * pnpm tsx scripts/fix-forma-pagamento.ts
 * ```
 */

import { PrismaClient, FormaPagamento } from '@prisma/client';
import { loadDecryptedAsaasCredentials } from '../packages/lib/src/asaas/credentials';
import { getAsaasBaseUrl } from '../packages/lib/src/asaas/env';

const prisma = new PrismaClient();

console.log('🔄 Script de Sincronização de Forma de Pagamento');
console.log('================================================\n');

const billingTypeMap: Record<string, FormaPagamento> = {
  BOLETO: FormaPagamento.BOLETO,
  PIX: FormaPagamento.PIX,
  CREDIT_CARD: FormaPagamento.CARTAO,
  UNDEFINED: FormaPagamento.DINHEIRO,
};

async function fixFormaPagamento() {
  console.log('� Buscando cobranças vinculadas ao Asaas...\n');

  // Buscar todas as cobranças com asaasPaymentId
  const cobrancas = await prisma.cobranca.findMany({
    where: {
      asaasPaymentId: { not: null },
    },
    include: {
      matricula: {
        include: {
          aluno: {
            select: { contaId: true, nome: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total de cobranças encontradas: ${cobrancas.length}`);
  console.log(
    `📅 Período: ${cobrancas.length > 0 ? `${cobrancas[cobrancas.length - 1].createdAt.toLocaleDateString()} a ${cobrancas[0].createdAt.toLocaleDateString()}` : 'N/A'}\n`,
  );

  let totalAtualizado = 0;
  let totalErros = 0;

  for (const cobranca of cobrancas) {
    const { asaasPaymentId, id, formaPagamento, matricula } = cobranca;
    const contaId = matricula.aluno.contaId;

    if (!asaasPaymentId || !contaId) {
      console.warn(`⚠️ Cobrança ${id} sem asaasPaymentId ou contaId`);
      totalErros++;
      continue;
    }

    try {
      // Obter credenciais Asaas
      const creds = await loadDecryptedAsaasCredentials(contaId);
      if (!creds?.apiKey) {
        console.warn(`⚠️ Credenciais Asaas não encontradas para conta ${contaId}`);
        totalErros++;
        continue;
      }

      // Determinar URL base (verificar se é sandbox baseado no prefixo da chave)
      const baseUrl = getAsaasBaseUrl(creds.apiKey);

      // Buscar payment no Asaas via API (usando fetch nativo)
      const response = await fetch(`${baseUrl}/payments/${asaasPaymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          access_token: creds.apiKey!,
        },
      });

      if (!response.ok) {
        throw new Error(`Asaas API error: ${response.status} ${response.statusText}`);
      }

      const payment = await response.json();

      if (!payment?.billingType) {
        console.warn(`⚠️ Payment ${asaasPaymentId} sem billingType`);
        totalErros++;
        continue;
      }

      const formaPagamentoCorreto = billingTypeMap[payment.billingType] || formaPagamento;

      // Atualizar apenas se diferente
      if (formaPagamentoCorreto !== formaPagamento) {
        await prisma.cobranca.update({
          where: { id },
          data: { formaPagamento: formaPagamentoCorreto },
        });

        console.log(
          `✅ Cobrança ${id.substring(0, 8)}... (${matricula.aluno.nome}): ${formaPagamento} → ${formaPagamentoCorreto} | Asaas: ${payment.billingType} | Status: ${payment.status}`,
        );
        totalAtualizado++;
      } else {
        // Apenas mostra se for diferente de BOLETO (para reduzir ruído)
        if (formaPagamento !== 'BOLETO') {
          console.log(
            `ℹ️  Cobrança ${id.substring(0, 8)}... (${matricula.aluno.nome}): já correto (${formaPagamento})`,
          );
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar cobrança ${id}:`, error);
      totalErros++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📈 RESUMO DA SINCRONIZAÇÃO`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Total processado:     ${cobrancas.length}`);
  console.log(`   ✅ Atualizados:       ${totalAtualizado}`);
  console.log(`   ❌ Erros:             ${totalErros}`);
  console.log(`   ℹ️  Sem alteração:     ${cobrancas.length - totalAtualizado - totalErros}`);
  console.log(`${'='.repeat(60)}`);
}

fixFormaPagamento()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
