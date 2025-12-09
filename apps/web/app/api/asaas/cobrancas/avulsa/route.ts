/**
 * API Route: Criar Cobrança Avulsa no Asaas
 *
 * POST /api/asaas/cobrancas/avulsa
 *
 * Cria um payment no Asaas baseado em uma Cobranca existente.
 * Retorna dados do payment incluindo links de checkout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import { authOptions } from '@/lib/auth-options';
import {
  createAvulsaPayment,
  isAsaasEnabled,
  AsaasEnvError,
  type BillingType,
} from '@alusa/lib/asaas';

/**
 * Schema de validação
 */
const createAvulsaSchema = z.object({
  cobrancaId: z.string().min(1, 'cobrancaId é obrigatório'),
  billingType: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD'], {
    errorMap: () => ({ message: 'billingType deve ser PIX, BOLETO ou CREDIT_CARD' }),
  }),
});

/**
 * POST /api/asaas/cobrancas/avulsa
 * Cria cobrança avulsa no Asaas
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar se Asaas está habilitado
    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.contaId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 2. Validar body
    const body = await req.json();
    const { cobrancaId, billingType } = createAvulsaSchema.parse(body);

    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId },
      include: {
        matricula: {
          include: {
            aluno: { select: { contaId: true } },
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    if (cobranca.matricula.aluno.contaId !== session.user.contaId) {
      return NextResponse.json({ error: 'Conta inválida' }, { status: 403 });
    }

    const contaId = cobranca.matricula.aluno.contaId;

    console.log('[API POST /asaas/cobrancas/avulsa]', { cobrancaId, billingType, contaId });

    // 3. Criar payment no Asaas
    // Garantir que mapeamos apenas valores válidos para BillingType
    let mappedBillingType: BillingType = 'UNDEFINED';
    if (billingType === 'PIX') mappedBillingType = 'PIX';
    else if (billingType === 'BOLETO') mappedBillingType = 'BOLETO';
    else if (billingType === 'CREDIT_CARD') mappedBillingType = 'CREDIT_CARD';

    const result = await createAvulsaPayment({
      cobrancaId,
      billingType: mappedBillingType,
      contaId,
    });

    // 4. Retornar dados do payment
    return NextResponse.json({
      success: true,
      payment: {
        id: result.paymentId,
        status: result.status,
        value: result.value,
        dueDate: result.dueDate,
        billingType: result.billingType,
        invoiceUrl: result.invoiceUrl,
        bankSlipUrl: result.bankSlipUrl,
        pixQrCode: result.pixQrCode,
      },
    });
  } catch (error) {
    console.error('[API POST /asaas/cobrancas/avulsa] Erro:', error);

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
        error: 'Erro ao criar cobrança avulsa',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
