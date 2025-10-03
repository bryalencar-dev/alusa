/**
 * API Route: Operações em Payment específico
 *
 * GET    /api/asaas/payments/[id]  - Buscar pagamento
 * PATCH  /api/asaas/payments/[id]  - Atualizar pagamento
 * DELETE /api/asaas/payments/[id]  - Deletar pagamento
 * POST   /api/asaas/payments/[id]/confirm-cash - Confirmar pagamento em dinheiro
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import {
  getPayment,
  updatePayment,
  deletePayment,
  isAsaasEnabled,
  AsaasEnvError,
} from '@alusa/lib/asaas';

/**
 * Schema de atualização
 */
const updateSchema = z.object({
  value: z.number().positive().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  description: z.string().optional(),
  externalReference: z.string().optional(),
});

/**
 * GET /api/asaas/payments/[id]
 * Busca pagamento no Asaas
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    console.log('[API GET /asaas/payments/:id]', { paymentId: id });

    const payment = await getPayment(id);

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('[API GET /asaas/payments/:id] Erro:', error);

    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao buscar pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/asaas/payments/[id]
 * Atualiza pagamento no Asaas
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    console.log('[API PATCH /asaas/payments/:id]', { paymentId: id, data });

    const payment = await updatePayment(id, data);

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('[API PATCH /asaas/payments/:id] Erro:', error);

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
        error: 'Erro ao atualizar pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/asaas/payments/[id]
 * Remove pagamento no Asaas
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    console.log('[API DELETE /asaas/payments/:id]', { paymentId: id });

    await deletePayment(id);

    // Limpar referência no banco
    await prisma.cobranca.updateMany({
      where: { asaasPaymentId: id },
      data: { asaasPaymentId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Pagamento deletado com sucesso',
    });
  } catch (error) {
    console.error('[API DELETE /asaas/payments/:id] Erro:', error);

    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao deletar pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
