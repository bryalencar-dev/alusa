/**
 * API Route: Webhook Receiver do Asaas
 *
 * POST /api/asaas/webhooks
 *
 * Eventos suportados:
 * - PAYMENT_RECEIVED / PAYMENT_CONFIRMED: Pagamento confirmado
 * - PAYMENT_OVERDUE: Pagamento em atraso
 * - PAYMENT_DELETED: Pagamento deletado
 * - PAYMENT_RESTORED: Pagamento restaurado
 * - PAYMENT_REFUNDED: Pagamento estornado
 * - PAYMENT_RECEIVED_IN_CASH_UNDONE: Recebimento em dinheiro desfeito
 * - SUBSCRIPTION_CREATED: Assinatura criada
 * - SUBSCRIPTION_UPDATED: Assinatura atualizada
 * - SUBSCRIPTION_DELETED: Assinatura cancelada
 *
 * Fluxo:
 * 1. Valida assinatura do webhook (ASAAS_WEBHOOK_SECRET)
 * 2. Verifica idempotência (eventId já processado?)
 * 3. Salva payload em WebhookAsaas com status RECEBIDO
 * 4. Processa evento (atualiza Cobranca, Pagamento, Matricula)
 * 5. Marca webhook como PROCESSADO
 * 6. Retorna 200 OK
 *
 * Idempotência: Usa eventId único + upsert para evitar duplicatas
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/prisma';
import crypto from 'crypto';
import { loadDecryptedAsaasCredentials } from '@alusa/lib';

/**
 * Valida assinatura do webhook Asaas
 *
 * O Asaas envia um header `asaas-signature` com HMAC-SHA256
 * do payload usando o ASAAS_WEBHOOK_SECRET
 */
async function validateWebhookSignature(
  payload: string,
  signature: string | null,
  contaId: string | null,
): Promise<boolean> {
  if (!signature) {
    console.warn('[Webhook Asaas] Assinatura não fornecida');
    return false;
  }

  let secret: string | null = null;
  if (contaId) {
    const creds = await loadDecryptedAsaasCredentials(contaId);
    secret = creds?.webhookSecret ?? null;
  }
  // Fallback para variável global (legado / desenvolvimento)
  if (!secret) secret = process.env.ASAAS_WEBHOOK_SECRET || null;
  if (!secret) {
    console.error('[Webhook Asaas] Nenhum webhook secret configurado (conta ou env)');
    return false;
  }
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expectedSignature;
}

/**
 * Mapeia status de pagamento do Asaas para status interno
 */
function mapPaymentStatus(asaasStatus: string): string {
  const map: Record<string, string> = {
    PENDING: 'PENDENTE',
    RECEIVED: 'PAGO',
    CONFIRMED: 'PAGO',
    OVERDUE: 'ATRASADO',
    REFUNDED: 'ESTORNADO',
    RECEIVED_IN_CASH: 'PAGO',
    DELETED: 'CANCELADO',
  };
  return map[asaasStatus] || 'PENDENTE';
}

/**
 * Processa evento de pagamento
 */
async function processPaymentEvent(
  event: string,
  paymentId: string,
  paymentData: {
    value?: number;
    status?: string;
    dueDate?: string;
    paymentDate?: string | null;
    subscription?: string;
    customer?: string;
  },
) {
  console.log(`[Webhook Asaas] Processando pagamento ${paymentId}, evento: ${event}`);

  // Buscar cobrança pelo asaasPaymentId
  let cobranca = await prisma.cobranca.findUnique({
    where: { asaasPaymentId: paymentId },
    include: { matricula: true },
  });

  // Se não encontrou e há subscription, buscar pela subscription e atualizar o asaasPaymentId
  if (!cobranca && paymentData.subscription) {
    const matricula = await prisma.matricula.findUnique({
      where: { asaasSubscriptionId: paymentData.subscription },
      include: {
        cobrancas: {
          where: {
            asaasPaymentId: null,
            status: 'PENDENTE',
            tipo: 'MENSALIDADE',
          },
          orderBy: { vencimento: 'asc' },
          take: 1,
        },
      },
    });

    if (matricula && matricula.cobrancas.length > 0) {
      // Atualizar a primeira cobrança pendente com o paymentId
      cobranca = await prisma.cobranca.update({
        where: { id: matricula.cobrancas[0].id },
        data: { asaasPaymentId: paymentId },
        include: { matricula: true },
      });
      console.log(
        `[Webhook Asaas] Cobrança ${cobranca.id} vinculada ao payment ${paymentId} da subscription ${paymentData.subscription}`,
      );
    }
  }

  if (!cobranca) {
    console.warn(
      `[Webhook Asaas] Cobrança não encontrada para payment ${paymentId} (subscription: ${paymentData.subscription})`,
    );
    return;
  }

  // Atualizar status da cobrança
  const statusMap: Record<string, 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO' | 'ESTORNADO'> = {
    PENDENTE: 'PENDENTE',
    PAGO: 'PAGO',
    ATRASADO: 'ATRASADO',
    CANCELADO: 'CANCELADO',
    ESTORNADO: 'ESTORNADO',
  };
  const novoStatus = statusMap[mapPaymentStatus(paymentData.status || 'PENDING')] || 'PENDENTE';

  await prisma.cobranca.update({
    where: { id: cobranca.id },
    data: { status: novoStatus },
  });

  // Se pagamento confirmado, criar registro de pagamento
  if ((event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') && paymentData.paymentDate) {
    await prisma.pagamento.upsert({
      where: { asaasPaymentId: paymentId },
      update: {
        dataPagamento: new Date(paymentData.paymentDate),
        valorPago: paymentData.value || cobranca.valor,
        status: 'CONFIRMADO',
      },
      create: {
        cobrancaId: cobranca.id,
        dataPagamento: new Date(paymentData.paymentDate),
        formaPagamento: cobranca.formaPagamento,
        valorPago: paymentData.value || cobranca.valor,
        status: 'CONFIRMADO',
        asaasPaymentId: paymentId,
      },
    });

    // Ativar matrícula se estava pendente
    if (
      cobranca.matricula.status === 'PENDENTE_TAXA' ||
      cobranca.matricula.status === 'AGUARDANDO_CONFIRMACAO'
    ) {
      await prisma.matricula.update({
        where: { id: cobranca.matriculaId },
        data: { status: 'ATIVA', taxaStatus: 'PAGO' },
      });
    }
  }

  // Se pagamento em atraso
  if (event === 'PAYMENT_OVERDUE') {
    // Cobrança já foi atualizada acima para ATRASADO
    console.log(`[Webhook Asaas] Pagamento ${paymentId} marcado como atrasado`);
  }

  // Se pagamento estornado
  if (event === 'PAYMENT_REFUNDED') {
    await prisma.pagamento.updateMany({
      where: { asaasPaymentId: paymentId },
      data: { status: 'ESTORNADO' },
    });
  }
}

/**
 * Processa evento de assinatura
 */
async function processSubscriptionEvent(
  event: string,
  subscriptionId: string,
  subscriptionData: {
    status?: string;
    customer?: string;
    value?: number;
    nextDueDate?: string;
  },
) {
  console.log(`[Webhook Asaas] Processando subscription ${subscriptionId}, evento: ${event}`);

  // Buscar matrícula pelo asaasSubscriptionId
  const matricula = await prisma.matricula.findUnique({
    where: { asaasSubscriptionId: subscriptionId },
    include: { plano: true },
  });

  if (!matricula) {
    console.warn(`[Webhook Asaas] Matrícula não encontrada para subscription ${subscriptionId}`);
    return;
  }

  // Se assinatura foi criada
  if (event === 'SUBSCRIPTION_CREATED') {
    await prisma.matriculaLog.create({
      data: {
        matriculaId: matricula.id,
        action: 'ASSINATURA_CRIADA',
        actorId: 'system',
        metadata: {
          subscriptionId,
          valor: subscriptionData.value,
          status: subscriptionData.status,
        },
      },
    });
    console.log(`[Webhook Asaas] Assinatura criada para matrícula ${matricula.id}`);
  }

  // Se assinatura foi cancelada
  if (event === 'SUBSCRIPTION_DELETED') {
    await prisma.matricula.update({
      where: { id: matricula.id },
      data: { status: 'CANCELADA' },
    });

    await prisma.matriculaLog.create({
      data: {
        matriculaId: matricula.id,
        action: 'ASSINATURA_CANCELADA',
        actorId: 'system',
        metadata: {
          subscriptionId,
          motivo: 'Assinatura cancelada no Asaas',
        },
      },
    });

    console.log(`[Webhook Asaas] Matrícula ${matricula.id} cancelada (subscription deleted)`);
  }

  // Se assinatura foi atualizada
  if (event === 'SUBSCRIPTION_UPDATED') {
    if (subscriptionData.status === 'INACTIVE') {
      await prisma.matricula.update({
        where: { id: matricula.id },
        data: { status: 'CANCELADA' },
      });

      await prisma.matriculaLog.create({
        data: {
          matriculaId: matricula.id,
          action: 'ASSINATURA_INATIVADA',
          actorId: 'system',
          metadata: {
            subscriptionId,
            status: subscriptionData.status,
          },
        },
      });
    }

    console.log(
      `[Webhook Asaas] Assinatura ${subscriptionId} atualizada para status ${subscriptionData.status}`,
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let eventId: string | undefined;
  let event: string | undefined;

  try {
    // Ler payload bruto
    const rawPayload = await req.text();
    const signature = req.headers.get('asaas-signature');

    // Parse do payload (precisamos do payment/subscription id para inferir conta antes de validar assinatura)
    const payload = JSON.parse(rawPayload);
    event = payload.event;
    const { payment, subscription } = payload;

    if (!event) {
      console.error('[Webhook Asaas] Evento não fornecido', { payload });
      return NextResponse.json({ error: 'Evento não fornecido' }, { status: 400 });
    }

    // Tentar inferir contaId via payment->cobranca ou subscription->matricula
    let contaId: string | null = null;
    if (payment?.id) {
      const cobranca = await prisma.cobranca.findFirst({
        where: { asaasPaymentId: payment.id },
        select: { matriculaId: true },
      });
      if (cobranca?.matriculaId) {
        const matricula = await prisma.matricula.findUnique({
          where: { id: cobranca.matriculaId },
          select: { aluno: { select: { contaId: true } } },
        });
        contaId = matricula?.aluno?.contaId || null;
      }
    }
    if (!contaId && subscription?.id) {
      const matricula = await prisma.matricula.findFirst({
        where: { asaasSubscriptionId: subscription.id },
        select: { aluno: { select: { contaId: true } } },
      });
      if (matricula?.aluno?.contaId) contaId = matricula.aluno.contaId;
    }
    // Fallback legacy: primeira conta (apenas se não encontrado por relacionamentos)
    if (!contaId) {
      const fallback = await prisma.conta.findFirst({ select: { id: true } });
      contaId = fallback?.id || null;
    }

    // Validar assinatura só agora que temos (ou não) o contaId
    const signatureValid = await validateWebhookSignature(rawPayload, signature, contaId);
    if (!signatureValid) {
      console.error('[Webhook Asaas] Assinatura inválida', {
        hasSignature: !!signature,
        payloadLength: rawPayload.length,
        contaIdAttempt: contaId,
      });
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // Gerar eventId para logs e idempotência
    eventId = payment?.id || subscription?.id || `${event}-${Date.now()}`;

    console.log('[Webhook Asaas] Recebido', {
      eventId,
      event,
      hasPayment: !!payment,
      hasSubscription: !!subscription,
    });

    if (!contaId) {
      console.error('[Webhook Asaas] Não foi possível resolver contaId', { eventId, event });
      return NextResponse.json({ error: 'Conta não resolvida' }, { status: 400 });
    }

    // Salvar webhook no banco (idempotência por eventId)
    const webhookRecord = await prisma.webhookAsaas.upsert({
      where: { eventId },
      update: {
        evento: event,
        payload,
        status: 'RECEBIDO',
      },
      create: {
        contaId: contaId,
        evento: event,
        eventId,
        payload,
        status: 'RECEBIDO',
      },
    });

    console.log('[Webhook Asaas] Persistido', {
      eventId,
      event,
      webhookId: webhookRecord.id,
      status: 'RECEBIDO',
    });

    // Processar evento
    try {
      if (payment) {
        await processPaymentEvent(event, payment.id, payment);
      }

      if (subscription) {
        await processSubscriptionEvent(event, subscription.id, subscription);
      }

      // Marcar webhook como processado
      await prisma.webhookAsaas.update({
        where: { id: webhookRecord.id },
        data: {
          status: 'PROCESSADO',
          processadoEm: new Date(),
        },
      });

      const duration = Date.now() - startTime;
      console.log('[Webhook Asaas] Processado com sucesso', {
        eventId,
        event,
        webhookId: webhookRecord.id,
        status: 'PROCESSADO',
        duration,
      });
    } catch (processingError) {
      console.error('[Webhook Asaas] Erro ao processar', {
        eventId,
        event,
        webhookId: webhookRecord.id,
        error: processingError instanceof Error ? processingError.message : 'Erro desconhecido',
        stack: processingError instanceof Error ? processingError.stack : undefined,
      });

      // Marcar webhook como erro
      await prisma.webhookAsaas.update({
        where: { id: webhookRecord.id },
        data: { status: 'ERRO' },
      });

      // Retornar 200 para não retentar (já salvou o payload)
      return NextResponse.json({
        received: true,
        error: 'Erro ao processar, mas payload salvo',
      });
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error('[Webhook Asaas] Erro geral:', error);

    return NextResponse.json(
      {
        error: 'Erro ao processar webhook',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
