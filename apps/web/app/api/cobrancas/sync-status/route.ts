import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import { getAsaasClientForConta } from '@alusa/lib';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cobrancas/sync-status
 * Sincroniza status de uma cobrança com o Asaas manualmente
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as { user?: { id?: string; contaId?: string; role?: string } })?.user;

    if (!user?.id || !user?.contaId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { cobrancaId } = await req.json();

    if (!cobrancaId) {
      return NextResponse.json({ error: 'cobrancaId é obrigatório' }, { status: 400 });
    }

    // Buscar cobrança
    const cobranca = await prisma.cobranca.findFirst({
      where: {
        id: cobrancaId,
        matricula: {
          aluno: {
            contaId: user.contaId,
          },
        },
      },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    if (!cobranca.asaasPaymentId) {
      return NextResponse.json(
        { error: 'Cobrança não tem asaasPaymentId associado' },
        { status: 400 },
      );
    }

    // Cliente Asaas
    const client = await getAsaasClientForConta(user.contaId);

    // Consultar pagamento no Asaas
    const paymentResponse = await client.get(`/payments/${cobranca.asaasPaymentId}`);
    const payment = paymentResponse.data;

    console.log('[Sync Status] Payment data from Asaas:', {
      id: payment.id,
      status: payment.status,
      value: payment.value,
      paymentDate: payment.paymentDate,
    });

    // Mapear status Asaas para interno
    const statusMap: Record<
      string,
      'PENDENTE' | 'PROCESSANDO' | 'PAGO' | 'ATRASADO' | 'CANCELADO' | 'ESTORNADO'
    > = {
      PENDING: 'PENDENTE',
      RECEIVED: 'PAGO',
      CONFIRMED: 'PAGO',
      OVERDUE: 'ATRASADO',
      REFUNDED: 'ESTORNADO',
      RECEIVED_IN_CASH: 'PAGO',
      REFUND_REQUESTED: 'ESTORNADO',
    };

    const novoStatus = statusMap[payment.status] || 'PENDENTE';

    // Atualizar status da cobrança
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: {
        status: novoStatus,
        ...(payment.paymentDate && { dataPagamento: new Date(payment.paymentDate) }),
      },
    });

    // Se pagamento confirmado
    if (payment.status === 'RECEIVED' || payment.status === 'CONFIRMED') {
      // Criar/atualizar registro de pagamento
      await prisma.pagamento.upsert({
        where: { asaasPaymentId: payment.id },
        update: {
          dataPagamento: new Date(payment.paymentDate || payment.confirmedDate || new Date()),
          valorPago: payment.value || cobranca.valor,
          status: 'CONFIRMADO',
        },
        create: {
          cobrancaId: cobranca.id,
          dataPagamento: new Date(payment.paymentDate || payment.confirmedDate || new Date()),
          formaPagamento: cobranca.formaPagamento,
          valorPago: payment.value || cobranca.valor,
          status: 'CONFIRMADO',
          asaasPaymentId: payment.id,
        },
      });

      // Atualizar status da matrícula se for taxa
      if (cobranca.tipo === 'TAXA_MATRICULA') {
        await prisma.matricula.update({
          where: { id: cobranca.matriculaId },
          data: {
            status: 'ATIVA',
            taxaStatus: 'PAGO',
          },
        });
      }

      console.log('[Sync Status] Pagamento confirmado e matrícula ativada');
    }

    return NextResponse.json({
      success: true,
      cobranca: {
        id: cobrancaAtualizada.id,
        statusAnterior: cobranca.status,
        statusNovo: cobrancaAtualizada.status,
      },
      asaas: {
        status: payment.status,
        value: payment.value,
        paymentDate: payment.paymentDate,
      },
    });
  } catch (error) {
    console.error('[Sync Status] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar status', details: (error as Error).message },
      { status: 500 },
    );
  }
}
