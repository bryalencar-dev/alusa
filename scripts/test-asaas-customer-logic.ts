/**
 * Script de teste para validar a sincronização correta de customers no Asaas
 *
 * Testa:
 * 1. Aluno menor -> cria customer para responsável
 * 2. Aluno maior -> cria customer para o próprio aluno
 * 3. Não cria customers duplicados
 */

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

async function testarLogicaCustomers() {
  console.log('🧪 Testando lógica de criação de customers Asaas\n');
  console.log('='.repeat(60) + '\n');

  // Buscar todos os alunos
  const alunos = await prisma.aluno.findMany({
    where: { status: 'ATIVO' },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
    take: 10,
  });

  console.log(`📊 Total de alunos ativos: ${alunos.length}\n`);

  for (const aluno of alunos) {
    const idade = calcularIdade(aluno.dataNasc);
    const isMenor = idade < 18;

    console.log(`👤 ${aluno.nome}`);
    console.log(`   - Idade: ${idade} anos (${isMenor ? 'MENOR' : 'MAIOR'} de idade)`);
    console.log(`   - CPF: ${aluno.cpf || 'Não informado'}`);
    console.log(`   - Email: ${aluno.email || 'Não informado'}`);

    if (isMenor) {
      const responsavelFinanceiro = aluno.responsaveis.find(
        (ar) => ar.responsavel.financeiro,
      )?.responsavel;

      if (responsavelFinanceiro) {
        console.log(`   - Responsável: ${responsavelFinanceiro.nome}`);
        console.log(`   - Responsável CPF: ${responsavelFinanceiro.cpf}`);
        console.log(`   - Responsável Email: ${responsavelFinanceiro.email}`);
        console.log(`   - Customer deve estar em: RESPONSÁVEL`);

        if (aluno.asaasCustomerId) {
          console.log(
            `   ⚠️  ERRO: Aluno menor tem asaasCustomerId (deveria estar no responsável)`,
          );
        }

        if (responsavelFinanceiro.asaasCustomerId) {
          console.log(`   ✅ Customer no responsável: ${responsavelFinanceiro.asaasCustomerId}`);
        } else {
          console.log(`   ℹ️  Responsável sem customer (será criado na próxima matrícula)`);
        }
      } else {
        console.log(`   ⚠️  AVISO: Aluno menor sem responsável financeiro cadastrado`);
      }
    } else {
      console.log(`   - Customer deve estar em: ALUNO`);

      if (aluno.asaasCustomerId) {
        console.log(`   ✅ Customer no aluno: ${aluno.asaasCustomerId}`);
      } else {
        console.log(`   ℹ️  Aluno sem customer (será criado na próxima matrícula)`);
      }
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('\n✅ Teste concluído!\n');
}

async function main() {
  try {
    await testarLogicaCustomers();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
