/**
 * Helpers para criação de cobranças avulsas no Asaas
 *
 * @module @alusa/lib/asaas/payment-helpers
 *
 * @example
 * ```ts
 * import { createAvulsaPayment } from '@alusa/lib/asaas/payment-helpers';
 *
 * const result = await createAvulsaPayment({
 *   cobrancaId: 'cob_123',
 *   billingType: 'PIX',
 * });
 *
 * console.log(result.paymentId); // 'pay_000000000000'
 * console.log(result.invoiceUrl); // URL para checkout
 * console.log(result.pixQrCode); // QR Code Base64 (se PIX)
 * ```
 */

// Em ambiente de testes, o módulo '../prisma' é mockado em payment-helpers.test.ts
// Em runtime real, esse módulo deve reexportar o prisma configurado da aplicação.
import { prisma } from '../prisma';
import { createPayment, getPayment, type AsaasPayment } from './payment';
import { getCustomer } from './customer';
import { formatDate } from './utils';

// Tipos de cobrança suportados pelo Asaas
export type BillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';

export interface AvulsaPaymentInput {
  cobrancaId: string;
  billingType: BillingType;
  contaId?: string;
}

export interface AvulsaPaymentResult {
  paymentId: string;
  status: string;
  value: number;
  dueDate: string;
  billingType: BillingType;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate?: string;
  };
  rawPayment: AsaasPayment;
}

/**
 * Cria uma cobrança avulsa no Asaas baseada em uma Cobranca existente
 *
 * @param input - Dados da cobrança (cobrancaId + billingType)
 * @returns Dados do payment criado no Asaas
 *
 * @throws Error se cobrança não existir
 * @throws Error se aluno não tiver customer no Asaas
 * @throws Error se já existir asaasPaymentId vinculado
 */
export async function createAvulsaPayment(input: AvulsaPaymentInput): Promise<AvulsaPaymentResult> {
  const { cobrancaId, billingType, contaId } = input;

  // 1. Buscar cobrança no banco com relações
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
    throw new Error(`Cobrança ${cobrancaId} não encontrada`);
  }

  if (cobranca.asaasPaymentId) {
    throw new Error(
      `Cobrança ${cobrancaId} já possui payment vinculado: ${cobranca.asaasPaymentId}`,
    );
  }

  const matricula = cobranca.matricula;
  const logContaId = matricula.aluno.contaId;
  const effectiveContaId = contaId ?? logContaId;
  const aluno = matricula.aluno;

  // 2. Determinar customer (usar asaasCustomerId do aluno)
  const customerId = aluno.asaasCustomerId;

  if (!customerId) {
    throw new Error(
      `Aluno ${aluno.id} não possui asaasCustomerId. Crie o customer antes de gerar cobrança.`,
    );
  }

  // 3. Validar customer no Asaas
  try {
    await getCustomer(customerId, { contaId: effectiveContaId });
  } catch (error) {
    throw new Error(
      `Customer ${customerId} não encontrado no Asaas: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    );
  }

  // 4. Criar payment no Asaas
  const payment = await createPayment(
    {
      customer: customerId,
      billingType,
      value: Number(cobranca.valor),
      dueDate: formatDate(cobranca.vencimento), // YYYY-MM-DD timezone-safe
      description: cobranca.descricao || 'Taxa de matrícula',
      externalReference: cobrancaId,
    },
    { contaId: effectiveContaId, idempotencyKey: cobrancaId },
  );

  // 5. Mapear billingType para FormaPagamento
  const billingTypeToFormaPagamento: Record<BillingType, import('@prisma/client').FormaPagamento> =
    {
      BOLETO: 'BOLETO',
      PIX: 'PIX',
      CREDIT_CARD: 'CARTAO_CREDITO',
      UNDEFINED: 'INDEFINIDO',
    };

  // Atualizar cobrança no banco com asaasPaymentId
  await prisma.cobranca.update({
    where: { id: cobrancaId },
    data: {
      asaasPaymentId: payment.id,
      formaPagamento: billingTypeToFormaPagamento[billingType],
    },
  });

  // 📧 Registrar logs automáticos de notificações enviadas pelo Asaas
  // O Asaas envia automaticamente Email, SMS e WhatsApp ao criar uma cobrança
  try {
    await prisma.logFinanceiro.createMany({
      data: [
        {
          contaId: logContaId,
          cobrancaId: cobrancaId,
          acao: 'ASAAS_EMAIL_AUTOMATICO',
          detalhes: {
            automatico: true,
            tipo: 'email',
            descricao: 'E-mail de cobrança enviado automaticamente pelo Asaas ao criar o payment',
            asaasPaymentId: payment.id,
            billingType: billingType,
          },
          usuarioId: process.env.SYSTEM_USER_ID || 'system',
        },
        {
          contaId: logContaId,
          cobrancaId: cobrancaId,
          acao: 'ASAAS_SMS_AUTOMATICO',
          detalhes: {
            automatico: true,
            tipo: 'sms',
            descricao: 'SMS de cobrança enviado automaticamente pelo Asaas (se configurado)',
            asaasPaymentId: payment.id,
            billingType: billingType,
          },
          usuarioId: process.env.SYSTEM_USER_ID || 'system',
        },
        {
          contaId: logContaId,
          cobrancaId: cobrancaId,
          acao: 'ASAAS_WHATSAPP_AUTOMATICO',
          detalhes: {
            automatico: true,
            tipo: 'whatsapp',
            descricao: 'WhatsApp de cobrança enviado automaticamente pelo Asaas (se configurado)',
            asaasPaymentId: payment.id,
            billingType: billingType,
          },
          usuarioId: process.env.SYSTEM_USER_ID || 'system',
        },
      ],
    });
    console.log(`[createAvulsaPayment] Logs de notificações automáticas registrados para cobrança ${cobrancaId}`);
  } catch (logError) {
    // Não bloquear o fluxo se falhar ao registrar logs
    console.error('[createAvulsaPayment] Erro ao registrar logs de notificações:', logError);
  }

  // 6. Buscar dados completos do payment (inclui QR Code PIX se aplicável)
  let pixQrCode: AvulsaPaymentResult['pixQrCode'];

  if (billingType === 'PIX' && payment.id) {
    try {
      const { getPixQrCode } = await import('./payment');
      const qrCodeData = await getPixQrCode(payment.id, { contaId: effectiveContaId });
      if (qrCodeData.encodedImage && qrCodeData.payload) {
        pixQrCode = {
          encodedImage: qrCodeData.encodedImage,
          payload: qrCodeData.payload,
          expirationDate: qrCodeData.expirationDate ?? undefined,
        };
      } else {
        pixQrCode = undefined;
      }
    } catch (error) {
      console.error('[createAvulsaPayment] Erro ao buscar QR Code PIX:', error);
      pixQrCode = undefined;
    }
  }

  // 7. Montar resultado (mapear billing type seguro)
  const safeBillingType: BillingType =
    payment.billingType === 'BOLETO' ||
    payment.billingType === 'PIX' ||
    payment.billingType === 'CREDIT_CARD' ||
    payment.billingType === 'UNDEFINED'
      ? payment.billingType
      : 'UNDEFINED';

  const result: AvulsaPaymentResult = {
    paymentId: payment.id,
    status: payment.status,
    value: payment.value,
    dueDate: payment.dueDate,
    billingType: safeBillingType,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    pixQrCode,
    rawPayment: payment,
  };

  return result;
}

/**
 * Busca dados de um payment existente incluindo QR Code PIX, boleto, etc.
 *
 * @param paymentId - ID do payment no Asaas
 * @param contaId - ID da conta (opcional)
 * @returns Dados completos do payment
 */
export async function getAvulsaPaymentData(
  paymentId: string,
  contaId?: string,
): Promise<AvulsaPaymentResult> {
  const payment = await getPayment(paymentId, { contaId });

  let pixQrCode: AvulsaPaymentResult['pixQrCode'];

  if (payment.billingType === 'PIX') {
    try {
      const { getPixQrCode } = await import('./payment');
      const qrCodeData = await getPixQrCode(paymentId, { contaId });
      if (qrCodeData.encodedImage && qrCodeData.payload) {
        pixQrCode = {
          encodedImage: qrCodeData.encodedImage,
          payload: qrCodeData.payload,
          expirationDate: qrCodeData.expirationDate ?? undefined,
        };
      } else {
        pixQrCode = undefined;
      }
    } catch (error) {
      console.error('[getAvulsaPaymentData] Erro ao buscar QR Code PIX:', error);
      pixQrCode = undefined;
    }
  }

  // Mapear billing type seguro
  const safeBillingType: BillingType =
    payment.billingType === 'BOLETO' ||
    payment.billingType === 'PIX' ||
    payment.billingType === 'CREDIT_CARD' ||
    payment.billingType === 'UNDEFINED'
      ? payment.billingType
      : 'UNDEFINED';

  return {
    paymentId: payment.id,
    status: payment.status,
    value: payment.value,
    dueDate: payment.dueDate,
    billingType: safeBillingType,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    pixQrCode,
    rawPayment: payment,
  };
}
