/**
 * Script para limpar CheckoutLinks antigos com tokens UUID inválidos
 * e forçar regeneração de tokens JWT válidos
 */

import { prisma } from '../apps/web/src/prisma';

async function cleanInvalidCheckoutLinks() {
  console.log('🔍 Verificando CheckoutLinks...');

  // Buscar todos os links
  const allLinks = await prisma.checkoutLink.findMany({
    select: {
      id: true,
      token: true,
      matriculaId: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Total de links encontrados: ${allLinks.length}`);

  // Identificar tokens UUID (não começam com "eyJ" que é JWT)
  const invalidLinks = allLinks.filter((link) => !link.token.startsWith('eyJ'));

  console.log(`❌ Links com token UUID inválido: ${invalidLinks.length}`);

  if (invalidLinks.length > 0) {
    console.log('\n📋 Links inválidos encontrados:');
    invalidLinks.forEach((link) => {
      console.log(
        `  - ID: ${link.id.slice(0, 8)}... | Token: ${link.token.slice(0, 20)}... | Matrícula: ${link.matriculaId.slice(0, 8)}...`,
      );
    });

    // Perguntar se deseja deletar
    console.log('\n🗑️  Deletando links inválidos...');

    const result = await prisma.checkoutLink.deleteMany({
      where: {
        id: { in: invalidLinks.map((l) => l.id) },
      },
    });

    console.log(`✅ ${result.count} links inválidos deletados.`);
  } else {
    console.log('✅ Nenhum link inválido encontrado.');
  }

  // Verificar links válidos (JWT)
  const validLinks = allLinks.filter((link) => link.token.startsWith('eyJ'));
  console.log(`\n✅ Links com token JWT válido: ${validLinks.length}`);

  if (validLinks.length > 0) {
    console.log('\n📋 Links válidos (JWT):');
    validLinks.slice(0, 3).forEach((link) => {
      const isExpired = link.expiresAt < new Date();
      console.log(
        `  - ID: ${link.id.slice(0, 8)}... | Expira: ${link.expiresAt.toLocaleDateString('pt-BR')} ${isExpired ? '(EXPIRADO)' : '(VÁLIDO)'}`,
      );
    });
  }

  console.log('\n✅ Limpeza concluída!');
  console.log(
    '💡 Agora você pode clicar em "Reenviar cobrança" novamente para gerar um token JWT válido.',
  );
}

cleanInvalidCheckoutLinks()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });
