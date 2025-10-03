/**
 * API Route: Confirmar pagamento em dinheiro
 *
 * POST /api/asaas/payments/[id]/confirm-cash
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import { confirmCashPayment, isAsaasEnabled, AsaasEnvError } from '@alusa/lib/asaas';

/**
 * Schema de confirmação
 */
const confirmSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().positive().optional(),
  notifyCustomer: z.boolean().optional(),
});

/**
 * POST /api/asaas/payments/[id]/confirm-cash
 * Confirma pagamento em dinheiro
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const body = await req.json();
    const { paymentDate, value, notifyCustomer } = confirmSchema.parse(body);

    console.log('[API POST /asaas/payments/:id/confirm-cash]', {
      paymentId: id,
      paymentDate,
      value,
      notifyCustomer,
    });

    const payment = await confirmCashPayment(id, paymentDate, value);

    // Atualizar status da cobrança no banco
    const cobranca = await prisma.cobranca.findFirst({
      where: { asaasPaymentId: id },
    });

    if (cobranca) {
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: { status: 'PAGO' },
      });

      // Criar registro de pagamento
      await prisma.pagamento.create({
        data: {
          cobrancaId: cobranca.id,
          dataPagamento: new Date(paymentDate),
          formaPagamento: 'DINHEIRO',
          valorPago: value || cobranca.valor,
          status: 'CONFIRMADO',
          asaasPaymentId: id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('[API POST /asaas/payments/:id/confirm-cash] Erro:', error);

    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao confirmar pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
