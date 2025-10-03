/**
 * API Route: Operações em Subscription específica
 *
 * GET    /api/asaas/subscriptions/[id]  - Buscar assinatura
 * PATCH  /api/asaas/subscriptions/[id]  - Atualizar assinatura
 * DELETE /api/asaas/subscriptions/[id]  - Cancelar assinatura
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import {
  getSubscription,
  updateSubscription,
  deleteSubscription,
  isAsaasEnabled,
  AsaasEnvError,
} from '@alusa/lib/asaas';

/**
 * Schema de atualização
 */
const updateSchema = z.object({
  value: z.number().positive().optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  description: z.string().optional(),
  externalReference: z.string().optional(),
  discount: z
    .object({
      value: z.number().positive().optional(),
      dueDateLimitDays: z.number().int().positive().optional(),
    })
    .optional(),
});

/**
 * GET /api/asaas/subscriptions/[id]
 * Busca assinatura no Asaas
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    console.log('[API GET /asaas/subscriptions/:id]', { subscriptionId: id });

    const subscription = await getSubscription(id);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('[API GET /asaas/subscriptions/:id] Erro:', error);

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
        error: 'Erro ao buscar assinatura',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/asaas/subscriptions/[id]
 * Atualiza assinatura no Asaas
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    console.log('[API PATCH /asaas/subscriptions/:id]', { subscriptionId: id, data });

    const subscription = await updateSubscription(id, data);

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('[API PATCH /asaas/subscriptions/:id] Erro:', error);

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
        error: 'Erro ao atualizar assinatura',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/asaas/subscriptions/[id]
 * Cancela assinatura no Asaas e atualiza matrícula
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    console.log('[API DELETE /asaas/subscriptions/:id]', { subscriptionId: id });

    // Buscar matrícula vinculada
    const matricula = await prisma.matricula.findFirst({
      where: { asaasSubscriptionId: id },
    });

    if (!matricula) {
      console.warn(
        `[API DELETE /asaas/subscriptions/:id] Matrícula não encontrada para subscription ${id}`,
      );
    }

    // Deletar subscription no Asaas
    await deleteSubscription(id);

    // Atualizar status da matrícula
    if (matricula) {
      await prisma.matricula.update({
        where: { id: matricula.id },
        data: {
          status: 'CANCELADA',
          asaasSubscriptionId: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Assinatura cancelada com sucesso',
    });
  } catch (error) {
    console.error('[API DELETE /asaas/subscriptions/:id] Erro:', error);

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
        error: 'Erro ao cancelar assinatura',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
