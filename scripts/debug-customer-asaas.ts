/**
 * Script para diagnosticar criação de customer no Asaas
 * Verifica logs de integração e dados do responsável
 */

import { prisma } from '../packages/lib/src/prisma';

async function main() {
  console.log('🔍 Diagnóstico: Criação de Customer Asaas\n');

  // Buscar o responsável da Lara
  const responsavel = await prisma.responsavel.findFirst({
    where: {
      nome: {
        contains: 'Vera Lúcia',
      },
    },
    include: {
      alunos: {
        include: {
          aluno: true,
        },
      },
    },
  });

  if (!responsavel) {
    console.log('❌ Responsável não encontrado');
    return;
  }

  console.log('👤 Responsável:', {
    id: responsavel.id,
    nome: responsavel.nome,
    cpf: responsavel.cpf,
    email: responsavel.email,
    telefone: responsavel.telefone,
    financeiro: responsavel.financeiro,
    asaasCustomerId: responsavel.asaasCustomerId,
  });

  console.log('\n👶 Alunos vinculados:');
  for (const ar of responsavel.alunos) {
    console.log({
      id: ar.aluno.id,
      nome: ar.aluno.nome,
      dataNasc: ar.aluno.dataNasc,
      asaasCustomerId: ar.aluno.asaasCustomerId,
    });
  }

  // Buscar logs de integração do responsável
  console.log('\n📋 Logs de Integração (RESPONSAVEL):');
  const logsResponsavel = await prisma.logIntegracao.findMany({
    where: {
      entidade: 'RESPONSAVEL',
      entidadeId: responsavel.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  if (logsResponsavel.length === 0) {
    console.log('⚠️ Nenhum log de integração encontrado para o responsável');
  } else {
    for (const log of logsResponsavel) {
      console.log({
        id: log.id,
        tipoOperacao: log.tipoOperacao,
        status: log.status,
        httpStatus: log.httpStatus,
        asaasId: log.asaasId,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
      });
    }
  }

  // Buscar logs de integração dos alunos
  console.log('\n📋 Logs de Integração (ALUNOS):');
  for (const ar of responsavel.alunos) {
    const logsAluno = await prisma.logIntegracao.findMany({
      where: {
        entidade: 'ALUNO',
        entidadeId: ar.aluno.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    if (logsAluno.length > 0) {
      console.log(`\n  Aluno: ${ar.aluno.nome}`);
      for (const log of logsAluno) {
        console.log({
          tipoOperacao: log.tipoOperacao,
          status: log.status,
          httpStatus: log.httpStatus,
          asaasId: log.asaasId,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        });
      }
    }
  }

  // Verificar se há credenciais Asaas configuradas
  console.log('\n🔑 Verificando credenciais Asaas...');
  const contaId = responsavel.alunos[0]?.aluno.contaId;
  if (contaId) {
    const conta = await prisma.conta.findFirst({
      where: {
        id: contaId,
      },
      select: {
        id: true,
        nome: true,
        asaasApiKeyEncrypted: true,
      },
    });

    if (conta) {
      console.log({
        contaId: conta.id,
        nome: conta.nome,
        temApiKey: !!conta.asaasApiKeyEncrypted,
      });
    }
  }

  // Buscar todos os logs de CREATE_CUSTOMER recentes
  console.log('\n📊 Últimos logs de CREATE_CUSTOMER (todos):');
  const logsRecentes = await prisma.logIntegracao.findMany({
    where: {
      tipoOperacao: 'CREATE_CUSTOMER',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  for (const log of logsRecentes) {
    console.log({
      entidade: log.entidade,
      entidadeId: log.entidadeId.slice(0, 10) + '...',
      status: log.status,
      httpStatus: log.httpStatus,
      asaasId: log.asaasId,
      errorMessage: log.errorMessage?.slice(0, 100),
      createdAt: log.createdAt,
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
