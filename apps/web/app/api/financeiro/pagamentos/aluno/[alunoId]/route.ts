import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/financeiro/pagamentos/aluno/[alunoId]
 * Retorna dados do aluno e seu histórico completo de pagamentos
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { alunoId: string } }
) {
  try {
    const { alunoId } = params;

    if (!alunoId) {
      return NextResponse.json(
        { success: false, error: { message: 'ID do aluno é obrigatório' } },
        { status: 400 }
      );
    }

    // Buscar dados do aluno
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cpf: true,
        foto: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { success: false, error: { message: 'Aluno não encontrado' } },
        { status: 404 }
      );
    }

    // Buscar todos os pagamentos do aluno através das matrículas
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        cobranca: {
          matricula: {
            alunoId,
          },
        },
      },
      include: {
        cobranca: {
          select: {
            id: true,
            tipo: true,
            status: true,
            valor: true,
            vencimento: true,
            descricao: true,
          },
        },
      },
      orderBy: {
        dataPagamento: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        aluno,
        pagamentos,
      },
    });
  } catch (error) {
    console.error('[GET /api/financeiro/pagamentos/aluno/[alunoId]]', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Erro ao buscar dados',
        },
      },
      { status: 500 }
    );
  }
}
