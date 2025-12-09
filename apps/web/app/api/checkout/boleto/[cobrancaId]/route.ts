/**
 * API Route: Dados de Checkout Boleto
 *
 * GET /api/checkout/boleto/[cobrancaId]
 *
 * Retorna dados da cobrança e bankSlipUrl para download do boleto
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/prisma';
import { getAvulsaPaymentData } from '@alusa/lib/asaas';

export async function GET(
  _request: NextRequest,
  context: { params: { cobrancaId: string } },
): Promise<NextResponse> {
  try {
    const { cobrancaId } = context.params;

    if (!cobrancaId || typeof cobrancaId !== 'string') {
      return NextResponse.json({ error: 'cobrancaId inválido' }, { status: 400 });
    }

    // 1. Buscar cobrança
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    if (!cobranca.asaasPaymentId) {
      return NextResponse.json({ error: 'Cobrança não possui payment no Asaas' }, { status: 400 });
    }

    // 2. Buscar dados do payment no Asaas
    const paymentData = await getAvulsaPaymentData(cobranca.asaasPaymentId);

    // 3. Montar resposta
    return NextResponse.json({
      cobranca: {
        id: cobranca.id,
        valor: Number(cobranca.valor),
        vencimento: cobranca.vencimento.toISOString(),
        status: cobranca.status,
        descricao: cobranca.descricao || 'Taxa de matrícula',
      },
      payment: {
        id: paymentData.paymentId,
        status: paymentData.status,
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        nossoNumero: paymentData.rawPayment.nossoNumero,
      },
      matricula: {
        id: cobranca.matricula.id,
        aluno: {
          nome: cobranca.matricula.aluno.nome,
        },
      },
    });
  } catch (error) {
    console.error('[API GET /checkout/boleto/:id] Erro:', error);

    return NextResponse.json(
      {
        error: 'Erro ao carregar dados do checkout',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
