#!/usr/bin/env tsx
/**
 * Script para debugar problema ao pausar matrícula
 */

import { prisma } from '../apps/web/src/prisma';
import { getSubscription, suspendSubscription } from '@alusa/lib/asaas';

async function main() {
  const matriculaId = process.argv[2];

  if (!matriculaId) {
    console.error('❌ Uso: npm run debug:pausar <matricula-id>');
    process.exit(1);
  }

  console.log('🔍 Buscando matrícula:', matriculaId);

  const matricula = await prisma.matricula.findFirst({
    where: { id: matriculaId },
    include: {
      aluno: {
        select: {
          nome: true,
          contaId: true,
        },
      },
    },
  });

  if (!matricula) {
    console.error('❌ Matrícula não encontrada');
    process.exit(1);
  }

  console.log('✅ Matrícula encontrada:');
  console.log('   - Aluno:', matricula.aluno.nome);
  console.log('   - Status:', matricula.status);
  console.log('   - Asaas Subscription ID:', matricula.asaasSubscriptionId || '❌ NÃO TEM');

  if (!matricula.asaasSubscriptionId) {
    console.error('\n❌ PROBLEMA: Esta matrícula não possui asaasSubscriptionId!');
    console.error('   Não é possível pausar uma matrícula sem assinatura no Asaas.');
    process.exit(1);
  }

  // Verificar estado atual da assinatura no Asaas
  console.log('\n🔍 Consultando assinatura no Asaas...');

  try {
    const subscription = await getSubscription(matricula.asaasSubscriptionId, {
      contaId: matricula.aluno.contaId,
    });

    console.log('✅ Assinatura encontrada no Asaas:');
    console.log('   - ID:', subscription.id);
    console.log('   - Status:', subscription.status);
    console.log('   - Cycle:', subscription.cycle);
    console.log('   - Value:', subscription.value);
    console.log('   - Next Due Date:', subscription.nextDueDate);

    if (subscription.status === 'INACTIVE') {
      console.warn('\n⚠️  A assinatura já está INATIVA no Asaas!');
      console.warn('   Não é possível suspender uma assinatura já inativa.');
      process.exit(0);
    }

    if (subscription.status !== 'ACTIVE') {
      console.warn('\n⚠️  A assinatura não está ATIVA no Asaas (status:', subscription.status, ')');
      console.warn('   Apenas assinaturas ATIVAS podem ser suspensas.');
      process.exit(0);
    }

    // Tentar suspender
    console.log('\n🔄 Tentando suspender assinatura...');

    const suspended = await suspendSubscription(matricula.asaasSubscriptionId, {
      contaId: matricula.aluno.contaId,
    });

    console.log('✅ Assinatura suspensa com sucesso!');
    console.log('   - Novo Status:', suspended.status);

    // Atualizar banco de dados local
    await prisma.matricula.update({
      where: { id: matriculaId },
      data: { status: 'PAUSADA' },
    });

    console.log('✅ Status atualizado no banco de dados local!');
  } catch (error) {
    console.error('\n❌ ERRO ao consultar/suspender assinatura no Asaas:');
    console.error(error);

    if ((error as any).response?.data) {
      console.error('\n📋 Detalhes do erro do Asaas:');
      console.error(JSON.stringify((error as any).response.data, null, 2));
    }

    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


