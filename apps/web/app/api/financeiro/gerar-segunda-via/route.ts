/**
 * API Route: Gerar Segunda Via
 *
 * GET /api/financeiro/gerar-segunda-via?paymentId=xxx
 *
 * Gera segunda via (URLs de boleto, PIX, invoice)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { gerarSegundaVia, registrarLogFinanceiro } from '@alusa/lib/asaas';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

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

    // Verificar permissão
    const contaId = cobranca.matricula?.aluno?.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para acessar esta cobrança' },
        { status: 403 },
      );
    }

    // Gerar segunda via
    const result = await gerarSegundaVia({
      paymentId: cobranca.asaasPaymentId,
      contaId,
    });

    // Registrar log se sucesso
    if (result.success) {
      await registrarLogFinanceiro({
        contaId,
        usuarioId: session.user.id,
        cobrancaId: paymentId,
        acao: 'SEGUNDA_VIA',
        detalhes: {
          asaasPaymentId: cobranca.asaasPaymentId,
        },
      });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[API] Erro ao gerar segunda via:', error);

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
        message: 'Erro interno ao gerar segunda via',
      },
      { status: 500 },
    );
  }
}
