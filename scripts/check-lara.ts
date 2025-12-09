import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const aluno = await prisma.aluno.findFirst({
    where: {
      OR: [{ cpf: '027.197.862-76' }, { cpf: '02719786276' }, { email: 'gestao.alusa@gmail.com' }],
    },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
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

  const isMenor = idade < 18;

  console.log('\n=== DIAGNÓSTICO DO ALUNO ===\n');
  console.log('👤 Nome:', aluno.nome);
  console.log('📅 Data Nasc:', aluno.dataNasc.toLocaleDateString());
  console.log('🎂 Idade:', idade, 'anos', isMenor ? '(MENOR)' : '(MAIOR)');
  console.log('📧 Email:', aluno.email || 'não informado');
  console.log('📄 CPF:', aluno.cpf || 'não informado');
  console.log('💳 asaasCustomerId (aluno):', aluno.asaasCustomerId || 'NULL');
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
      console.log('   É pagador (financeiro):', r.financeiro ? '✅ SIM' : '❌ NÃO');
      console.log('   asaasCustomerId:', r.asaasCustomerId || 'NULL');
      console.log('');
    }
  }

  console.log('=== ANÁLISE ===\n');

  if (isMenor) {
    const responsavelFinanceiro = aluno.responsaveis.find(
      (ar) => ar.responsavel.financeiro,
    )?.responsavel;

    if (!responsavelFinanceiro) {
      console.log('❌ PROBLEMA: Aluno menor sem responsável financeiro marcado');
    } else if (!responsavelFinanceiro.cpf || !responsavelFinanceiro.email) {
      console.log('❌ PROBLEMA: Responsável financeiro sem CPF ou email');
    } else if (!responsavelFinanceiro.asaasCustomerId) {
      console.log('❌ PROBLEMA: Customer não foi criado no Asaas para o responsável');
      console.log('   Motivo possível: syncAlunoWithAsaas falhou ou não foi executado');
    } else {
      console.log('✅ OK: Customer criado corretamente no responsável');
    }
  } else {
    if (!aluno.cpf || !aluno.email) {
      console.log('❌ PROBLEMA: Aluno maior sem CPF ou email');
    } else if (!aluno.asaasCustomerId) {
      console.log('❌ PROBLEMA: Customer não foi criado no Asaas para o aluno');
      console.log('   Motivo possível: syncAlunoWithAsaas falhou ou não foi executado');
    } else {
      console.log('✅ OK: Customer criado corretamente no aluno');
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
