import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    type SessUser = { id?: string; contaId?: string; role?: string };
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const contaWhere = { matricula: { aluno: { contaId: user.contaId } } };

    const [totalPendentes, totalPagos, totalAtrasados, somaPendentes, somaPagos] =
      await Promise.all([
        prisma.cobranca.count({ where: { ...contaWhere, status: 'PENDENTE' } }),
        prisma.cobranca.count({ where: { ...contaWhere, status: 'PAGO' } }),
        prisma.cobranca.count({
          where: { ...contaWhere, status: 'PENDENTE', vencimento: { lt: hoje } },
        }),
        prisma.cobranca
          .aggregate({ _sum: { valor: true }, where: { ...contaWhere, status: 'PENDENTE' } })
          .then((r) => Number(r._sum.valor || 0)),
        prisma.cobranca
          .aggregate({ _sum: { valor: true }, where: { ...contaWhere, status: 'PAGO' } })
          .then((r) => Number(r._sum.valor || 0)),
      ]);

    return NextResponse.json(
      {
        data: {
          cobrancas: {
            pendentes: totalPendentes,
            pagas: totalPagos,
            atrasadas: totalAtrasados,
            valorPendentes: somaPendentes,
            valorPagos: somaPagos,
          },
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    console.error('[API Financeiro Indicadores] Erro', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
