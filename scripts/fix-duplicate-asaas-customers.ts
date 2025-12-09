/**
 * Script para corrigir customers duplicados no Asaas
 *
 * Remove customers de alunos menores que foram criados incorretamente,
 * mantendo apenas o customer do responsável financeiro.
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

async function fixDuplicateCustomers() {
  console.log('🔍 Buscando alunos menores com asaasCustomerId...\n');

  const alunosMenores = await prisma.aluno.findMany({
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

  console.log(`📊 Total de alunos com customer: ${alunosMenores.length}\n`);

  let corrigidos = 0;
  let pulados = 0;

  for (const aluno of alunosMenores) {
    const idade = calcularIdade(aluno.dataNasc);

    // Se for MENOR de 18 anos e tem asaasCustomerId, está errado
    if (idade < 18 && aluno.asaasCustomerId) {
      const responsavelFinanceiro = aluno.responsaveis.find(
        (ar) => ar.responsavel.financeiro,
      )?.responsavel;

      if (!responsavelFinanceiro) {
        console.log(`⚠️  Aluno ${aluno.nome} (${idade} anos) - sem responsável financeiro`);
        pulados++;
        continue;
      }

      console.log(`🔧 Corrigindo: ${aluno.nome} (${idade} anos)`);
      console.log(`   - Aluno customer ID: ${aluno.asaasCustomerId}`);
      console.log(`   - Responsável: ${responsavelFinanceiro.nome}`);
      console.log(
        `   - Responsável customer ID: ${responsavelFinanceiro.asaasCustomerId || 'NÃO CRIADO'}`,
      );

      // Remover asaasCustomerId do aluno (o customer deve estar no responsável)
      await prisma.aluno.update({
        where: { id: aluno.id },
        data: { asaasCustomerId: null },
      });

      console.log(`   ✅ Customer removido do aluno\n`);
      corrigidos++;
    } else if (idade >= 18) {
      // Maior de idade com customer está correto
      pulados++;
    }
  }

  console.log('\n📈 Resumo:');
  console.log(`   - Corrigidos: ${corrigidos}`);
  console.log(`   - Pulados (corretos): ${pulados}`);
  console.log(`   - Total processados: ${alunosMenores.length}`);
}

async function main() {
  try {
    await fixDuplicateCustomers();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
