import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const contaIdParam = searchParams.get('contaId');
    const periodo = searchParams.get('periodo') || '30d'; // 1d, 15d, 30d
    
    const contaIdFromSession = (session?.user as { contaId?: string | null } | undefined)?.contaId;
    const contaId = (contaIdParam ?? contaIdFromSession ?? '').trim();

    if (!contaId) {
      return NextResponse.json(
        { success: false, error: 'contaId é obrigatório' },
        { status: 400 },
      );
    }

    const cobrancaFilter = { matricula: { aluno: { contaId } } };
    const now = new Date();

    // Define quantidade de dias baseado no período
    const diasMap: Record<string, number> = {
      '1d': 1,
      '15d': 15,
      '30d': 30,
    };
    const dias = diasMap[periodo] || 30;

    // Início do mês atual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Busca cobranças pagas no mês (status PAGO)
    // A data de pagamento pode estar em `dataPagamento` ou `pagoEm`
    const cobrancasPagasMes = await prisma.cobranca.findMany({
      where: {
        ...cobrancaFilter,
        status: 'PAGO',
        OR: [
          { dataPagamento: { gte: startOfMonth, lte: endOfMonth } },
          { pagoEm: { gte: startOfMonth, lte: endOfMonth } },
        ],
      },
      select: { 
        valor: true, 
        valorFinal: true,
        dataPagamento: true,
        pagoEm: true,
      },
    });

    // Receita = soma do valorFinal (se existir) ou valor
    const receitaMes = cobrancasPagasMes.reduce((sum, c) => {
      const valorEfetivo = c.valorFinal ? Number(c.valorFinal) : Number(c.valor);
      return sum + valorEfetivo;
    }, 0);

    // Mês anterior para calcular variação
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const cobrancasPagasMesAnterior = await prisma.cobranca.findMany({
      where: {
        ...cobrancaFilter,
        status: 'PAGO',
        OR: [
          { dataPagamento: { gte: startOfLastMonth, lte: endOfLastMonth } },
          { pagoEm: { gte: startOfLastMonth, lte: endOfLastMonth } },
        ],
      },
      select: { valor: true, valorFinal: true },
    });

    const receitaMesAnterior = cobrancasPagasMesAnterior.reduce((sum, c) => {
      const valorEfetivo = c.valorFinal ? Number(c.valorFinal) : Number(c.valor);
      return sum + valorEfetivo;
    }, 0);

    // Calcula variação percentual
    let variacaoPercentual: number | null = null;
    if (receitaMesAnterior > 0) {
      variacaoPercentual = ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100;
    } else if (receitaMes > 0) {
      variacaoPercentual = 100;
    }

    // Série de receitas por dia (para o gráfico)
    const serie: number[] = [];
    
    // Busca todas as cobranças pagas no período selecionado
    const dataInicioPeriodo = new Date(now);
    dataInicioPeriodo.setDate(dataInicioPeriodo.getDate() - (dias - 1));
    dataInicioPeriodo.setHours(0, 0, 0, 0);

    const cobrancasPeriodo = await prisma.cobranca.findMany({
      where: {
        ...cobrancaFilter,
        status: 'PAGO',
        OR: [
          { dataPagamento: { gte: dataInicioPeriodo, lte: now } },
          { pagoEm: { gte: dataInicioPeriodo, lte: now } },
        ],
      },
      select: { 
        valor: true, 
        valorFinal: true,
        dataPagamento: true,
        pagoEm: true,
      },
    });

    // Agrupa por dia
    for (let i = dias - 1; i >= 0; i--) {
      const dia = new Date(now);
      dia.setDate(dia.getDate() - i);
      const inicioDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0, 0);
      const fimDia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59, 999);

      const totalDia = cobrancasPeriodo
        .filter(c => {
          const dataPgto = c.pagoEm || c.dataPagamento;
          if (!dataPgto) return false;
          return dataPgto >= inicioDia && dataPgto <= fimDia;
        })
        .reduce((sum, c) => {
          const valorEfetivo = c.valorFinal ? Number(c.valorFinal) : Number(c.valor);
          return sum + valorEfetivo;
        }, 0);

      serie.push(totalDia);
    }

    // Série acumulada para visualização
    const serieAcumulada: number[] = [];
    let acumulado = 0;
    for (const valor of serie) {
      acumulado += valor;
      serieAcumulada.push(acumulado);
    }

    return NextResponse.json({
      success: true,
      data: {
        receitaMes,
        receitaMesAnterior,
        variacaoPercentual,
        serie,
        serieAcumulada,
        periodo,
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/receita] Erro:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
