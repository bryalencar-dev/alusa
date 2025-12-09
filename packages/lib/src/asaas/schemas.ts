/**
 * Schemas de validação centralizados para Asaas
 *
 * @module asaas/schemas
 *
 * Consolida todos os schemas Zod usados na integração Asaas.
 * Garante validação consistente entre API routes e serviços.
 */

import { z } from 'zod';

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

/**
 * Schema para criação de customer no Asaas
 */
export const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  externalReference: z.string().optional(),
  notificationDisabled: z.boolean().optional(),
  additionalEmails: z.string().optional(),
  municipalInscription: z.string().optional(),
  stateInscription: z.string().optional(),
  observations: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

/**
 * Tipos de cobrança aceitos pelo Asaas
 */
export const billingTypeSchema = z.enum([
  'BOLETO',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'UNDEFINED',
  'TRANSFER',
  'DEPOSIT',
  'PIX',
]);

export type BillingType = z.infer<typeof billingTypeSchema>;

/**
 * Ciclos de cobrança
 */
export const cycleSchema = z.enum([
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'SEMIANNUALLY',
  'YEARLY',
]);

export type Cycle = z.infer<typeof cycleSchema>;

/**
 * Schema para criação de subscription
 */
export const subscriptionSchema = z.object({
  customer: z.string().min(1, 'Customer ID é obrigatório'),
  billingType: billingTypeSchema,
  value: z.number().positive('Valor deve ser maior que zero'),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  cycle: cycleSchema.default('MONTHLY'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  externalReference: z.string().optional(),
  discount: z
    .object({
      value: z.number(),
      dueDateLimitDays: z.number().optional(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  fine: z
    .object({
      value: z.number(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  interest: z
    .object({
      value: z.number(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  sendPaymentByPostalService: z.boolean().optional(),
  endDate: z.string().optional(),
  maxPayments: z.number().int().positive().optional(),
  split: z
    .array(
      z.object({
        walletId: z.string(),
        fixedValue: z.number().optional(),
        percentualValue: z.number().optional(),
        externalReference: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

/**
 * Schema para criação de payment avulso
 */
export const paymentSchema = z.object({
  customer: z.string().min(1, 'Customer ID é obrigatório'),
  billingType: billingTypeSchema,
  value: z.number().positive('Valor deve ser maior que zero'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  externalReference: z.string().optional(),
  installmentCount: z.number().int().min(1).max(12).optional(),
  installmentValue: z.number().positive().optional(),
  discount: z
    .object({
      value: z.number(),
      dueDateLimitDays: z.number().optional(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  fine: z
    .object({
      value: z.number(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  interest: z
    .object({
      value: z.number(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  postalService: z.boolean().optional(),
  split: z
    .array(
      z.object({
        walletId: z.string(),
        fixedValue: z.number().optional(),
        percentualValue: z.number().optional(),
      }),
    )
    .optional(),
  callback: z
    .object({
      successUrl: z.string().url(),
      autoRedirect: z.boolean().optional(),
    })
    .optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

/**
 * Eventos suportados pelo webhook Asaas
 */
export const webhookEventSchema = z.enum([
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_RESTORED',
  'PAYMENT_REFUNDED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_DUNNING_RECEIVED',
  'PAYMENT_DUNNING_REQUESTED',
  'PAYMENT_BANK_SLIP_VIEWED',
  'PAYMENT_CHECKOUT_VIEWED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_EXPIRED',
  'TRANSFER_PENDING',
  'TRANSFER_FAILED',
  'TRANSFER_DONE',
  'BILL_CREATED',
  'BILL_UPDATED',
  'BILL_PAID',
  'BILL_CANCELLED',
]);

export type WebhookEvent = z.infer<typeof webhookEventSchema>;

/**
 * Schema do payload recebido no webhook
 */
export const webhookPayloadSchema = z.object({
  id: z.string().optional(), // ID único do evento (para idempotência)
  event: webhookEventSchema,
  payment: z
    .object({
      id: z.string(),
      status: z.string(),
      value: z.number(),
      netValue: z.number().optional(),
      customer: z.string(),
      billingType: z.string(),
      dueDate: z.string(),
      paymentDate: z.string().nullable().optional(),
      subscription: z.string().optional(),
      externalReference: z.string().optional(),
      description: z.string().optional(),
      confirmedDate: z.string().nullable().optional(),
      originalValue: z.number().optional(),
      interestValue: z.number().optional(),
      fineValue: z.number().optional(),
    })
    .optional(),
  subscription: z
    .object({
      id: z.string(),
      status: z.string(),
      customer: z.string(),
      value: z.number(),
      nextDueDate: z.string(),
      cycle: z.string(),
      description: z.string().optional(),
      externalReference: z.string().optional(),
    })
    .optional(),
  transfer: z
    .object({
      id: z.string(),
      status: z.string(),
      value: z.number(),
      netValue: z.number().optional(),
      effectiveDate: z.string().nullable().optional(),
    })
    .optional(),
  bill: z
    .object({
      id: z.string(),
      status: z.string(),
      value: z.number(),
      dueDate: z.string(),
      paymentDate: z.string().nullable().optional(),
    })
    .optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

// ============================================================================
// CREDENTIALS SCHEMAS
// ============================================================================

/**
 * Schema para salvar credenciais Asaas
 */
export const asaasCredentialsSchema = z.object({
  apiKey: z.string().min(10, 'API Key inválida'),
  webhookSecret: z.string().min(32, 'Webhook secret deve ter pelo menos 32 caracteres'),
});

export type AsaasCredentialsInput = z.infer<typeof asaasCredentialsSchema>;

/**
 * Schema para salvar apenas token (API Key)
 */
export const asaasTokenSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
});

export type AsaasTokenInput = z.infer<typeof asaasTokenSchema>;
