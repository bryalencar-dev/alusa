import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verificar() {
  const alunos = await prisma.aluno.findMany({
    where: {
      OR: [
        { nome: { contains: 'Vera', mode: 'insensitive' } },
        { nome: { contains: 'Elaine', mode: 'insensitive' } },
      ],
    },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
  });

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

    console.log('👤', aluno.nome);
    console.log('   Idade:', idade, 'anos');
    console.log('   CPF:', aluno.cpf || 'Não informado');
    console.log('   Email:', aluno.email || 'Não informado');
    console.log('   asaasCustomerId (aluno):', aluno.asaasCustomerId || 'NULL');

    const resp = aluno.responsaveis.find((ar) => ar.responsavel.financeiro)?.responsavel;
    if (resp) {
      console.log('   Responsável:', resp.nome);
      console.log('   asaasCustomerId (resp):', resp.asaasCustomerId || 'NULL');
    }
    console.log('');
  }
  await prisma.$disconnect();
}

verificar();
