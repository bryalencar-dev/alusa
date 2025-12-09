import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alunos = await prisma.aluno.findMany({
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('\n📋 Últimos 10 alunos cadastrados:\n');

  for (const aluno of alunos) {
    const hoje = new Date();
    let idade = hoje.getFullYear() - aluno.dataNasc.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = aluno.dataNasc.getMonth();

    if (
      mesAtual < mesNascimento ||
      (mesAtual === mesNascimento && hoje.getDate() < aluno.dataNasc.getDate())
    ) {
      idade--;
    }

    const isMenor = idade < 18;

    console.log(`👤 ${aluno.nome}`);
    console.log(`   Idade: ${idade} anos (${isMenor ? 'MENOR' : 'MAIOR'})`);
    console.log(`   Email: ${aluno.email || 'não informado'}`);
    console.log(`   Customer (aluno): ${aluno.asaasCustomerId || 'NULL'}`);

    if (aluno.responsaveis.length > 0) {
      const resp = aluno.responsaveis.find((ar) => ar.responsavel.financeiro)?.responsavel;
      if (resp) {
        console.log(`   Responsável: ${resp.nome}`);
        console.log(`   Customer (resp): ${resp.asaasCustomerId || 'NULL'}`);
      }
    }

    if (isMenor && aluno.asaasCustomerId) {
      console.log(`   ⚠️  PROBLEMA: Aluno menor tem customer (deveria estar no responsável)`);
    }

    if (!isMenor && aluno.responsaveis.length > 0) {
      const resp = aluno.responsaveis[0]?.responsavel;
      if (resp?.asaasCustomerId) {
        console.log(`   ⚠️  PROBLEMA: Aluno maior, mas customer está no responsável`);
      }
    }

    console.log('');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
