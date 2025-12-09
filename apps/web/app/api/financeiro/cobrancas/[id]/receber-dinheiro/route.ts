import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import { confirmCashPayment, getCurrentBrasiliaDate } from '@alusa/lib/asaas';

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

/**
 * POST /api/financeiro/cobrancas/[id]/receber-dinheiro
 * 
 * Confirma recebimento de cobrança em dinheiro
 * Sincroniza com Asaas usando data atual
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    type SessUser = { id?: string; contaId?: string; role?: string };
    const user = (session as { user?: SessUser } | null)?.user;
    
    if (!user?.id || !user?.contaId) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }
    
    if (!user.role || !allowedRoles.has(user.role.toUpperCase())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = await params;
    const cobranca = await prisma.cobranca.findFirst({
      where: { id, matricula: { aluno: { contaId: user.contaId } } },
      include: {
        matricula: {
          select: {
            id: true,
            aluno: {
              select: {
                contaId: true,
              },
            },
          },
        },
      },
    });
    
    if (!cobranca || !cobranca.asaasPaymentId) {
      return NextResponse.json(
        { error: 'Cobrança não encontrada ou sem integração Asaas.' },
        { status: 404 },
      );
    }

    // ✅ Obter data atual no timezone de Brasília (timezone-safe)
    const brasiliaDate = getCurrentBrasiliaDate();
    const paymentDateStr = brasiliaDate.dateStr;
    const paymentDateObj = brasiliaDate.dateObj;

    console.log('[Receber Dinheiro] Confirmando pagamento:', {
      cobrancaId: id,
      asaasPaymentId: cobranca.asaasPaymentId,
      paymentDateStr,
      paymentDateObj,
      valor: Number(cobranca.valor),
      brasiliaDateComponents: { year: brasiliaDate.year, month: brasiliaDate.month, day: brasiliaDate.day },
    });

    // ✅ Usar data obtida no timezone de Brasília (timezone-safe)
    await confirmCashPayment(
      cobranca.asaasPaymentId,
      paymentDateStr,
      Number(cobranca.valor),
      { contaId: user.contaId }
    );

    console.log('[Receber Dinheiro] Pagamento confirmado no Asaas');

    // ✅ Atualizar cobrança local com data de pagamento
    await prisma.cobranca.update({ 
      where: { id }, 
      data: { 
        status: 'PAGO',
        dataPagamento: paymentDateObj, // ← Usar Date safe para banco
      } 
    });

    // ✅ Registrar log de auditoria
    await prisma.logFinanceiro.create({
      data: {
        contaId: user.contaId,
        metadata: {
          cobrancaId: id,
          asaasPaymentId: cobranca.asaasPaymentId,
          paymentDateStr,
          paymentDateObj: paymentDateObj.toISOString(),
          valor: Number(cobranca.valor),
          confirmedBy: user.id,
          confirmedByRole: user.role,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    console.log('[Receber Dinheiro] Processo concluído com sucesso');

    return NextResponse.json({ 
      success: true,
      message: 'Pagamento em dinheiro confirmado com sucesso',
      data: {
        cobrancaId: id,
        paymentDateStr,
        dataPagamento: paymentDateObj.toISOString(),
      }
    });
  } catch (e) {
    const error = e as Error;
    console.error('[Receber Dinheiro] Erro ao confirmar pagamento:', error);
    
    return NextResponse.json({ 
      error: 'Erro ao confirmar pagamento em dinheiro',
      message: error.message,
      details: error.stack,
    }, { status: 500 });
  }
}
