import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = dataNascimento.getMonth();

  if (
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())
  ) {
    idade--;
  }

  return idade;
}

async function cleanupAsaasCustomerIds() {
  console.log('\n🧹 Limpando asaasCustomerId de alunos menores...\n');

  // Buscar todos os alunos com asaasCustomerId
  const alunosComCustomer = await prisma.aluno.findMany({
    where: {
      asaasCustomerId: { not: null },
      status: 'ATIVO',
    },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
  });

  console.log(`📊 Total de alunos com asaasCustomerId: ${alunosComCustomer.length}\n`);

  let corrigidos = 0;
  let mantidos = 0;

  for (const aluno of alunosComCustomer) {
    const idade = calcularIdade(aluno.dataNasc);
    const isMenor = idade < 18;

    if (isMenor) {
      console.log(`🔧 Corrigindo: ${aluno.nome} (${idade} anos - MENOR)`);
      console.log(`   - asaasCustomerId atual: ${aluno.asaasCustomerId}`);

      const respFinanceiro = aluno.responsaveis.find(
        (ar) => ar.responsavel.financeiro,
      )?.responsavel;

      if (respFinanceiro) {
        console.log(`   - Responsável: ${respFinanceiro.nome}`);
        console.log(
          `   - Responsável asaasCustomerId: ${respFinanceiro.asaasCustomerId || 'NULL'}`,
        );

        // Se o responsável NÃO tem asaasCustomerId, transferir do aluno
        if (!respFinanceiro.asaasCustomerId && aluno.asaasCustomerId) {
          await prisma.responsavel.update({
            where: { id: respFinanceiro.id },
            data: { asaasCustomerId: aluno.asaasCustomerId },
          });
          console.log(`   ✅ Transferido asaasCustomerId para o responsável`);
        }
      }

      // Remover asaasCustomerId do aluno menor
      await prisma.aluno.update({
        where: { id: aluno.id },
        data: { asaasCustomerId: null },
      });

      console.log(`   ✅ asaasCustomerId removido do aluno menor\n`);
      corrigidos++;
    } else {
      console.log(`✅ Mantido: ${aluno.nome} (${idade} anos - MAIOR)`);
      console.log(`   - asaasCustomerId: ${aluno.asaasCustomerId}\n`);
      mantidos++;
    }
  }

  console.log('\n📈 Resumo:');
  console.log(`   - Alunos menores corrigidos: ${corrigidos}`);
  console.log(`   - Alunos maiores mantidos: ${mantidos}`);
  console.log(`   - Total processados: ${alunosComCustomer.length}`);
  console.log('');
  console.log('✅ Limpeza concluída!');
}

async function main() {
  try {
    await cleanupAsaasCustomerIds();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
