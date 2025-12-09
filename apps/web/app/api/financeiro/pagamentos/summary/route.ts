import { NextRequest, NextResponse } from 'next/server';
import { safeGetServerSession } from '@/lib/safe-server-session';
import { prisma } from '@/src/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

function err(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

// GET /api/financeiro/pagamentos/summary
// Retorna lista de alunos com agregação de pagamentos
export async function GET(req: NextRequest) {
  try {
    const session = await safeGetServerSession();
    type SessUser = { id?: string; contaId?: string; role?: string };
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const url = new URL(req.url);
    const search = url.searchParams.get('q')?.trim();
    const statusFilters = url.searchParams.getAll('status');

    // Buscar todos os pagamentos da conta
    const where: Record<string, unknown> = {
      cobranca: { matricula: { aluno: { contaId: user.contaId } } },
    };

    if (statusFilters.length) {
      where.status = { in: statusFilters };
    }

    if (search) {
      where.OR = [
        { cobranca: { matricula: { aluno: { nome: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const pagamentos = await prisma.pagamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        cobranca: {
          include: {
            matricula: {
              select: {
                id: true,
                aluno: {
                  select: {
                    id: true,
                    nome: true,
                    cpf: true,
                    foto: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Agrupar pagamentos por aluno
    const alunosMap = new Map<
      string,
      {
        id: string;
        nome: string;
        cpf: string | null;
        foto: string | null;
        totalPagamentos: number;
        valorTotal: number;
        ultimoPagamento: string | null;
        pagamentosCount: number;
      }
    >();

    for (const pag of pagamentos) {
      const alunoId = pag.cobranca.matricula.aluno.id;
      const aluno = pag.cobranca.matricula.aluno;

      if (!alunosMap.has(alunoId)) {
        alunosMap.set(alunoId, {
          id: alunoId,
          nome: aluno.nome,
          cpf: aluno.cpf,
          foto: aluno.foto,
          totalPagamentos: 0,
          valorTotal: 0,
          ultimoPagamento: null,
          pagamentosCount: 0,
        });
      }

      const alunoData = alunosMap.get(alunoId)!;
      alunoData.totalPagamentos += Number(pag.valorPago);
      alunoData.valorTotal += Number(pag.valorPago);
      alunoData.pagamentosCount += 1;

      if (
        !alunoData.ultimoPagamento ||
        (pag.dataPagamento && pag.dataPagamento.toISOString() > alunoData.ultimoPagamento)
      ) {
        alunoData.ultimoPagamento = pag.dataPagamento?.toISOString() || pag.createdAt.toISOString();
      }
    }

    // Converter para array e ordenar
    const alunos = Array.from(alunosMap.values()).sort((a, b) => {
      if (!a.ultimoPagamento) return 1;
      if (!b.ultimoPagamento) return -1;
      return b.ultimoPagamento.localeCompare(a.ultimoPagamento);
    });

    return NextResponse.json(
      {
        data: alunos,
        total: alunos.length,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    console.error('[API Financeiro Pagamentos Summary] Erro', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}


