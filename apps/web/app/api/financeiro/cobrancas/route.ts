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

export async function GET(req: NextRequest) {
  try {
    const session = await safeGetServerSession();
    type SessUser = { id?: string; contaId?: string; role?: string };
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
    const status = url.searchParams.getAll('status');
    const tipo = url.searchParams.getAll('tipo');
    const search = url.searchParams.get('q')?.trim();

    const where: Record<string, unknown> = { matricula: { aluno: { contaId: user.contaId } } };
    if (status.length) where.status = { in: status };
    if (tipo.length) where.tipo = { in: tipo };
    if (search) {
      where.OR = [
        { matricula: { aluno: { nome: { contains: search, mode: 'insensitive' } } } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, cobrancas] = await Promise.all([
      prisma.cobranca.count({ where }),
      prisma.cobranca.findMany({
        where,
        orderBy: { vencimento: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          matricula: {
            select: { aluno: { select: { nome: true, id: true } }, id: true },
          },
        },
      }),
    ]);

    const now = Date.now();
    const items = cobrancas.map((c) => {
      const venc = c.vencimento.getTime();
      const atrasado = c.status === 'PENDENTE' && venc < now;
      return {
        id: c.id,
        tipo: c.tipo,
        formaPagamento: c.tipo, // Mesmo valor, para compatibilidade com CobrancaActionsMenu
        status: c.status,
        valor: Number(c.valor),
        vencimento: c.vencimento.toISOString(),
        aluno: { id: c.matricula.aluno.id, nome: c.matricula.aluno.nome },
        matriculaId: c.matricula.id,
        asaasPaymentId: c.asaasPaymentId,
        atrasado,
      };
    });

    return NextResponse.json(
      {
        data: items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    console.error('[API Financeiro Cobrancas] Erro', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
