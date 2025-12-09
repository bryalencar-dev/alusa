/**
 * Service para gerenciamento de Payments (Pagamentos/Cobranças) no Asaas
 *
 * @see https://docs.asaas.com/reference/criar-nova-cobranca
 */

import { z } from 'zod';
import { getAsaasClient, getAsaasClientForConta } from './client';
import { type BillingType, billingTypeSchema } from './subscription';

/**
 * Status do pagamento
 */
export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

/**
 * Schema de validação para criação de pagamento
 */
export const createPaymentSchema = z.object({
  customer: z.string().min(1, 'Customer ID é obrigatório'),
  billingType: billingTypeSchema,
  value: z.number().positive('Valor deve ser maior que zero'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string().optional(),
  externalReference: z.string().optional(),
  installmentCount: z.number().int().positive().optional(),
  installmentValue: z.number().positive().optional(),
  discount: z
    .object({
      value: z.number().positive().optional(),
      dueDateLimitDays: z.number().int().positive().optional(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  interest: z
    .object({
      value: z.number().positive().optional(),
    })
    .optional(),
  fine: z
    .object({
      value: z.number().positive().optional(),
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
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/**
 * Resposta da API Asaas ao criar pagamento
 */
export interface AsaasPayment {
  object: 'payment';
  id: string;
  dateCreated: string;
  customer: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  dueDate: string;
  value: number;
  netValue: number;
  billingType: BillingType;
  canBePaidAfterDueDate: boolean;
  pixTransaction?: string;
  status: PaymentStatus;
  description?: string;
  externalReference?: string;
  originalValue?: number;
  interestValue?: number;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate?: string;
  estimatedCreditDate?: string;
  refunds?: unknown;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
  discount?: {
    value?: number;
    dueDateLimitDays?: number;
    type?: string;
  };
  interest?: {
    value?: number;
  };
  fine?: {
    value?: number;
  };
}

/**
 * Cria um novo pagamento (cobrança única) no Asaas
 *
 * @param input - Dados do pagamento
 * @returns Pagamento criado
 *
 * @example
 * ```ts
 * const payment = await createPayment({
 *   customer: 'cus_000000000000',
 *   value: 50.00,
 *   billingType: 'PIX',
 *   dueDate: '2025-10-10',
 *   description: 'Taxa de matrícula',
 * });
 *
 * console.log(payment.id); // 'pay_000000000000'
 * ```
 */
type PaymentRequestOptions = { contaId?: string; idempotencyKey?: string };

export async function createPayment(
  input: CreatePaymentInput,
  opts?: PaymentRequestOptions,
): Promise<AsaasPayment> {
  // Validar input
  const validated = createPaymentSchema.parse(input);

  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();
  const idempotencyKey = opts?.idempotencyKey ?? validated.externalReference;

  const response = await client.post<AsaasPayment>(
    '/payments',
    validated,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );

  return response.data;
}

/**
 * Busca um pagamento por ID
 *
 * @param paymentId - ID do pagamento no Asaas
 * @returns Pagamento encontrado
 */
export async function getPayment(
  paymentId: string,
  opts?: { contaId?: string },
): Promise<AsaasPayment> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.get<AsaasPayment>(`/payments/${paymentId}`);

  return response.data;
}

/**
 * Input para atualização de pagamento
 * @see https://docs.asaas.com/reference/atualizar-cobranca-existente
 */
export type UpdatePaymentInput = Partial<CreatePaymentInput> & {
  /**
   * Configuração de callback para redirecionamento após pagamento
   */
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
};

/**
 * Atualiza um pagamento existente
 *
 * @see PUT /v3/payments/{id} - https://docs.asaas.com/reference/atualizar-cobranca-existente
 * @param paymentId - ID do pagamento no Asaas
 * @param input - Dados para atualizar
 * @returns Pagamento atualizado
 */
export async function updatePayment(
  paymentId: string,
  input: UpdatePaymentInput,
  opts?: PaymentRequestOptions,
): Promise<AsaasPayment> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();
  const idempotencyKey = opts?.idempotencyKey ?? input.externalReference;

  // Asaas usa PUT para atualizar cobranças
  const response = await client.put<AsaasPayment>(
    `/payments/${paymentId}`,
    input,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );

  return response.data;
}

/**
 * Cancela um pagamento
 *
 * @param paymentId - ID do pagamento no Asaas
 * @returns Pagamento cancelado
 */
export async function deletePayment(
  paymentId: string,
  opts?: { contaId?: string },
): Promise<AsaasPayment> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.delete<AsaasPayment>(`/payments/${paymentId}`);

  return response.data;
}

/**
 * Lista pagamentos com filtros opcionais
 *
 * @param filters - Filtros de busca
 * @returns Lista de pagamentos
 */
export async function listPayments(filters?: {
  customer?: string;
  billingType?: BillingType;
  status?: PaymentStatus;
  subscription?: string;
  installment?: string;
  externalReference?: string;
  paymentDate?: string;
  estimatedCreditDate?: string;
  pixQrCodeId?: string;
  anticipated?: boolean;
  'dateCreated[ge]'?: string;
  'dateCreated[le]'?: string;
  'paymentDate[ge]'?: string;
  'paymentDate[le]'?: string;
  'estimatedCreditDate[ge]'?: string;
  'estimatedCreditDate[le]'?: string;
  offset?: number;
  limit?: number;
  contaId?: string;
}): Promise<{
  data: AsaasPayment[];
  totalCount: number;
  hasMore: boolean;
}> {
  const { contaId, ...rest } = filters || {};
  const client = contaId ? await getAsaasClientForConta(contaId) : getAsaasClient();

  const response = await client.get<{
    object: 'list';
    hasMore: boolean;
    totalCount: number;
    limit: number;
    offset: number;
    data: AsaasPayment[];
  }>('/payments', { params: rest });

  return {
    data: response.data.data,
    totalCount: response.data.totalCount,
    hasMore: response.data.hasMore,
  };
}

/**
 * Restaura um pagamento deletado
 *
 * @param paymentId - ID do pagamento no Asaas
 * @returns Pagamento restaurado
 */
export async function restorePayment(
  paymentId: string,
  opts?: { contaId?: string },
): Promise<AsaasPayment> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.post<AsaasPayment>(`/payments/${paymentId}/restore`);

  return response.data;
}

/**
 * Confirma recebimento em dinheiro
 *
 * @param paymentId - ID do pagamento no Asaas
 * @param paymentDate - Data do pagamento (YYYY-MM-DD)
 * @param value - Valor recebido (opcional, usa o valor da cobrança se omitido)
 * @returns Pagamento confirmado
 */
export async function confirmCashPayment(
  paymentId: string,
  paymentDate: string,
  value?: number,
  opts?: { contaId?: string },
): Promise<AsaasPayment> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.post<AsaasPayment>(`/payments/${paymentId}/receiveInCash`, {
    paymentDate,
    value,
  });

  return response.data;
}

/**
 * Desfaz confirmação de recebimento em dinheiro
 *
 * @param paymentId - ID do pagamento no Asaas
 * @returns Pagamento com confirmação desfeita
 */
export async function undoCashPayment(
  paymentId: string,
  opts?: { contaId?: string },
): Promise<AsaasPayment> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.post<AsaasPayment>(`/payments/${paymentId}/undoReceivedInCash`);

  return response.data;
}

/**
 * Recupera dados do QR Code PIX de um pagamento existente
 */
export interface PixQrCodeResponse {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

export async function getPixQrCode(
  paymentId: string,
  opts?: { contaId?: string },
): Promise<PixQrCodeResponse> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.get<PixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`);

  return response.data;
}
