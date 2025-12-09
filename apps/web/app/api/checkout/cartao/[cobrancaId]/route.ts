/**
 * API Route: Dados de Checkout Cartão
 *
 * GET /api/checkout/cartao/[cobrancaId]
 *
 * Retorna dados da cobrança e invoiceUrl para redirecionamento
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

    // 2. Verificar billing type
    console.log('[CHECKOUT CARTÃO] Cobrança encontrada:', {
      id: cobranca.id,
      formaPagamento: cobranca.formaPagamento,
      asaasPaymentId: cobranca.asaasPaymentId,
    });

    // 3. Buscar dados do payment no Asaas
    let paymentData;
    try {
      paymentData = await getAvulsaPaymentData(cobranca.asaasPaymentId, cobranca.contaId ?? undefined);
    } catch (paymentError) {
      console.error('[CHECKOUT CARTÃO] Erro ao buscar payment no Asaas:', paymentError);
      return NextResponse.json(
        { 
          error: 'Erro ao buscar payment no Asaas',
          details: paymentError instanceof Error ? paymentError.message : 'Erro desconhecido',
        },
        { status: 500 },
      );
    }

    console.log('[CHECKOUT CARTÃO] Payment data:', {
      paymentId: paymentData.paymentId,
      billingType: paymentData.billingType,
      status: paymentData.status,
      hasInvoiceUrl: Boolean(paymentData.invoiceUrl),
    });

    if (!paymentData.invoiceUrl) {
      return NextResponse.json({ 
        error: 'URL de pagamento não disponível',
        details: `Billing type: ${paymentData.billingType}, Status: ${paymentData.status}`,
      }, { status: 400 });
    }

    // 3. Montar resposta
    return NextResponse.json({
      cobranca: {
        id: cobranca.id,
        valor: Number(cobranca.valor),
        vencimento: cobranca.vencimento.toISOString(),
        descricao: cobranca.descricao || 'Taxa de matrícula',
      },
      payment: {
        id: paymentData.paymentId,
        invoiceUrl: paymentData.invoiceUrl,
      },
      matricula: {
        aluno: {
          nome: cobranca.matricula.aluno.nome,
        },
      },
    });
  } catch (error) {
    console.error('[API GET /checkout/cartao/:id] Erro:', error);

    return NextResponse.json(
      {
        error: 'Erro ao carregar dados do checkout',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
