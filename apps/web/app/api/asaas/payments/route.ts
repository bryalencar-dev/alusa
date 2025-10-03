/**
 * API Route: Pagamentos no Asaas
 *
 * GET  /api/asaas/payments       - Listar pagamentos
 * POST /api/asaas/payments       - Criar cobrança avulsa
 *
 * Fluxo POST:
 * 1. Recebe dados da cobrança (cobrancaId ou dados customizados)
 * 2. Cria payment no Asaas
 * 3. Persiste asaasPaymentId na Cobranca
 * 4. Retorna payment criado
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import {
  createPayment,
  listPayments,
  isAsaasEnabled,
  AsaasEnvError,
  type CreatePaymentInput,
} from '@alusa/lib/asaas';

/**
 * Schema de criação de payment
 */
const createPaymentSchema = z
  .object({
    cobrancaId: z.string().optional(),
    customData: z
      .object({
        customer: z.string().min(1, 'Customer ID é obrigatório'),
        billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED']),
        value: z.number().positive('Valor deve ser maior que zero'),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
        description: z.string().optional(),
        externalReference: z.string().optional(),
        installmentCount: z.number().int().positive().optional(),
        installmentValue: z.number().positive().optional(),
        discount: z
          .object({
            value: z.number().positive().optional(),
            dueDateLimitDays: z.number().int().positive().optional(),
          })
          .optional(),
        fine: z
          .object({
            value: z.number().positive().optional(),
          })
          .optional(),
        interest: z
          .object({
            value: z.number().positive().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine((data) => data.cobrancaId || data.customData, {
    message: 'É necessário fornecer cobrancaId ou customData',
  });

/**
 * Schema de listagem
 */
const listPaymentsSchema = z.object({
  customer: z.string().optional(),
  status: z.string().optional(),
  billingType: z.string().optional(),
  offset: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * GET /api/asaas/payments
 * Lista pagamentos filtrados
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const params = listPaymentsSchema.parse({
      customer: searchParams.get('customer') || undefined,
      status: searchParams.get('status') || undefined,
      billingType: searchParams.get('billingType') || undefined,
      offset: searchParams.get('offset') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    console.log('[API GET /asaas/payments]', { params });

    const result = await listPayments({
      customer: params.customer,
      // @ts-expect-error - Status vem como string da query
      status: params.status,
      // @ts-expect-error - BillingType vem como string da query
      billingType: params.billingType,
      offset: params.offset ? parseInt(params.offset) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[API GET /asaas/payments] Erro:', error);

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
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao listar pagamentos',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/asaas/payments
 * Cria cobrança avulsa no Asaas
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const body = await req.json();
    const { cobrancaId, customData } = createPaymentSchema.parse(body);

    let paymentData: CreatePaymentInput;

    if (customData) {
      // Usar dados customizados
      paymentData = customData;
    } else if (cobrancaId) {
      // Buscar dados da cobrança
      const cobranca = await prisma.cobranca.findUnique({
        where: { id: cobrancaId },
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

      // Verificar se já possui payment no Asaas
      if (cobranca.asaasPaymentId) {
        return NextResponse.json(
          {
            error: 'Cobrança já possui pagamento no Asaas',
            paymentId: cobranca.asaasPaymentId,
          },
          { status: 409 },
        );
      }

      // Verificar se aluno tem customer
      if (!cobranca.matricula.aluno.asaasCustomerId) {
        return NextResponse.json(
          {
            error: 'Aluno não possui customer no Asaas',
            message: 'Crie o customer antes de gerar cobrança',
          },
          { status: 400 },
        );
      }

      paymentData = {
        customer: cobranca.matricula.aluno.asaasCustomerId,
        billingType: cobranca.formaPagamento as 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED',
        value: Number(cobranca.valor),
        dueDate: cobranca.vencimento.toISOString().split('T')[0],
        description: `Mensalidade - ${cobranca.competenciaInicio.toLocaleDateString('pt-BR')}`,
        externalReference: cobranca.id,
      };
    } else {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    console.log('[API POST /asaas/payments]', { paymentData });

    // Criar payment no Asaas
    const payment = await createPayment(paymentData);

    // Atualizar banco de dados
    if (cobrancaId) {
      await prisma.cobranca.update({
        where: { id: cobrancaId },
        data: { asaasPaymentId: payment.id },
      });
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('[API POST /asaas/payments] Erro:', error);

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
        error: 'Erro ao criar pagamento',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
