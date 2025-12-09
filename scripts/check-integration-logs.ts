import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLogs() {
  console.log('\n🔍 Verificando logs de integração...\n');

  // Buscar logs de integração recentes
  const logs = await prisma.logIntegracao.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`📋 Total de logs: ${logs.length}\n`);

  if (logs.length === 0) {
    console.log('❌ Nenhum log de integração encontrado');
    console.log('   Isso significa que syncAlunoWithAsaas() NÃO foi executado');
    console.log('');
  } else {
    logs.forEach((log, i) => {
      console.log(`--- Log ${i + 1} ---`);
      console.log('📅 Data:', log.createdAt.toLocaleString());
      console.log('🔧 Tipo:', log.tipoOperacao);
      console.log('✅ Status:', log.status);
      console.log('📦 Entidade:', log.entidade, '-', log.entidadeId?.substring(0, 10) + '...');
      console.log('🌐 HTTP Status:', log.httpStatus || 'N/A');

      if (log.response) {
        const resp = log.response as Record<string, unknown>;
        if (resp.id) console.log('💳 Customer ID:', resp.id);
        if (resp.name) console.log('👤 Nome:', resp.name);
        if (resp.errors) console.log('❌ Erros:', JSON.stringify(resp.errors));
      }

      if (log.errorMessage) {
        console.log('❌ Erro:', log.errorMessage);
      }

      console.log('');
    });
  }

  // Verificar se há customer órfão (salvo no banco mas não no Asaas)
  const responsavel = await prisma.responsavel.findFirst({
    where: {
      nome: { contains: 'Vera', mode: 'insensitive' },
    },
  });

  if (responsavel?.asaasCustomerId) {
    console.log(
      '⚠️  ATENÇÃO: Responsável tem asaasCustomerId no banco:',
      responsavel.asaasCustomerId,
    );
    console.log('   Mas esse customer pode não existir no Asaas');
    console.log('   Vou tentar buscar via API...\n');
  }

  await prisma.$disconnect();
}

checkLogs().catch(console.error);
