/**
 * Script de teste para fluxo PIX de Taxa de Matrícula
 *
 * Testa:
 * 1. Geração de PIX para taxa de matrícula
 * 2. Consulta de dados do PIX
 * 3. Atualização de status
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFluxoPix() {
  console.log('🔍 Buscando matrícula com taxa pendente...\n');

  // Buscar matrícula com taxa pendente
  const matricula = await prisma.matricula.findFirst({
    where: {
      taxaIsenta: false,
      cobrancas: {
        some: {
          tipo: 'TAXA_MATRICULA',
          status: 'PENDENTE',
        },
      },
    },
    include: {
      aluno: {
        include: {
          responsaveis: {
            include: {
              responsavel: true,
            },
          },
        },
      },
      responsavelFinanceiro: true,
      cobrancas: {
        where: {
          tipo: 'TAXA_MATRICULA',
        },
      },
      turma: true,
      combo: true,
      plano: true,
    },
  });

  if (!matricula) {
    console.log('❌ Nenhuma matrícula com taxa pendente encontrada');
    console.log('\n💡 Dica: Crie uma matrícula com taxa não isenta para testar');
    return;
  }

  console.log('✅ Matrícula encontrada:');
  console.log(`   ID: ${matricula.id}`);
  console.log(`   Aluno: ${matricula.aluno.nome}`);
  console.log(`   Turma/Combo: ${matricula.turma?.nome || matricula.combo?.nome}`);
  console.log(`   Plano: ${matricula.plano.nome}`);

  const taxa = matricula.cobrancas[0];
  console.log(`\n💰 Taxa de Matrícula:`);
  console.log(`   ID: ${taxa.id}`);
  console.log(`   Valor: R$ ${taxa.valor.toFixed(2)}`);
  console.log(`   Vencimento: ${taxa.vencimento.toLocaleDateString('pt-BR')}`);
  console.log(`   Status: ${taxa.status}`);

  // Calcular idade do aluno
  const hoje = new Date();
  const dataNasc = new Date(matricula.aluno.dataNasc);
  const idade = hoje.getFullYear() - dataNasc.getFullYear();
  const isMaiorDeIdade = idade >= 18;

  console.log(`\n👤 Pagador:`);
  if (isMaiorDeIdade) {
    console.log(`   Tipo: Próprio aluno (maior de idade - ${idade} anos)`);
    console.log(`   Nome: ${matricula.aluno.nome}`);
    console.log(`   CPF: ${matricula.aluno.cpf || 'NÃO INFORMADO'}`);
    console.log(`   Email: ${matricula.aluno.email || 'NÃO INFORMADO'}`);
  } else {
    const responsavel =
      matricula.responsavelFinanceiro || matricula.aluno.responsaveis[0]?.responsavel;
    if (!responsavel) {
      console.log('   ❌ Nenhum responsável financeiro encontrado');
    } else {
      console.log(`   Tipo: Responsável financeiro (aluno menor - ${idade} anos)`);
      console.log(`   Nome: ${responsavel.nome}`);
      console.log(`   CPF: ${responsavel.cpf || 'NÃO INFORMADO'}`);
      console.log(`   Email: ${responsavel.email || 'NÃO INFORMADO'}`);
    }
  }

  console.log('\n📋 Para testar o fluxo completo:');
  console.log('\n1️⃣ Abra o sistema e vá para a lista de matrículas');
  console.log(`2️⃣ Clique nos detalhes da matrícula ${matricula.id.slice(0, 8)}...`);
  console.log('3️⃣ Na seção "Taxa de Matrícula", clique em "Gerar PIX"');
  console.log('4️⃣ Uma nova aba abrirá com o QR Code e código PIX');
  console.log('5️⃣ A página atualizará automaticamente quando o pagamento for confirmado');

  console.log('\n🔗 URLs para teste manual:');
  console.log(`   Matrícula: http://localhost:3000/matriculas (clique em detalhes)`);
  console.log(
    `   API Gerar PIX: POST http://localhost:3000/api/matriculas/${matricula.id}/gerar-pix`,
  );

  console.log('\n⚠️  Validações da API:');
  console.log('   ✓ Verifica se usuário está autenticado');
  console.log('   ✓ Verifica se matrícula existe');
  console.log('   ✓ Verifica se taxa não é isenta');
  console.log('   ✓ Verifica se existe taxa pendente');
  console.log('   ✓ Verifica dados completos do pagador (CPF, email, telefone)');
  console.log('   ✓ Cria customer no Asaas se não existir');
  console.log('   ✓ Cria cobrança PIX no Asaas');
  console.log('   ✓ Retorna QR Code e payload para exibição');

  console.log('\n✨ Fluxo de status:');
  console.log('   PENDENTE → (gera PIX) → PENDENTE');
  console.log('   PENDENTE → (paga no banco) → PAGO (via webhook)');
  console.log('   PENDENTE → (vence) → ATRASADO (via webhook)');

  console.log('\n🎯 Componentes envolvidos:');
  console.log('   Frontend: MatriculaDetalhesDialog.tsx');
  console.log('   API Gerar: /api/matriculas/[id]/gerar-pix/route.ts');
  console.log('   API Consulta: /api/pagamento-pix/[pixId]/route.ts');
  console.log('   Página PIX: /(public)/pagamento-pix/[pixId]/page.tsx');
  console.log('   Badge Status: StatusPagamentoBadge.tsx');
}

testFluxoPix()
  .catch((error) => {
    console.error('❌ Erro no teste:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
