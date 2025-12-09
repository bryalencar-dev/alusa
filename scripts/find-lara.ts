import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const aluno = await prisma.aluno.findFirst({
    where: {
      nome: {
        contains: 'Lara',
        mode: 'insensitive',
      },
    },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!aluno) {
    console.log('❌ Aluno não encontrado');

    // Buscar responsável
    const resp = await prisma.responsavel.findFirst({
      where: {
        nome: {
          contains: 'Lara',
          mode: 'insensitive',
        },
      },
    });

    if (resp) {
      console.log('\n✅ Encontrado como RESPONSÁVEL:');
      console.log('Nome:', resp.nome);
      console.log('CPF:', resp.cpf);
      console.log('Email:', resp.email);
      console.log('Financeiro:', resp.financeiro);
      console.log('asaasCustomerId:', resp.asaasCustomerId || 'NULL');
    }

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
      console.log('   CPF válido:', !!responsavelFinanceiro.cpf);
      console.log('   Email válido:', !!responsavelFinanceiro.email);
    } else if (!responsavelFinanceiro.asaasCustomerId) {
      console.log('❌ PROBLEMA: Customer não foi criado no Asaas para o responsável');
      console.log('   → A função syncAlunoWithAsaas() falhou ou não foi executada');
      console.log('   → Verificar logs do servidor para erros');
    } else {
      console.log('✅ OK: Customer criado corretamente no responsável');
    }
  } else {
    if (!aluno.cpf || !aluno.email) {
      console.log('❌ PROBLEMA: Aluno maior sem CPF ou email');
    } else if (!aluno.asaasCustomerId) {
      console.log('❌ PROBLEMA: Customer não foi criado no Asaas para o aluno');
      console.log('   → A função syncAlunoWithAsaas() falhou ou não foi executada');
    } else {
      console.log('✅ OK: Customer criado corretamente no aluno');
    }
  }

  await prisma.$disconnect();
}

check().catch(console.error);
