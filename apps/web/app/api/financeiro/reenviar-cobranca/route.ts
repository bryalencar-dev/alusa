/**
 * API Route: Reenviar Cobrança
 *
 * POST /api/financeiro/reenviar-cobranca
 *
 * Reenvia notificação de cobrança via Email, SMS ou WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { reenviarCobranca, registrarLogFinanceiro } from '@alusa/lib/asaas';
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
    const tipo = body.tipo as 'EMAIL' | 'SMS' | 'WHATSAPP';

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 },
      );
    }

    if (!tipo || !['EMAIL', 'SMS', 'WHATSAPP'].includes(tipo)) {
      return NextResponse.json(
        { success: false, message: 'Tipo deve ser EMAIL, SMS ou WHATSAPP' },
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

    // Verificar permissão
    const contaId = cobranca.matricula?.aluno?.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para reenviar esta cobrança' },
        { status: 403 },
      );
    }

    // Reenviar no Asaas
    const result = await reenviarCobranca({
      paymentId: cobranca.asaasPaymentId,
      tipo,
      contaId,
    });

    // Registrar log se sucesso
    if (result.success) {
      await registrarLogFinanceiro({
        contaId,
        usuarioId: session.user.id,
        cobrancaId: paymentId,
        acao: 'REENVIAR',
        detalhes: {
          tipo,
          asaasPaymentId: cobranca.asaasPaymentId,
        },
      });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[API] Erro ao reenviar cobrança:', error);

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
        message: 'Erro interno ao reenviar cobrança',
      },
      { status: 500 },
    );
  }
}
