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
import { createHmac } from 'node:crypto';
import { prisma } from '@/src/prisma';
import { loadDecryptedAsaasCredentials, mapPaymentStatus } from '@alusa/lib';
import { FormaPagamento } from '@prisma/client';

/**
 * Valida token de autenticação do webhook Asaas
 *
 * O Asaas envia um header `asaas-access-token` com o token configurado no painel
 * Alternativamente, aceita `asaas-signature` para retrocompatibilidade
 */
async function validateWebhookSignature(
  _payload: string,
  signature: string | null,
  contaId: string | null,
): Promise<boolean> {
  // Se não há assinatura/token, aceita em modo desenvolvimento
  if (!signature) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Webhook Asaas] ⚠️ Assinatura não fornecida (aceitando em dev)');
      return true;
    }
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

  // Se não há secret configurado, aceita em modo desenvolvimento
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Webhook Asaas] ⚠️ Secret não configurado (aceitando em dev)');
      return true;
    }
    console.error('[Webhook Asaas] Nenhum webhook secret configurado (conta ou env)');
    return false;
  }

  // Validação simples: token deve ser igual ao secret configurado
  if (signature === secret) {
    return true;
  }

  const expectedHmac = createHmac('sha256', secret).update(_payload).digest('hex');
  return signature === expectedHmac;
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
    billingType?: string; // Forma de pagamento usada no Asaas (BOLETO, PIX, CREDIT_CARD, UNDEFINED)
  },
) {
  console.log(`[Webhook Asaas] Processando pagamento ${paymentId}, evento: ${event}`);

  // Buscar cobrança pelo asaasPaymentId
  let cobranca = await prisma.cobranca.findUnique({
    where: { asaasPaymentId: paymentId },
    include: {
      matricula: {
        include: {
          aluno: true,
        },
      },
    },
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
        },
      },
    });

    if (matricula && matricula.cobrancas.length > 0) {
      // Tentar encontrar cobrança pelo vencimento (se disponível no payload)
      let cobrancaParaVincular = matricula.cobrancas[0];
      
      if (paymentData.dueDate) {
        const dueDateAsaas = new Date(paymentData.dueDate);
        const cobrancaPorVencimento = matricula.cobrancas.find((c) => {
          const vencLocal = new Date(c.vencimento);
          // Comparar apenas ano, mês e dia
          return (
            vencLocal.getFullYear() === dueDateAsaas.getFullYear() &&
            vencLocal.getMonth() === dueDateAsaas.getMonth() &&
            vencLocal.getDate() === dueDateAsaas.getDate()
          );
        });
        
        if (cobrancaPorVencimento) {
          cobrancaParaVincular = cobrancaPorVencimento;
          console.log(
            `[Webhook Asaas] Cobrança encontrada por vencimento ${paymentData.dueDate}`,
          );
        }
      }

      // Atualizar a cobrança com o paymentId
      cobranca = await prisma.cobranca.update({
        where: { id: cobrancaParaVincular.id },
        data: { asaasPaymentId: paymentId },
        include: {
          matricula: {
            include: {
              aluno: true,
            },
          },
        },
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

  // Mapear billingType do Asaas para FormaPagamento
  const billingTypeMap: Record<string, FormaPagamento> = {
    BOLETO: FormaPagamento.BOLETO,
    PIX: FormaPagamento.PIX,
    CREDIT_CARD: FormaPagamento.CARTAO_CREDITO,
    UNDEFINED: FormaPagamento.INDEFINIDO,
  };
  const formaPagamentoAtualizado =
    paymentData.billingType && billingTypeMap[paymentData.billingType]
      ? billingTypeMap[paymentData.billingType]
      : cobranca.formaPagamento;

  console.log(
    `[Webhook Asaas] Atualizando cobrança ${cobranca.id}: status ${cobranca.status} → ${novoStatus}, formaPagamento ${cobranca.formaPagamento} → ${formaPagamentoAtualizado} (billingType: ${paymentData.billingType || 'N/A'})`,
  );

  await prisma.cobranca.update({
    where: { id: cobranca.id },
    data: {
      status: novoStatus,
      formaPagamento: formaPagamentoAtualizado, // Atualizar com o método real usado no Asaas
    },
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

    // Se pagamento foi com CARTÃO DE CRÉDITO, sincronizar dados do cartão
    if (paymentData.billingType === 'CREDIT_CARD' && paymentData.customer) {
      try {
        // Buscar responsável financeiro
        const responsavel = await prisma.responsavel.findFirst({
          where: {
            asaasCustomerId: paymentData.customer,
          },
          select: {
            id: true,
            asaasCreditCardToken: true,
          }
        });

        if (responsavel) {
          // Buscar dados do customer no Asaas (inclui cartão)
          const { getCustomer } = await import('@alusa/lib');
          const customer = await getCustomer(paymentData.customer, {
            contaId: cobranca.matricula.aluno.contaId
          });

          // Se customer tem cartão salvo, sincronizar
          if (customer.creditCard) {
            const brandMap: Record<string, string> = {
              VISA: 'VISA',
              MASTERCARD: 'MASTERCARD',
              AMEX: 'AMEX',
              ELO: 'ELO',
              HIPERCARD: 'HIPERCARD',
              DINERS: 'DINERS',
            };

            const creditCardBrand = customer.creditCard.creditCardBrand;
            await prisma.responsavel.update({
              where: { id: responsavel.id },
              data: {
                asaasCreditCardToken: customer.creditCard.creditCardToken,
                creditCardBrand: creditCardBrand ? (brandMap[creditCardBrand] || creditCardBrand) : null,
                creditCardLast4: customer.creditCard.creditCardNumber,
                creditCardUpdatedAt: new Date(),
                preferredBillingType: 'CREDIT_CARD',
              },
            });

            console.log(`[Webhook Asaas] Cartão sincronizado automaticamente para responsável ${responsavel.id}`);
          }
        }
      } catch (syncError) {
        console.error('[Webhook Asaas] Erro ao sincronizar cartão:', syncError);
        // Não falhar o webhook por causa disso
      }
    }
  }

  // Se pagamento em atraso
  if (event === 'PAYMENT_OVERDUE') {
    // Cobrança já foi atualizada acima para ATRASADO
    console.log(`[Webhook Asaas] Pagamento ${paymentId} marcado como atrasado`);
  }

  // Se pagamento estornado
  if (event === 'PAYMENT_REFUNDED') {
    const valorOriginal = Number(cobranca.valor);
    const valorEstornado = paymentData.value || valorOriginal;
    const isEstornoParcial = valorEstornado < valorOriginal;

    // Atualizar cobrança para ESTORNADO ou ESTORNADO_PARCIAL com campos de auditoria
    await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: {
        status: isEstornoParcial ? 'ESTORNADO_PARCIAL' : 'ESTORNADO',
        estornadoEm: new Date(),
        estornadoValor: valorEstornado,
        estornadoMotivo: isEstornoParcial
          ? `Estorno parcial de R$ ${valorEstornado.toFixed(2)} do valor total de R$ ${valorOriginal.toFixed(2)}`
          : `Estorno total de R$ ${valorOriginal.toFixed(2)}`,
        estornadoPor: 'Asaas Webhook',
      },
    });

    // Atualizar pagamento
    await prisma.pagamento.updateMany({
      where: { asaasPaymentId: paymentId },
      data: { status: 'ESTORNADO' },
    });

    // Registrar log do estorno
    await prisma.logFinanceiro.create({
      data: {
        contaId: cobranca.matricula.aluno.contaId,
        usuarioId: 'system', // TODO: Pegar usuário do contexto quando disponível
        cobrancaId: cobranca.id,
        acao: isEstornoParcial ? 'ESTORNO_PARCIAL' : 'ESTORNO_TOTAL',
        detalhes: {
          event,
          paymentId,
          valorOriginal,
          valorEstornado,
          isEstornoParcial,
          descricao: isEstornoParcial
            ? `Estorno parcial de R$ ${valorEstornado.toFixed(2)} (valor original: R$ ${valorOriginal.toFixed(2)})`
            : `Estorno total de R$ ${valorOriginal.toFixed(2)}`,
        },
      },
    });

    console.log(
      `[Webhook Asaas] Pagamento ${paymentId} estornado: ${isEstornoParcial ? 'PARCIAL' : 'TOTAL'} - R$ ${valorEstornado.toFixed(2)}`,
    );
  }

  // Se pagamento cancelado
  if (event === 'PAYMENT_DELETED') {
    // Registrar log do cancelamento antes de atualizar
    await prisma.logFinanceiro.create({
      data: {
        contaId: cobranca.matricula.aluno.contaId,
        usuarioId: 'system', // TODO: Pegar usuário do contexto quando disponível
        cobrancaId: cobranca.id,
        acao: 'CANCELAMENTO',
        detalhes: {
          event,
          paymentId,
          valor: Number(cobranca.valor),
          descricao: 'Cobrança cancelada no Asaas',
          motivoCancelamento: 'Cancelamento via Asaas',
        },
      },
    });

    console.log(`[Webhook Asaas] Pagamento ${paymentId} cancelado`);
  }

  // Recebimento em dinheiro desfeito (reverte baixa manual)
  if (event === 'PAYMENT_RECEIVED_IN_CASH_UNDONE') {
    await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: { status: 'PENDENTE', dataPagamento: null },
    });

    await prisma.pagamento.updateMany({
      where: { asaasPaymentId: paymentId },
      data: { status: 'ESTORNADO' },
    });

    await prisma.logFinanceiro.create({
      data: {
        contaId: cobranca.matricula.aluno.contaId,
        usuarioId: 'system',
        cobrancaId: cobranca.id,
        acao: 'RECEBIMENTO_EM_DINHEIRO_DESFEITO',
        detalhes: {
          event,
          paymentId,
          descricao: 'Recebimento em dinheiro desfeito via Asaas',
        },
      },
    });

    console.log(`[Webhook Asaas] Recebimento em dinheiro desfeito para pagamento ${paymentId}`);
  }

  // Pagamento restaurado (após cancelamento)
  if (event === 'PAYMENT_RESTORED') {
    await prisma.cobranca.update({
      where: { id: cobranca.id },
      data: { status: 'PENDENTE' },
    });

    await prisma.logFinanceiro.create({
      data: {
        contaId: cobranca.matricula.aluno.contaId,
        usuarioId: 'system',
        cobrancaId: cobranca.id,
        acao: 'COBRANCA_RESTAURADA',
        detalhes: {
          event,
          paymentId,
          descricao: 'Cobrança restaurada via Asaas',
        },
      },
    });

    console.log(`[Webhook Asaas] Pagamento ${paymentId} restaurado`);
  }
}

/**
 * Processa evento de assinatura
 */
type AsaasSubscriptionDiscount = {
  value?: number;
  limitDate?: string | null;
  dueDateLimitDays?: number;
  type?: string;
} | null;

type AsaasSubscriptionFineOrInterest = {
  value?: number;
  type?: string;
} | null;

type AsaasSubscriptionPayload = {
  status?: string;
  customer?: string;
  value?: number;
  nextDueDate?: string;
  endDate?: string; // Data de fim da assinatura (formato: YYYY-MM-DD)
  discount?: AsaasSubscriptionDiscount;
  fine?: AsaasSubscriptionFineOrInterest;
  interest?: AsaasSubscriptionFineOrInterest;
};

async function processSubscriptionEvent(
  event: string,
  subscriptionId: string,
  subscriptionData: AsaasSubscriptionPayload,
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
    // Sincronizar dataFimContrato se presente no payload
    const updateData: { dataFimContrato?: Date } = {};
    if (subscriptionData.endDate) {
      updateData.dataFimContrato = new Date(subscriptionData.endDate);
      console.log(`[Webhook Asaas] Sincronizando dataFimContrato: ${subscriptionData.endDate}`);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.matricula.update({
        where: { id: matricula.id },
        data: updateData,
      });
    }

    await prisma.matriculaLog.create({
      data: {
        matriculaId: matricula.id,
        action: 'ASSINATURA_CRIADA',
        actorId: 'system',
        metadata: {
          subscriptionId,
          valor: subscriptionData.value,
          status: subscriptionData.status,
          endDate: subscriptionData.endDate,
        },
      },
    });
    console.log(`[Webhook Asaas] Assinatura criada para matrícula ${matricula.id}`);
  }

  // Se assinatura foi cancelada
  if (event === 'SUBSCRIPTION_DELETED') {
    // Verificar se a matrícula já tem uma NOVA subscription (caso de rematrícula)
    // Se tiver outra subscription, não cancelar a matrícula
    const matriculaAtualizada = await prisma.matricula.findUnique({
      where: { id: matricula.id },
      select: { asaasSubscriptionId: true, status: true },
    });

    // Se a subscription deletada é diferente da atual, significa que foi uma rematrícula
    // Não devemos cancelar a matrícula nesse caso
    if (matriculaAtualizada?.asaasSubscriptionId && 
        matriculaAtualizada.asaasSubscriptionId !== subscriptionId) {
      console.log(
        `[Webhook Asaas] Subscription ${subscriptionId} deletada, mas matrícula ${matricula.id} já possui nova subscription ${matriculaAtualizada.asaasSubscriptionId}. Ignorando cancelamento.`
      );
      
      await prisma.matriculaLog.create({
        data: {
          matriculaId: matricula.id,
          action: 'ASSINATURA_ANTIGA_DELETADA_REMATRICULA',
          actorId: 'system',
          metadata: {
            subscriptionIdDeletada: subscriptionId,
            subscriptionIdAtual: matriculaAtualizada.asaasSubscriptionId,
            motivo: 'Subscription anterior deletada após rematrícula',
          },
        },
      });
      return;
    }

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
    // Sincronizar dataFimContrato, juros, multa e desconto se presente no payload
    const updateData: {
      status?: 'CANCELADA';
      dataFimContrato?: Date;
      jurosMensal?: number | null;
      multaPercentual?: number | null;
    } = {};
    
    if (subscriptionData.endDate) {
      updateData.dataFimContrato = new Date(subscriptionData.endDate);
      console.log(`[Webhook Asaas] Sincronizando dataFimContrato atualizada: ${subscriptionData.endDate}`);
    }

    if (subscriptionData.status === 'INACTIVE') {
      updateData.status = 'CANCELADA';
    }

    // Sincronizar juros mensais
    if (subscriptionData.interest && subscriptionData.interest.value !== undefined) {
      updateData.jurosMensal = subscriptionData.interest.value;
      console.log(
        `[Webhook Asaas] Sincronizando juros mensais: ${subscriptionData.interest.value}%`,
      );
    }

    // Sincronizar multa percentual
    if (subscriptionData.fine && subscriptionData.fine.value !== undefined) {
      updateData.multaPercentual = subscriptionData.fine.value;
      console.log(
        `[Webhook Asaas] Sincronizando multa percentual: ${subscriptionData.fine.value}%`,
      );
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.matricula.update({
        where: { id: matricula.id },
        data: updateData,
      });
    }

    await prisma.matriculaLog.create({
      data: {
        matriculaId: matricula.id,
        action:
          subscriptionData.status === 'INACTIVE' ? 'ASSINATURA_INATIVADA' : 'ASSINATURA_ATUALIZADA',
        actorId: 'system',
        metadata: {
          subscriptionId,
          status: subscriptionData.status,
          endDate: subscriptionData.endDate,
          interest: subscriptionData.interest,
          fine: subscriptionData.fine,
          discount: subscriptionData.discount,
        },
      },
    });

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
    // Asaas pode enviar token via asaas-access-token ou asaas-signature
    const signature = req.headers.get('asaas-access-token') || req.headers.get('asaas-signature');

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
    // Restrições: não usar fallback em produção para evitar associar eventos à conta errada
    if (!contaId) {
      if (process.env.NODE_ENV === 'development') {
        const fallback = await prisma.conta.findFirst({ select: { id: true } });
        contaId = fallback?.id || null;
      }
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

    // Gerar eventId para logs e idempotência (inclui evento + identificadores + campos relevantes)
    if (payment?.id) {
      const status = payment.status || 'NA';
      const when = payment.paymentDate || payment.dueDate || 'NA';
      eventId = `${event}:${payment.id}:${status}:${when}`;
    } else if (subscription?.id) {
      const status = subscription.status || 'NA';
      const when = subscription.nextDueDate || subscription.endDate || 'NA';
      eventId = `${event}:${subscription.id}:${status}:${when}`;
    } else {
      eventId = `${event}-${Date.now()}`;
    }

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
