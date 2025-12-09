/**
 * API Route: /api/matriculas/[id]/status
 *
 * Gerencia o status da matrícula com sincronização total com Asaas
 *
 * - ATIVA → PAUSADA: suspende assinatura no Asaas (POST /subscriptions/{id}/suspend)
 * - PAUSADA → ATIVA: ativa assinatura no Asaas (POST /subscriptions/{id}/activate)
 * - ATIVA/PAUSADA → CANCELADA: cancela assinatura no Asaas (DELETE /subscriptions/{id})
 *
 * @module api/matriculas/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import { ManualSyncError, syncMatriculaStatus } from '@alusa/lib';

export const dynamic = 'force-dynamic';

/**
 * Schema de validação do body
 */
interface UpdateStatusBody {
  status: 'ATIVA' | 'PAUSADA' | 'CANCELADA';
  motivo?: string;
}

/**
 * PATCH /api/matriculas/[id]/status
 *
 * Atualiza o status da matrícula e sincroniza com Asaas
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as { user?: { id?: string; contaId?: string } })?.user;

    if (!user?.id || !user?.contaId) {
      console.warn('[MATRICULA_STATUS] Usuário não autenticado');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const matriculaId = params.id;
    const body = (await request.json()) as UpdateStatusBody;
    const { status, motivo } = body;

    if (!['ATIVA', 'PAUSADA', 'CANCELADA'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    // Encapsulamos toda a sincronização em um serviço compartilhado para manter a paridade com o Asaas.
    const result = await syncMatriculaStatus({
      prisma,
      matriculaId,
      contaId: user.contaId,
      targetStatus: status,
      actorId: user.id,
      motivo: motivo || undefined,
    });

    const wasLocalOnly = result.asaasAction === 'LOCAL_ONLY';
    const message = wasLocalOnly
      ? `Status atualizado para ${result.newStatus} (apenas localmente - assinatura não encontrada no Asaas)`
      : `Status atualizado para ${result.newStatus}`;

    return NextResponse.json({
      success: true,
      message,
      warning: wasLocalOnly ? 'A assinatura não foi encontrada no Asaas. O status foi atualizado apenas localmente.' : undefined,
      data: {
        matriculaId: result.matriculaId,
        status: result.newStatus,
        previousStatus: result.previousStatus,
        asaasAction: result.asaasAction,
        cobrancasAtualizadas: result.cobrancasAtualizadas,
        paymentSync: result.paymentSync,
        asaasResponse: result.asaasResponse ?? null,
        nextDueDate: result.nextDueDate ?? null,
      },
    });
  } catch (error) {
    if (error instanceof ManualSyncError) {
      console.error('[MATRICULA_STATUS] ManualSyncError:', {
        code: error.code,
        message: error.message,
        details: error.details,
        statusCode: error.statusCode,
      });

      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          details: error.details ?? null,
        },
        { status: error.statusCode },
      );
    }

    console.error('[MATRICULA_STATUS] Erro inesperado:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: (error as Error).message || 'Erro interno do servidor',
        details: {
          name: (error as Error).name,
          originalMessage: (error as Error).message,
        },
      },
      { status: 500 },
    );
  }
}
