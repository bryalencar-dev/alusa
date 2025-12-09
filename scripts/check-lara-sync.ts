import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const aluno = await prisma.aluno.findFirst({
    where: { nome: { contains: 'Lara', mode: 'insensitive' } },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!aluno) {
    console.log('❌ Aluno não encontrado');
    await prisma.$disconnect();
    return;
  }

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

  console.log('\n=== DIAGNÓSTICO ===\n');
  console.log('📝 ID:', aluno.id);
  console.log('👤 Nome:', aluno.nome);
  console.log('🎂 Idade:', idade, 'anos', idade < 18 ? '(MENOR)' : '(MAIOR)');
  console.log('📄 CPF:', aluno.cpf || 'NULL');
  console.log('📧 Email:', aluno.email || 'NULL');
  console.log('💳 asaasCustomerId (aluno):', aluno.asaasCustomerId || 'NULL');
  console.log('📅 Criado em:', aluno.createdAt.toLocaleString());
  console.log('');

  console.log('=== RESPONSÁVEIS ===\n');
  if (aluno.responsaveis.length === 0) {
    console.log('⚠️  Nenhum responsável cadastrado');
  } else {
    for (const ar of aluno.responsaveis) {
      const r = ar.responsavel;
      console.log('👥 Nome:', r.nome);
      console.log('   CPF:', r.cpf);
      console.log('   Email:', r.email);
      console.log('   Telefone:', r.telefone);
      console.log('   Financeiro:', r.financeiro ? '✅ SIM' : '❌ NÃO');
      console.log('   asaasCustomerId:', r.asaasCustomerId || 'NULL');
      console.log('');
    }
  }

  console.log('=== ANÁLISE ===\n');

  if (idade < 18) {
    const respFinanceiro = aluno.responsaveis.find((ar) => ar.responsavel.financeiro)?.responsavel;

    if (!respFinanceiro) {
      console.log('❌ PROBLEMA: Aluno menor sem responsável financeiro marcado');
    } else if (!respFinanceiro.asaasCustomerId) {
      console.log('❌ PROBLEMA: Customer não foi criado no Asaas para o responsável');
      console.log('   Possíveis causas:');
      console.log('   1. Função syncAlunoWithAsaas() falhou');
      console.log('   2. Credenciais Asaas não configuradas');
      console.log('   3. Erro na API do Asaas');
      console.log('   4. CPF ou email inválidos');
      console.log('');
      console.log('   Dados para sync:');
      console.log('   - Nome:', respFinanceiro.nome);
      console.log('   - CPF:', respFinanceiro.cpf);
      console.log('   - Email:', respFinanceiro.email);
      console.log('   - Telefone:', respFinanceiro.telefone);
    } else {
      console.log('✅ OK: Customer criado no responsável');
    }
  } else {
    if (!aluno.asaasCustomerId) {
      console.log('❌ PROBLEMA: Customer não foi criado no Asaas para o aluno');
    } else {
      console.log('✅ OK: Customer criado no aluno');
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
