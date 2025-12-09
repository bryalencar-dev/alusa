import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import { deletePayment } from '@alusa/lib';

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
 * DELETE /api/financeiro/cobrancas/[id]
 * Exclui uma cobrança e, se tiver asaasPaymentId, também exclui no Asaas
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      include: { matricula: { include: { aluno: { include: { conta: true } } } } },
    });

    if (!cobranca) return err(404, 'COBRANCA_NAO_ENCONTRADA', 'Cobrança não encontrada');

    // Se tiver asaasPaymentId, tentar excluir no Asaas
    if (cobranca.asaasPaymentId) {
      try {
        await deletePayment(cobranca.asaasPaymentId, { contaId: user.contaId });
      } catch (asaasError) {
        console.warn('[DELETE Cobrança] Erro ao excluir no Asaas:', asaasError);
        // Continua mesmo se falhar no Asaas (pode já estar excluído)
      }
    }

    // Excluir cobrança local (cascade vai deletar pagamentos relacionados)
    await prisma.cobranca.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Cobrança excluída com sucesso' },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    console.error('[API DELETE Cobrança] Erro', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
