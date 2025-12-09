/**
 * API Route: Pausar Assinatura
 *
 * DELETE /api/financeiro/pausar-assinatura
 *
 * Pausa (inativa) uma assinatura no Asaas usando PUT com status: INACTIVE
 * - A assinatura para de gerar novas cobranças
 * - Cobranças já emitidas permanecem ativas
 * - Pode ser reativada posteriormente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { pauseAssinatura, registrarLogFinanceiro } from '@alusa/lib/asaas';
import { z } from 'zod';

export async function DELETE(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
    }

    // Parse do body
    const body = await req.json();
    const subscriptionId = body.subscriptionId as string;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, message: 'ID da assinatura é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar matrícula com a assinatura
    const matricula = await prisma.matricula.findFirst({
      where: { asaasSubscriptionId: subscriptionId },
      include: {
        aluno: {
          select: {
            contaId: true,
          },
        },
      },
    });

    if (!matricula) {
      return NextResponse.json(
        { success: false, message: 'Assinatura não encontrada' },
        { status: 404 },
      );
    }

    // Verificar permissão
    const contaId = matricula.aluno.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para pausar esta assinatura' },
        { status: 403 },
      );
    }

    // Pausar no Asaas
    const result = await pauseAssinatura({
      subscriptionId,
      contaId,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Atualizar status da matrícula localmente para PAUSADA (não CANCELADA!)
    await prisma.matricula.update({
      where: { id: matricula.id },
      data: {
        status: 'PAUSADA',
        // dataFimContrato permanece inalterado ao pausar
      },
    });

    // Registrar log de auditoria
    await registrarLogFinanceiro({
      contaId,
      usuarioId: session.user.id,
      acao: 'PAUSAR',
      detalhes: {
        subscriptionId,
        matriculaId: matricula.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assinatura pausada com sucesso. Novas cobranças não serão geradas até a reativação.',
    });
  } catch (error) {
    console.error('[API] Erro ao pausar assinatura:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao pausar assinatura',
      },
      { status: 500 },
    );
  }
}
