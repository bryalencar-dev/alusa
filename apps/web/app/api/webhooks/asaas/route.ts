import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ASAAS_BILLING_TYPE_MAP } from '@/lib/utils/asaas-sync';

/**
 * POST /api/webhooks/asaas
 * Recebe eventos do Asaas e sincroniza cobranças automaticamente
 *
 * Eventos de Pagamento suportados (Asaas → Alusa):
 * - PAYMENT_CREATED: Cobrança criada
 * - PAYMENT_UPDATED: Cobrança atualizada
 * - PAYMENT_CONFIRMED: Pagamento confirmado (PAGO)
 * - PAYMENT_RECEIVED: Pagamento recebido (PAGO)
 * - PAYMENT_RECEIVED_IN_CASH: Pagamento manual confirmado (PAGO)
 * - PAYMENT_OVERDUE: Cobrança vencida (ATRASADO)
 * - PAYMENT_DELETED: Cobrança deletada (CANCELADO)
 * - PAYMENT_RESTORED: Cobrança restaurada (A_VENCER/PENDENTE)
 * - PAYMENT_REFUNDED: Pagamento estornado (ESTORNADO)
 * - PAYMENT_REFUND_IN_PROGRESS: Estorno em processamento (PROCESSANDO)
 * - PAYMENT_CHARGEBACK_REQUESTED: Chargeback solicitado (PROCESSANDO)
 * - PAYMENT_CHARGEBACK_DISPUTE: Disputa de chargeback (PROCESSANDO)
 * - PAYMENT_AWAITING_CHARGEBACK_REVERSAL: Aguardando reversão de chargeback (PROCESSANDO)
 * - PAYMENT_DUNNING_REQUESTED: Negativação solicitada (ATRASADO)
 * - PAYMENT_DUNNING_RECEIVED: Negativação recebida (ATRASADO)
 * - PAYMENT_AWAITING_RISK_ANALYSIS: Aguardando análise de risco (PROCESSANDO)
 * - PAYMENT_APPROVED_BY_RISK_ANALYSIS: Aprovado na análise de risco (A_VENCER/PENDENTE)
 * - PAYMENT_REPROVED_BY_RISK_ANALYSIS: Reprovado na análise de risco (CANCELADO)
 * - PAYMENT_ANTICIPATED: Cobrança antecipada (log apenas)
 * - PAYMENT_AUTHORIZED: Pagamento autorizado (PROCESSANDO)
 * - PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: Captura recusada (CANCELADO)
 * - PAYMENT_RECEIVED_IN_CASH_UNDONE: Confirmação manual desfeita (PENDENTE/A_VENCER)
 * - PAYMENT_CHECKOUT_VIEWED: Checkout visualizado (log apenas)
 * - PAYMENT_BANK_SLIP_VIEWED: Boleto visualizado (log apenas)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id: eventId, event, payment, subscription } = body;

    console.log(`[Webhook Asaas] Evento recebido: ${event}`, {
      eventId,
      paymentId: payment?.id,
      subscriptionId: payment?.subscription || subscription?.id,
      externalReference: payment?.externalReference,
    });

    // Validar estrutura básica
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Evento não especificado' },
        { status: 400 },
      );
    }

    // Se não for evento de PAYMENT, apenas registrar e retornar sucesso
    if (!event.startsWith('PAYMENT_')) {
      console.log(`[Webhook Asaas] Evento ${event} não é de pagamento, ignorando processamento`);
      return NextResponse.json({
        success: true,
        message: `Evento ${event} recebido mas não processado (não é evento de pagamento)`,
      });
    }

    // Validar se tem objeto payment para eventos de PAYMENT_*
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Objeto payment não encontrado para evento de pagamento' },
        { status: 400 },
      );
    }

    // Verificar idempotência - se o eventId já foi processado, ignorar
    if (eventId) {
      const webhookExistente = await prisma.webhookAsaas.findUnique({
        where: { eventId },
      });

      if (webhookExistente && webhookExistente.status === 'PROCESSADO') {
        console.log(`[Webhook Asaas] Evento duplicado ignorado: ${eventId}`);
        return NextResponse.json({ success: true, message: 'Evento já processado' });
      }
    }

    // Buscar cobrança - estratégias múltiplas de vinculação
    let cobranca = await prisma.cobranca.findFirst({
      where: {
        asaasPaymentId: payment.id,
      },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                id: true,
                contaId: true,
              },
            },
          },
        },
      },
    });

    // Estratégia 2: Buscar pela subscription (para PAYMENT_CREATED de assinatura)
    if (!cobranca && payment.subscription) {
      cobranca = await prisma.cobranca.findFirst({
        where: {
          matricula: {
            asaasSubscriptionId: payment.subscription,
          },
          asaasPaymentId: null, // Cobrança ainda sem payment vinculado
        },
        include: {
          matricula: {
            include: {
              aluno: {
                select: {
                  id: true,
                  contaId: true,
                },
              },
            },
          },
        },
        orderBy: {
          vencimento: 'asc', // Pegar a próxima cobrança pendente
        },
      });

      // Se encontrou, vincular o asaasPaymentId
      if (cobranca) {
        console.log(
          `[Webhook Asaas] Vinculando payment ${payment.id} à cobrança ${cobranca.id} via subscription`,
        );
        await prisma.cobranca.update({
          where: { id: cobranca.id },
          data: { asaasPaymentId: payment.id },
        });
      }
    }

    // Estratégia 3: Buscar pela externalReference (matriculaId)
    if (!cobranca && payment.externalReference) {
      cobranca = await prisma.cobranca.findFirst({
        where: {
          matriculaId: payment.externalReference,
          asaasPaymentId: null,
        },
        include: {
          matricula: {
            include: {
              aluno: {
                select: {
                  id: true,
                  contaId: true,
                },
              },
            },
          },
        },
        orderBy: {
          vencimento: 'asc',
        },
      });

      if (cobranca) {
        console.log(
          `[Webhook Asaas] Vinculando payment ${payment.id} à cobrança ${cobranca.id} via externalReference`,
        );
        await prisma.cobranca.update({
          where: { id: cobranca.id },
          data: { asaasPaymentId: payment.id },
        });
      }
    }

    if (!cobranca) {
      console.warn(`[Webhook Asaas] Cobrança não encontrada para payment.id: ${payment.id}`);

      // Registrar webhook mesmo sem cobrança (pode ser útil para debug)
      // Não registrar se não houver contaId
      return NextResponse.json({
        success: true,
        message: 'Cobrança não encontrada no sistema',
      });
    }

    const contaId = cobranca.matricula.aluno.contaId;

    // Registrar webhook
    const webhookRecord = await prisma.webhookAsaas.upsert({
      where: { eventId: eventId || `manual_${Date.now()}` },
      create: {
        contaId,
        evento: event,
        eventId,
        payload: body,
        status: 'PROCESSANDO',
      },
      update: {
        status: 'PROCESSANDO',
        payload: body,
      },
    });

    // Processar evento
    const dadosParaAtualizar: Record<string, unknown> = {};

    switch (event) {
      // =====================================================
      // EVENTOS DE CRIAÇÃO/ATUALIZAÇÃO
      // =====================================================
      case 'PAYMENT_CREATED':
        // Cobrança criada - vincular IDs e atualizar dados básicos
        console.log(`[Webhook Asaas] Cobrança criada: ${payment.id}`);
        // Status inicial depende da data de vencimento
        if (payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate > today) {
            dadosParaAtualizar.status = 'A_VENCER';
          } else if (dueDate.toDateString() === today.toDateString()) {
            dadosParaAtualizar.status = 'PENDENTE';
          }
        }
        break;

      case 'PAYMENT_UPDATED':
        console.log(`[Webhook Asaas] Cobrança atualizada: ${payment.id}`);

        // Atualizar forma de pagamento se mudou
        if (payment.billingType) {
          const billingType = payment.billingType as keyof typeof ASAAS_BILLING_TYPE_MAP;
          const novaFormaPagamento = ASAAS_BILLING_TYPE_MAP[billingType];

          if (novaFormaPagamento && novaFormaPagamento !== cobranca.formaPagamento) {
            dadosParaAtualizar.formaPagamento = novaFormaPagamento;

            // Registrar no log
            await prisma.logFinanceiro.create({
              data: {
                contaId,
                usuarioId: process.env.SYSTEM_USER_ID || 'system',
                cobrancaId: cobranca.id,
                acao: 'WEBHOOK_FORMA_PAGAMENTO_ATUALIZADA',
                detalhes: {
                  event,
                  formaAnterior: cobranca.formaPagamento,
                  formaNova: novaFormaPagamento,
                  billingType: payment.billingType,
                  asaasPaymentId: payment.id,
                  webhookEventId: eventId,
                },
              },
            });
          }
        }

        // Atualizar valor se mudou
        if (payment.value && payment.value !== Number(cobranca.valor)) {
          dadosParaAtualizar.valor = payment.value;
        }

        // Atualizar data de vencimento se mudou
        if (payment.dueDate) {
          const dueDateISO = new Date(payment.dueDate).toISOString();
          const vencimentoISO = new Date(cobranca.vencimento).toISOString();
          if (dueDateISO !== vencimentoISO) {
            dadosParaAtualizar.vencimento = dueDateISO;
          }
        }

        // Atualizar descrição se mudou
        if (payment.description && payment.description !== cobranca.descricao) {
          dadosParaAtualizar.descricao = payment.description;
        }

        break;

      // =====================================================
      // EVENTOS DE PAGAMENTO CONFIRMADO
      // =====================================================
      case 'PAYMENT_CONFIRMED':
        console.log(`[Webhook Asaas] Pagamento confirmado: ${payment.id}`);
        dadosParaAtualizar.status = 'PAGO';
        if (payment.confirmedDate) {
          dadosParaAtualizar.dataPagamento = new Date(payment.confirmedDate).toISOString();
        }
        break;

      case 'PAYMENT_RECEIVED':
        console.log(`[Webhook Asaas] Pagamento recebido: ${payment.id}`);
        dadosParaAtualizar.status = 'PAGO';
        if (payment.paymentDate) {
          dadosParaAtualizar.dataPagamento = new Date(payment.paymentDate).toISOString();
        } else if (payment.clientPaymentDate) {
          dadosParaAtualizar.dataPagamento = new Date(payment.clientPaymentDate).toISOString();
        }
        break;

      case 'PAYMENT_RECEIVED_IN_CASH':
        console.log(`[Webhook Asaas] Pagamento manual confirmado: ${payment.id}`);
        dadosParaAtualizar.status = 'PAGO';
        if (payment.paymentDate) {
          dadosParaAtualizar.dataPagamento = new Date(payment.paymentDate).toISOString();
        }
        break;

      // =====================================================
      // EVENTOS DE ATRASO/VENCIMENTO
      // =====================================================
      case 'PAYMENT_OVERDUE':
        console.log(`[Webhook Asaas] Cobrança vencida: ${payment.id}`);
        dadosParaAtualizar.status = 'ATRASADO';
        break;

      case 'PAYMENT_DUNNING_REQUESTED':
        console.log(`[Webhook Asaas] Negativação solicitada: ${payment.id}`);
        dadosParaAtualizar.status = 'ATRASADO';
        // Registrar ação de negativação
        await prisma.logFinanceiro.create({
          data: {
            contaId,
            usuarioId: process.env.SYSTEM_USER_ID || 'system',
            cobrancaId: cobranca.id,
            acao: 'WEBHOOK_NEGATIVACAO_SOLICITADA',
            detalhes: {
              event,
              asaasPaymentId: payment.id,
              webhookEventId: eventId,
            },
          },
        });
        break;

      case 'PAYMENT_DUNNING_RECEIVED':
        console.log(`[Webhook Asaas] Negativação recebida: ${payment.id}`);
        dadosParaAtualizar.status = 'ATRASADO';
        break;

      // =====================================================
      // EVENTOS DE ESTORNO/REEMBOLSO
      // =====================================================
      case 'PAYMENT_REFUNDED':
        console.log(`[Webhook Asaas] Cobrança estornada: ${payment.id}`);
        dadosParaAtualizar.status = 'ESTORNADO';
        // Verificar se é estorno parcial
        if (payment.refunds && payment.refunds.length > 0) {
          const totalEstornado = payment.refunds.reduce(
            (acc: number, r: { value: number }) => acc + r.value,
            0,
          );
          if (totalEstornado < payment.value) {
            dadosParaAtualizar.status = 'ESTORNADO_PARCIAL';
          }
        }
        break;

      case 'PAYMENT_REFUND_IN_PROGRESS':
        console.log(`[Webhook Asaas] Estorno em processamento: ${payment.id}`);
        dadosParaAtualizar.status = 'PROCESSANDO';
        break;

      // =====================================================
      // EVENTOS DE CHARGEBACK (Disputa de Cartão)
      // =====================================================
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        console.log(`[Webhook Asaas] Chargeback solicitado: ${payment.id}`);
        dadosParaAtualizar.status = 'PROCESSANDO';
        // Registrar chargeback
        await prisma.logFinanceiro.create({
          data: {
            contaId,
            usuarioId: process.env.SYSTEM_USER_ID || 'system',
            cobrancaId: cobranca.id,
            acao: 'WEBHOOK_CHARGEBACK_SOLICITADO',
            detalhes: {
              event,
              asaasPaymentId: payment.id,
              chargebackReason: payment.chargeback?.reason,
              webhookEventId: eventId,
            },
          },
        });
        break;

      case 'PAYMENT_CHARGEBACK_DISPUTE':
        console.log(`[Webhook Asaas] Disputa de chargeback: ${payment.id}`);
        dadosParaAtualizar.status = 'PROCESSANDO';
        break;

      case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
        console.log(`[Webhook Asaas] Aguardando reversão de chargeback: ${payment.id}`);
        dadosParaAtualizar.status = 'PROCESSANDO';
        break;

      // =====================================================
      // EVENTOS DE CANCELAMENTO/DELEÇÃO
      // =====================================================
      case 'PAYMENT_DELETED':
        console.log(`[Webhook Asaas] Cobrança deletada: ${payment.id}`);
        dadosParaAtualizar.status = 'CANCELADO';
        break;

      case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED':
        console.log(`[Webhook Asaas] Captura de cartão recusada: ${payment.id}`);
        dadosParaAtualizar.status = 'CANCELADO';
        // Registrar motivo da recusa
        await prisma.logFinanceiro.create({
          data: {
            contaId,
            usuarioId: process.env.SYSTEM_USER_ID || 'system',
            cobrancaId: cobranca.id,
            acao: 'WEBHOOK_CAPTURA_RECUSADA',
            detalhes: {
              event,
              asaasPaymentId: payment.id,
              webhookEventId: eventId,
            },
          },
        });
        break;

      case 'PAYMENT_REPROVED_BY_RISK_ANALYSIS':
        console.log(`[Webhook Asaas] Reprovado na análise de risco: ${payment.id}`);
        dadosParaAtualizar.status = 'CANCELADO';
        await prisma.logFinanceiro.create({
          data: {
            contaId,
            usuarioId: process.env.SYSTEM_USER_ID || 'system',
            cobrancaId: cobranca.id,
            acao: 'WEBHOOK_REPROVADO_ANALISE_RISCO',
            detalhes: {
              event,
              asaasPaymentId: payment.id,
              webhookEventId: eventId,
            },
          },
        });
        break;

      // =====================================================
      // EVENTOS DE RESTAURAÇÃO/REATIVAÇÃO
      // =====================================================
      case 'PAYMENT_RESTORED':
        console.log(`[Webhook Asaas] Cobrança restaurada: ${payment.id}`);
        // Determinar status baseado na data de vencimento
        if (payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            dadosParaAtualizar.status = 'ATRASADO';
          } else if (dueDate.toDateString() === today.toDateString()) {
            dadosParaAtualizar.status = 'PENDENTE';
          } else {
            dadosParaAtualizar.status = 'A_VENCER';
          }
        } else {
          dadosParaAtualizar.status = 'PENDENTE';
        }
        break;

      case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
        console.log(`[Webhook Asaas] Confirmação manual desfeita: ${payment.id}`);
        // Determinar status baseado na data de vencimento
        if (payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            dadosParaAtualizar.status = 'ATRASADO';
          } else {
            dadosParaAtualizar.status = 'PENDENTE';
          }
        } else {
          dadosParaAtualizar.status = 'PENDENTE';
        }
        dadosParaAtualizar.dataPagamento = null;
        break;

      case 'PAYMENT_APPROVED_BY_RISK_ANALYSIS':
        console.log(`[Webhook Asaas] Aprovado na análise de risco: ${payment.id}`);
        // Voltar para status normal
        if (payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate > today) {
            dadosParaAtualizar.status = 'A_VENCER';
          } else {
            dadosParaAtualizar.status = 'PENDENTE';
          }
        } else {
          dadosParaAtualizar.status = 'PENDENTE';
        }
        break;

      // =====================================================
      // EVENTOS DE PROCESSAMENTO/ANÁLISE
      // =====================================================
      case 'PAYMENT_AWAITING_RISK_ANALYSIS':
        console.log(`[Webhook Asaas] Aguardando análise de risco: ${payment.id}`);
        dadosParaAtualizar.status = 'PROCESSANDO';
        break;

      case 'PAYMENT_AUTHORIZED':
        console.log(`[Webhook Asaas] Pagamento autorizado: ${payment.id}`);
        dadosParaAtualizar.status = 'PROCESSANDO';
        break;

      // =====================================================
      // EVENTOS DE LOG APENAS (sem alteração de status)
      // =====================================================
      case 'PAYMENT_ANTICIPATED':
        console.log(`[Webhook Asaas] Cobrança antecipada: ${payment.id}`);
        // Apenas registrar log, não alterar status
        await prisma.logFinanceiro.create({
          data: {
            contaId,
            usuarioId: process.env.SYSTEM_USER_ID || 'system',
            cobrancaId: cobranca.id,
            acao: 'WEBHOOK_COBRANCA_ANTECIPADA',
            detalhes: {
              event,
              asaasPaymentId: payment.id,
              anticipated: payment.anticipated,
              webhookEventId: eventId,
            },
          },
        });
        break;

      case 'PAYMENT_CHECKOUT_VIEWED':
        console.log(`[Webhook Asaas] Checkout visualizado: ${payment.id}`);
        // Apenas log, útil para analytics
        break;

      case 'PAYMENT_BANK_SLIP_VIEWED':
        console.log(`[Webhook Asaas] Boleto visualizado: ${payment.id}`);
        // Apenas log, útil para analytics
        break;

      default:
        console.log(`[Webhook Asaas] Evento não tratado: ${event}`);
    }

    // Atualizar cobrança se houver mudanças
    if (Object.keys(dadosParaAtualizar).length > 0) {
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: {
          ...dadosParaAtualizar,
          updatedAt: new Date(),
        },
      });

      console.log(`[Webhook Asaas] Cobrança ${cobranca.id} atualizada:`, dadosParaAtualizar);
    }

    // Marcar webhook como processado
    await prisma.webhookAsaas.update({
      where: { id: webhookRecord.id },
      data: {
        status: 'PROCESSADO',
        processadoEm: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook processado com sucesso',
      cobrancaId: cobranca.id,
      changes: dadosParaAtualizar,
    });
  } catch (error) {
    console.error('[Webhook Asaas] Erro ao processar webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
