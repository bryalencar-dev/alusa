import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAsaasCustomer() {
  console.log('\n🔍 Verificando customer no Asaas...\n');

  // Buscar conta e credenciais
  const conta = await prisma.conta.findFirst({
    where: { status: 'ATIVO' },
  });

  if (!conta) {
    console.log('❌ Nenhuma conta ativa encontrada');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 Conta:', conta.nome);
  console.log('🔑 API Key configurada:', conta.asaasApiKeyEncrypted ? '✅ SIM' : '❌ NÃO');
  console.log('');

  // Buscar responsável com customer
  const responsavel = await prisma.responsavel.findFirst({
    where: {
      nome: { contains: 'Vera', mode: 'insensitive' },
      asaasCustomerId: { not: null },
    },
  });

  if (!responsavel) {
    console.log('❌ Responsável não encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log('👥 Responsável:', responsavel.nome);
  console.log('💳 Customer ID:', responsavel.asaasCustomerId);
  console.log('');

  // Tentar buscar no Asaas
  if (!conta.asaasApiKeyEncrypted) {
    console.log('⚠️  Credenciais Asaas não configuradas na conta');
    console.log('   Configure em: /admin/config → Integrações → Asaas');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Tudo configurado corretamente!');
  console.log('');
  console.log('🔍 Para verificar no Asaas:');
  console.log('   1. Acesse: https://sandbox.asaas.com/customerAccount/list');
  console.log('   2. Busque por: Vera Lúcia Gomes de Alencar');
  console.log('   3. Ou busque por CPF: 027.197.862-76');
  console.log('   4. Ou busque por Customer ID:', responsavel.asaasCustomerId);

  await prisma.$disconnect();
}

checkAsaasCustomer().catch(console.error);
