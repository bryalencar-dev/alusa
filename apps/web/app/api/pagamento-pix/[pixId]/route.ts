import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAsaasClientForConta } from '@alusa/lib';

export async function GET(
  _request: NextRequest,
  { params }: { params: { pixId: string } },
): Promise<NextResponse> {
  try {
    const asaasPaymentId = params.pixId;

    // Buscar cobrança no banco
    const cobranca = await prisma.cobranca.findFirst({
      where: { asaasPaymentId },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    const contaId = cobranca.matricula.aluno.contaId;

    // Cliente Asaas
    const client = await getAsaasClientForConta(contaId);

    // Buscar status atualizado no Asaas
    const paymentResponse = await client.get(`/payments/${asaasPaymentId}`);
    const asaasStatus = paymentResponse.data.status;

    // Mapear status Asaas para nosso enum
    let status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO' = 'PENDENTE';

    if (asaasStatus === 'RECEIVED' || asaasStatus === 'CONFIRMED') {
      status = 'PAGO';
    } else if (asaasStatus === 'OVERDUE') {
      status = 'VENCIDO';
    } else if (asaasStatus === 'REFUNDED' || asaasStatus === 'REFUND_REQUESTED') {
      status = 'CANCELADO';
    }

    // Atualizar status no banco se mudou
    if (status === 'PAGO' && cobranca.status !== 'PAGO') {
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: {
          status: 'PAGO',
          dataPagamento: new Date(),
        },
      });
    }

    // Buscar dados do QR Code PIX
    const pixResponse = await client.get(`/payments/${asaasPaymentId}/pixQrCode`);

    return NextResponse.json({
      cobrancaId: cobranca.id,
      matriculaId: cobranca.matriculaId,
      qrCode: pixResponse.data.encodedImage,
      payload: pixResponse.data.payload,
      valor: Number(cobranca.valor),
      vencimento: cobranca.vencimento.toISOString(),
      status,
    });
  } catch (error) {
    console.error('[Get PIX Data] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do PIX', details: (error as Error).message },
      { status: 500 },
    );
  }
}
