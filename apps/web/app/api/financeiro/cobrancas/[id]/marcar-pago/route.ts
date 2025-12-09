import { NextRequest, NextResponse } from 'next/server';
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

/**
 * POST /api/financeiro/cobrancas/[id]/marcar-pago
 * Marca uma cobrança como paga manualmente (pagamento em DINHEIRO)
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    type SessUser = { id?: string; contaId?: string; role?: string };
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const { id } = await params;

    // Buscar cobrança
    const cobranca = await prisma.cobranca.findFirst({
      where: { id, matricula: { aluno: { contaId: user.contaId } } },
      include: { matricula: true },
    });

    if (!cobranca) return err(404, 'COBRANCA_NAO_ENCONTRADA', 'Cobrança não encontrada');

    if (cobranca.status === 'PAGO') {
      return err(400, 'JA_PAGO', 'Esta cobrança já está paga');
    }

    // Atualizar cobrança para PAGO
    await prisma.cobranca.update({
      where: { id },
      data: {
        status: 'PAGO',
        formaPagamento: 'INDEFINIDO', // Usar INDEFINIDO para pagamentos manuais
        dataPagamento: new Date(),
      },
    });

    // Criar registro de pagamento
    await prisma.pagamento.create({
      data: {
        cobrancaId: id,
        valorPago: cobranca.valor,
        dataPagamento: new Date(),
        formaPagamento: 'DINHEIRO',
        status: 'CONFIRMADO',
      },
    });

    return NextResponse.json(
      { success: true, message: 'Cobrança marcada como paga' },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    console.error('[API Marcar Pago] Erro', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
