/**
 * Script de teste manual da integração Asaas
 *
 * Usage:
 *   pnpm tsx scripts/test-asaas.ts
 *
 * Requisitos:
 * - Configurar .env.local com ASAAS_API_KEY e ASAAS_BASE_URL
 * - Ter FEATURE_ASAAS=true
 * - Ter um aluno cadastrado no banco
 */

import 'dotenv/config';
import { prisma } from '../apps/web/src/prisma';
import {
  createCustomer,
  createSubscription,
  createPayment,
  isAsaasEnabled,
} from '@alusa/lib/asaas';

async function main() {
  console.log('🚀 Teste de integração Asaas\n');

  // 1. Verificar feature flag
  if (!isAsaasEnabled()) {
    console.error('❌ FEATURE_ASAAS não está habilitada');
    console.log('   Configure FEATURE_ASAAS=true no .env.local');
    process.exit(1);
  }

  console.log('✅ Feature flag habilitada\n');

  // 2. Buscar primeiro aluno
  const aluno = await prisma.aluno.findFirst({
    where: { status: 'ATIVO' },
  });

  if (!aluno) {
    console.error('❌ Nenhum aluno encontrado no banco');
    process.exit(1);
  }

  console.log(`✅ Aluno encontrado: ${aluno.nome} (${aluno.id})\n`);

  // 3. Criar customer no Asaas (se não existir)
  let customerId = aluno.asaasCustomerId;

  if (!customerId) {
    console.log('📝 Criando customer no Asaas...');

    try {
      const customer = await createCustomer({
        name: aluno.nome,
        cpfCnpj: aluno.cpf || '12345678901', // CPF fake para sandbox
        email: aluno.email || `${aluno.id}@test.com`,
        phone: aluno.telefone || '11987654321',
      });

      customerId = customer.id;

      // Atualizar aluno no banco
      await prisma.aluno.update({
        where: { id: aluno.id },
        data: { asaasCustomerId: customerId },
      });

      console.log(`✅ Customer criado: ${customerId}\n`);
    } catch (error) {
      console.error('❌ Erro ao criar customer:', error);
      process.exit(1);
    }
  } else {
    console.log(`✅ Customer já existe: ${customerId}\n`);
  }

  // 4. Criar pagamento único (taxa de matrícula)
  console.log('📝 Criando pagamento único (taxa de matrícula)...');

  try {
    const payment = await createPayment({
      customer: customerId,
      value: 50.0,
      billingType: 'PIX',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 dias
      description: 'Taxa de matrícula - Teste',
    });

    console.log(`✅ Pagamento criado: ${payment.id}`);
    console.log(`   Valor: R$ ${payment.value}`);
    console.log(`   Vencimento: ${payment.dueDate}`);
    console.log(`   Status: ${payment.status}\n`);
  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
  }

  // 5. Criar subscription (assinatura recorrente)
  console.log('📝 Criando subscription (mensalidade recorrente)...');

  try {
    const subscription = await createSubscription({
      customer: customerId,
      value: 199.9,
      billingType: 'BOLETO',
      cycle: 'MONTHLY',
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 dias
      description: 'Mensalidade Ballet Iniciante - Teste',
    });

    console.log(`✅ Subscription criada: ${subscription.id}`);
    console.log(`   Valor: R$ ${subscription.value}`);
    console.log(`   Próximo vencimento: ${subscription.nextDueDate}`);
    console.log(`   Ciclo: ${subscription.cycle}`);
    console.log(`   Status: ${subscription.status}\n`);
  } catch (error) {
    console.error('❌ Erro ao criar subscription:', error);
  }

  console.log('🎉 Teste concluído!\n');
  console.log('📊 Próximos passos:');
  console.log('   1. Acesse o painel Asaas sandbox para ver as cobranças');
  console.log('   2. Simule um pagamento para testar o webhook');
  console.log('   3. Configure o webhook URL no painel Asaas:');
  console.log('      https://seu-dominio.com/api/asaas/webhooks\n');
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
