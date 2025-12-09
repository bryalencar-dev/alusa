import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const contaIdParam = searchParams.get('contaId');
    const contaIdFromSession = (session?.user as { contaId?: string | null } | undefined)?.contaId;
    const contaId = (contaIdParam ?? contaIdFromSession ?? '').trim();

    if (!contaId) {
      return NextResponse.json(
        { success: false, error: 'contaId é obrigatório' },
        { status: 400 },
      );
    }

    const alunoFilter = { contaId };
    const matriculaFilter = { aluno: { contaId } };
    const cobrancaFilter = { matricula: { aluno: { contaId } } };

    // Data atual e início do mês
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);

    // Total de alunos
    const totalAlunos = await prisma.aluno.count({ where: alunoFilter });

    // Alunos ativos (com pelo menos uma matrícula ativa)
    const alunosAtivos = await prisma.aluno.count({
      where: {
        ...alunoFilter,
        matriculas: {
          some: {
            status: 'ATIVA',
          },
        },
      },
    });

    // Total de matrículas
    const totalMatriculas = await prisma.matricula.count({ where: matriculaFilter });

    // Matrículas ativas
    const matriculasAtivas = await prisma.matricula.count({
      where: {
        ...matriculaFilter,
        status: 'ATIVA',
      },
    });

    // Cobranças pendentes
    const cobrancasPendentes = await prisma.cobranca.count({
      where: {
        ...cobrancaFilter,
        status: 'PENDENTE',
      },
    });

    // Cobranças vencidas (pendentes com vencimento anterior a hoje)
    const cobrancasVencidas = await prisma.cobranca.count({
      where: {
        ...cobrancaFilter,
        status: 'PENDENTE',
        vencimento: {
          lt: now,
        },
      },
    });

    // Receita do mês atual (cobranças pagas neste mês)
    const pagamentosMes = await prisma.pagamento.findMany({
      where: {
        status: {
          in: ['CONFIRMADO', 'PAGO'],
        },
        dataPagamento: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        cobranca: cobrancaFilter,
      },
      select: {
        valorPago: true,
      },
    });

    let receitaMes = pagamentosMes.reduce((sum, p) => sum + Number(p.valorPago), 0);

    // Receita total (todos os pagamentos confirmados)
    const pagamentosTotal = await prisma.pagamento.findMany({
      where: {
        status: {
          in: ['CONFIRMADO', 'PAGO'],
        },
        cobranca: cobrancaFilter,
      },
      select: {
        valorPago: true,
      },
    });

    const receitaTotal = pagamentosTotal.reduce((sum, p) => sum + Number(p.valorPago), 0);

    // Próximos vencimentos (7 dias)
    const proximosVencimentos = await prisma.cobranca.count({
      where: {
        ...cobrancaFilter,
        status: 'PENDENTE',
        vencimento: {
          gte: now,
          lte: next7Days,
        },
      },
    });

    // Taxa de inadimplência (cobranças vencidas / total de cobranças * 100)
    const totalCobrancas = await prisma.cobranca.count({ where: cobrancaFilter });
    const taxaInadimplencia = totalCobrancas > 0 ? (cobrancasVencidas / totalCobrancas) * 100 : 0;

    // Receita semanal (últimos 7 dias)
    let receitaSemanal: number[] = [];
    const matriculasNovasSemanal: number[] = [];
    const matriculasCanceladasSemanal: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(now);
      dia.setDate(dia.getDate() - i);
      const inicioDia = new Date(dia.setHours(0, 0, 0, 0));
      const fimDia = new Date(dia.setHours(23, 59, 59, 999));

      // Receita do dia
      const pagamentosDia = await prisma.pagamento.findMany({
        where: {
          status: {
            in: ['CONFIRMADO', 'PAGO'],
          },
          dataPagamento: {
            gte: inicioDia,
            lte: fimDia,
          },
          cobranca: cobrancaFilter,
        },
        select: {
          valorPago: true,
        },
      });

      const totalDia = pagamentosDia.reduce((sum, p) => sum + Number(p.valorPago), 0);
      receitaSemanal.push(totalDia);

      // Matrículas novas do dia
      const matriculasNovasDia = await prisma.matricula.count({
        where: {
          ...matriculaFilter,
          createdAt: {
            gte: inicioDia,
            lte: fimDia,
          },
        },
      });
      matriculasNovasSemanal.push(matriculasNovasDia);

      // Matrículas canceladas do dia
      const matriculasCanceladasDia = await prisma.matricula.count({
        where: {
          ...matriculaFilter,
          status: 'CANCELADA',
          updatedAt: {
            gte: inicioDia,
            lte: fimDia,
          },
        },
      });
      matriculasCanceladasSemanal.push(matriculasCanceladasDia);
    }

    // Últimas 5 cobranças
    const ultimasCobrancasData = await prisma.cobranca.findMany({
      take: 5,
      where: cobrancaFilter,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    const ultimasCobrancas = ultimasCobrancasData.map((cobranca) => ({
      id: cobranca.id,
      aluno: cobranca.matricula.aluno.nome,
      valor: Number(cobranca.valor),
      vencimento: cobranca.vencimento.toISOString(),
      status: cobranca.status,
    }));

    // Últimos 3 alunos cadastrados (para o card de avatares)
    const alunosRecentesData = await prisma.aluno.findMany({
      take: 3,
      where: alunoFilter,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        nome: true,
        foto: true,
        createdAt: true,
      },
    });

    const alunosRecentes = alunosRecentesData.map((aluno) => ({
      id: aluno.id,
      nome: aluno.nome,
      foto: aluno.foto,
      tipo: 'Novo cadastro',
    }));

    const metrics = {
      totalAlunos,
      alunosAtivos,
      totalMatriculas,
      matriculasAtivas,
      cobrancasPendentes,
      cobrancasVencidas,
      receitaMes,
      receitaTotal,
      proximosVencimentos,
      taxaInadimplencia,
      receitaSemanal,
      matriculasNovasSemanal,
      matriculasCanceladasSemanal,
      ultimasCobrancas,
      alunosRecentes,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[GET /api/dashboard/metrics] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
