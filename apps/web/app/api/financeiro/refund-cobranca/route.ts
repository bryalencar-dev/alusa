/**
 * API Route: Estornar Cobrança (Refund)
 *
 * POST /api/financeiro/refund-cobranca
 *
 * Estorna uma cobrança no Asaas e atualiza status local
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { refundCobranca, registrarLogFinanceiro } from '@alusa/lib/asaas';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
    }

    // Parse do body
    const body = await req.json();
    const paymentId = body.paymentId as string;
    const value = body.value as number | undefined;
    const description = body.description as string | undefined;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar cobrança local
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: paymentId },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                contaId: true,
              },
            },
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json(
        { success: false, message: 'Cobrança não encontrada' },
        { status: 404 },
      );
    }

    // Verificar se tem ID Asaas
    if (!cobranca.asaasPaymentId) {
      return NextResponse.json(
        { success: false, message: 'Esta cobrança não possui ID do Asaas' },
        { status: 400 },
      );
    }

    // Verificar se a cobrança pode ser estornada (deve estar paga)
    if (cobranca.status !== 'PAGO') {
      return NextResponse.json(
        { success: false, message: 'Apenas cobranças pagas podem ser estornadas' },
        { status: 400 },
      );
    }

    // Verificar permissão
    const contaId = cobranca.matricula?.aluno?.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para estornar esta cobrança' },
        { status: 403 },
      );
    }

    // Estornar no Asaas
    const result = await refundCobranca({
      paymentId: cobranca.asaasPaymentId,
      value,
      description,
      contaId,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Atualizar status localmente
    await prisma.cobranca.update({
      where: { id: paymentId },
      data: {
        status: 'ESTORNADO',
      },
    });

    // Registrar log de auditoria
    await registrarLogFinanceiro({
      contaId,
      usuarioId: session.user.id,
      cobrancaId: paymentId,
      acao: 'REFUND',
      detalhes: {
        asaasPaymentId: cobranca.asaasPaymentId,
        value,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cobrança estornada com sucesso',
    });
  } catch (error) {
    console.error('[API] Erro ao estornar cobrança:', error);

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
        message: 'Erro interno ao estornar cobrança',
      },
      { status: 500 },
    );
  }
}
