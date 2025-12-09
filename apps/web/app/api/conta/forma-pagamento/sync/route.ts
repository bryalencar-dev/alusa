import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSubscription } from '@alusa/lib';
import prisma from '@/lib/prisma';

/**
 * API para sincronizar dados de cartão e forma de pagamento do Asaas
 * 
 * Busca:
 * - Dados do cartão salvo no customer
 * - Forma de pagamento (billingType) da assinatura ativa
 * 
 * E salva localmente no modelo Responsavel
 */
export async function POST(_req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; contaId: string };
    
    // 2. Apenas RESPONSAVEL pode acessar
    if (user.role !== 'RESPONSAVEL') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 3. Buscar responsável
    const responsavel = await prisma.responsavel.findFirst({
      where: {
        usuarioId: user.id,
      },
      select: {
        id: true,
        asaasCustomerId: true,
        asaasCreditCardToken: true,
      }
    });

    if (!responsavel) {
      return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 });
    }

    if (!responsavel.asaasCustomerId) {
      return NextResponse.json({ 
        synced: false,
        message: 'Customer Asaas não encontrado. Crie uma matrícula primeiro.' 
      });
    }

    let cardSynced = false;
    let billingTypeSynced = false;
    let cardData = null;
    let billingType = null;

    try {
      // 4. Buscar assinatura ativa (tem billingType e creditCardToken se for cartão)
      const assinatura = await prisma.matricula.findFirst({
        where: {
          responsavelFinanceiroId: responsavel.id,
          status: 'ATIVA',
          asaasSubscriptionId: {
            not: null,
          }
        },
        select: {
          id: true,
          asaasSubscriptionId: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!assinatura?.asaasSubscriptionId) {
        console.log('[Sync] Nenhuma assinatura ativa encontrada');
        return NextResponse.json({
          synced: false,
          message: 'Nenhuma assinatura ativa encontrada'
        });
      }

      // 5. Buscar dados da subscription no Asaas
      const subscription = await getSubscription(assinatura.asaasSubscriptionId, {
        contaId: user.contaId
      });

      console.log('[Sync] Subscription Asaas:', {
        subscriptionId: subscription.id,
        billingType: subscription.billingType,
        hasExternalPayment: !!(subscription as any).externalPayment,
      });

      // 6. Sincronizar billingType
      const billingTypeMap: Record<string, string> = {
        BOLETO: 'BOLETO',
        PIX: 'PIX',
        CREDIT_CARD: 'CREDIT_CARD',
        UNDEFINED: 'BOLETO', // fallback
      };

      billingType = billingTypeMap[subscription.billingType] || 'BOLETO';
      
      await prisma.responsavel.update({
        where: { id: responsavel.id },
        data: {
          preferredBillingType: billingType,
        },
      });

      billingTypeSynced = true;
      console.log('[Sync] BillingType sincronizado:', billingType);

      // 7. Se assinatura é de CARTÃO, buscar últimas cobranças pagas com cartão
      if (subscription.billingType === 'CREDIT_CARD') {
        // Buscar cobrança mais recente paga com cartão desta matrícula
        const cobrancaPaga = await prisma.cobranca.findFirst({
          where: {
            matriculaId: assinatura.id,
            status: 'PAGO',
            formaPagamento: 'CARTAO_CREDITO',
            asaasPaymentId: {
              not: null,
            }
          },
          select: {
            asaasPaymentId: true,
          },
          orderBy: {
            dataPagamento: 'desc',
          },
        });

        console.log('[Sync] Cobrança paga com cartão encontrada:', !!cobrancaPaga);

        if (cobrancaPaga?.asaasPaymentId) {
          try {
            // Buscar detalhes do payment no Asaas
            const { getPayment } = await import('@alusa/lib');
            const payment = await getPayment(cobrancaPaga.asaasPaymentId, {
              contaId: user.contaId
            });

            console.log('[Sync] Payment encontrado:', {
              paymentId: payment.id,
              billingType: payment.billingType,
              creditCard: !!(payment as any).creditCard,
            });

            // Se payment tem dados de cartão
            if (payment.creditCard && payment.creditCard.creditCardNumber && payment.creditCard.creditCardBrand) {
              const brandMap: Record<string, string> = {
                VISA: 'VISA',
                MASTERCARD: 'MASTERCARD',
                MASTER: 'MASTERCARD',
                AMEX: 'AMEX',
                AMERICAN_EXPRESS: 'AMEX',
                ELO: 'ELO',
                HIPERCARD: 'HIPERCARD',
                DINERS: 'DINERS',
                DINERS_CLUB: 'DINERS',
              };

              const brand = payment.creditCard.creditCardBrand;
              const last4 = payment.creditCard.creditCardNumber;

              cardData = {
                token: 'imported_from_payment',
                brand: brandMap[brand.toUpperCase()] || brand,
                last4: last4,
              };

              await prisma.responsavel.update({
                where: { id: responsavel.id },
                data: {
                  asaasCreditCardToken: cardData.token,
                  creditCardBrand: cardData.brand,
                  creditCardLast4: cardData.last4,
                  creditCardUpdatedAt: new Date(),
                },
              });

              cardSynced = true;
              console.log('[Sync] Cartão sincronizado do payment:', cardData);
            }
          } catch (paymentError) {
            console.error('[Sync] Erro ao buscar payment:', paymentError);
          }
        } else {
          console.log('[Sync] Assinatura é CREDIT_CARD mas nenhuma cobrança paga encontrada');
        }
      } else {
        // Se assinatura não é CREDIT_CARD, mas pode ter cobrança paga com cartão
        // (caso usuário tenha pago boleto com cartão na fatura do Asaas)
        const cobrancaPagaCartao = await prisma.cobranca.findFirst({
          where: {
            matriculaId: assinatura.id,
            status: 'PAGO',
            asaasPaymentId: {
              not: null,
            }
          },
          select: {
            asaasPaymentId: true,
          },
          orderBy: {
            dataPagamento: 'desc',
          },
        });

        console.log('[Sync] Buscando cartão em cobranças pagas:', !!cobrancaPagaCartao);

        if (cobrancaPagaCartao?.asaasPaymentId) {
          try {
            const { getPayment } = await import('@alusa/lib');
            const payment = await getPayment(cobrancaPagaCartao.asaasPaymentId, {
              contaId: user.contaId
            });

            console.log('[Sync] Payment encontrado (fallback):', {
              paymentId: payment.id,
              billingType: payment.billingType,
            });

            // Se payment foi pago com cartão
            if (payment.billingType === 'CREDIT_CARD' && payment.creditCard && 
                payment.creditCard.creditCardNumber && payment.creditCard.creditCardBrand) {
              const brandMap: Record<string, string> = {
                VISA: 'VISA',
                MASTERCARD: 'MASTERCARD',
                MASTER: 'MASTERCARD',
                AMEX: 'AMEX',
                AMERICAN_EXPRESS: 'AMEX',
                ELO: 'ELO',
                HIPERCARD: 'HIPERCARD',
                DINERS: 'DINERS',
                DINERS_CLUB: 'DINERS',
              };

              const brand = payment.creditCard.creditCardBrand;
              const last4 = payment.creditCard.creditCardNumber;

              cardData = {
                token: 'imported_from_payment',
                brand: brandMap[brand.toUpperCase()] || brand,
                last4: last4,
              };

              await prisma.responsavel.update({
                where: { id: responsavel.id },
                data: {
                  asaasCreditCardToken: cardData.token,
                  creditCardBrand: cardData.brand,
                  creditCardLast4: cardData.last4,
                  creditCardUpdatedAt: new Date(),
                },
              });

              cardSynced = true;
              console.log('[Sync] Cartão sincronizado (fallback):', cardData);
            }
          } catch (paymentError) {
            console.error('[Sync] Erro ao buscar payment (fallback):', paymentError);
          }
        }
      }

      // 8. Retornar resultado
      return NextResponse.json({
        synced: true,
        cardSynced,
        billingTypeSynced,
        data: {
          creditCard: cardData,
          billingType,
        },
      });

    } catch (asaasError: any) {
      console.error('[Sync] Erro ao buscar dados do Asaas:', asaasError);
      
      // Se for erro 404, customer não existe
      if (asaasError.response?.status === 404) {
        return NextResponse.json({
          synced: false,
          message: 'Customer não encontrado no Asaas',
        });
      }

      throw asaasError;
    }

  } catch (error) {
    console.error('[Sync] Erro ao sincronizar:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar dados do Asaas' }, 
      { status: 500 }
    );
  }
}

