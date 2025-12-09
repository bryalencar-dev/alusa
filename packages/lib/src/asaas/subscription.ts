/**
 * Service para gerenciamento de Subscriptions (Assinaturas) no Asaas
 *
 * @see https://docs.asaas.com/reference/criar-nova-assinatura
 */

import { z } from 'zod';
import { getAsaasClient, getAsaasClientForConta } from './client';

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
 * Status da assinatura
 */
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'OVERDUE' | 'DELETED';

/**
 * Schema de validação para criação de subscription
 */
export const createSubscriptionSchema = z.object({
  customer: z.string().min(1, 'Customer ID é obrigatório'),
  billingType: billingTypeSchema,
  value: z.number().positive('Valor deve ser maior que zero'),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  cycle: cycleSchema.default('MONTHLY'),
  description: z.string().optional(),
  dueDateLimitDays: z.number().int().min(0).optional(),
  discount: z
    .object({
      value: z.number().positive().optional(),
      dueDateLimitDays: z.number().int().min(0).optional(),
      type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    })
    .optional(),
  interest: z
    .object({
      value: z.number().min(0).optional(),
    })
    .optional(),
  fine: z
    .object({
      value: z.number().min(0).optional(),
    })
    .optional(),
  externalReference: z.string().optional(),
  maxPayments: z.number().int().positive().optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

/**
 * Input para atualização de subscription
 * @see https://docs.asaas.com/docs/criando-uma-assinatura
 */
export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput> & {
  status?: SubscriptionStatus;
  /**
   * Se true, atualiza também as cobranças pendentes (não pagas) da assinatura
   * @see POST /v3/subscriptions/{id} - updatePendingPayments
   */
  updatePendingPayments?: boolean;
};

/**
 * Resposta da API Asaas ao criar subscription
 */
export interface AsaasSubscription {
  object: 'subscription';
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  billingType: BillingType;
  cycle: Cycle;
  value: number;
  nextDueDate: string;
  description?: string;
  dueDateLimitDays?: number;
  endDate?: string;
  maxPayments?: number;
  status: SubscriptionStatus;
  externalReference?: string;
  discount?: {
    value?: number;
    dueDateLimitDays?: number;
  };
  interest?: {
    value?: number;
  };
  fine?: {
    value?: number;
  };
  split?: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
  }>;
  deleted: boolean;
}

/**
 * Cria uma nova subscription (assinatura recorrente) no Asaas
 *
 * @param input - Dados da subscription
 * @returns Subscription criada
 *
 * @example
 * ```ts
 * const subscription = await createSubscription({
 *   customer: 'cus_000000000000',
 *   value: 199.90,
 *   billingType: 'BOLETO',
 *   nextDueDate: '2025-10-05',
 *   cycle: 'MONTHLY',
 *   description: 'Mensalidade Ballet Iniciante',
 * });
 *
 * console.log(subscription.id); // 'sub_000000000000'
 * ```
 */
export async function createSubscription(
  input: CreateSubscriptionInput,
  opts?: { contaId?: string; idempotencyKey?: string },
): Promise<AsaasSubscription> {
  // Validar input
  const validated = createSubscriptionSchema.parse(input);

  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();
  const idempotencyKey = opts?.idempotencyKey ?? validated.externalReference;

  const response = await client.post<AsaasSubscription>(
    '/subscriptions',
    validated,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );

  return response.data;
}

/**
 * Busca uma subscription por ID
 *
 * @param subscriptionId - ID da subscription no Asaas
 * @returns Subscription encontrada
 */
export async function getSubscription(
  subscriptionId: string,
  opts?: { contaId?: string },
): Promise<AsaasSubscription> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.get<AsaasSubscription>(`/subscriptions/${subscriptionId}`);

  return response.data;
}

/**
 * Atualiza uma subscription existente
 *
 * @param subscriptionId - ID da subscription no Asaas
 * @param input - Dados para atualizar
 * @returns Subscription atualizada
 *
 * @see https://docs.asaas.com/reference/atualizar-assinatura-existente
 *
 * @remarks
 * - Use `status: 'INACTIVE'` para suspender a assinatura (para de gerar cobranças)
 * - Use `status: 'ACTIVE'` + `nextDueDate` para reativar (obrigatório informar nextDueDate)
 * - Use `updatePendingPayments: true` para aplicar alterações às cobranças já geradas mas não pagas
 */
export async function updateSubscription(
  subscriptionId: string,
  input: UpdateSubscriptionInput,
  opts?: { contaId?: string },
): Promise<AsaasSubscription> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  // Asaas atualiza assinaturas via POST /subscriptions/{id}
  const response = await client.post<AsaasSubscription>(`/subscriptions/${subscriptionId}`, input);

  return response.data;
}

const nextDueDateSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

/**
 * Inativa (suspende) uma assinatura no Asaas
 *
 * @param subscriptionId - ID da subscription no Asaas
 * @param opts - Opções adicionais
 * @returns Subscription inativada
 *
 * @see https://docs.asaas.com/reference/atualizar-assinatura-existente
 *
 * @remarks
 * - A assinatura para de gerar novas cobranças enquanto estiver INACTIVE
 * - Cobranças já geradas não são afetadas
 * - Para reativar, use `reactivateSubscription` com uma nova `nextDueDate`
 */
export async function inactivateSubscription(
  subscriptionId: string,
  opts?: { contaId?: string },
): Promise<AsaasSubscription> {
  return updateSubscription(subscriptionId, { status: 'INACTIVE' }, opts);
}

/**
 * Reativa uma assinatura previamente inativada no Asaas
 *
 * @param subscriptionId - ID da subscription no Asaas
 * @param nextDueDate - Data do próximo vencimento (obrigatório ao reativar)
 * @param opts - Opções adicionais
 * @returns Subscription reativada
 *
 * @see https://docs.asaas.com/reference/atualizar-assinatura-existente
 *
 * @remarks
 * - Ao retomar uma assinatura, é OBRIGATÓRIO informar nextDueDate
 * - A assinatura volta a gerar cobranças a partir da nextDueDate
 */
export async function reactivateSubscription(
  subscriptionId: string,
  nextDueDate: string,
  opts?: { contaId?: string },
): Promise<AsaasSubscription> {
  const parsedNextDueDate = nextDueDateSchema.parse(nextDueDate);

  return updateSubscription(
    subscriptionId,
    {
      status: 'ACTIVE',
      nextDueDate: parsedNextDueDate,
    },
    opts,
  );
}

/**
 * Remove (deleta) uma assinatura do Asaas
 *
 * @param subscriptionId - ID da subscription no Asaas
 * @param opts - Opções adicionais
 * @returns Subscription deletada
 *
 * @see https://docs.asaas.com/reference/remover-assinatura
 *
 * @remarks
 * - ATENÇÃO: Ao remover uma assinatura, as mensalidades aguardando pagamento
 *   ou vencidas também são removidas automaticamente
 * - Esta ação é IRREVERSÍVEL
 * - Use `inactivateSubscription` se quiser apenas pausar temporariamente
 */
export async function deleteSubscription(
  subscriptionId: string,
  opts?: { contaId?: string },
): Promise<AsaasSubscription> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.delete<AsaasSubscription>(`/subscriptions/${subscriptionId}`);

  return response.data;
}

/**
 * Lista subscriptions com filtros opcionais
 *
 * @param filters - Filtros de busca
 * @returns Lista de subscriptions
 */
export async function listSubscriptions(filters?: {
  customer?: string;
  billingType?: BillingType;
  status?: SubscriptionStatus;
  deletedOnly?: boolean;
  includeDeleted?: boolean;
  externalReference?: string;
  offset?: number;
  limit?: number;
  contaId?: string;
}): Promise<{
  data: AsaasSubscription[];
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
    data: AsaasSubscription[];
  }>('/subscriptions', { params: rest });

  return {
    data: response.data.data,
    totalCount: response.data.totalCount,
    hasMore: response.data.hasMore,
  };
}

/**
 * Lista os pagamentos (invoices) de uma subscription
 *
 * @param subscriptionId - ID da subscription
 * @param filters - Filtros opcionais
 * @returns Lista de pagamentos
 */
export async function listSubscriptionPayments(
  subscriptionId: string,
  filters?: {
    status?: string;
    offset?: number;
    limit?: number;
    contaId?: string;
  },
): Promise<{
  data: Array<{
    id: string;
    status: string;
    value: number;
    netValue: number;
    dueDate: string;
    description?: string;
    billingType: BillingType;
  }>;
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
    data: Array<{
      id: string;
      status: string;
      value: number;
      netValue: number;
      dueDate: string;
      description?: string;
      billingType: BillingType;
    }>;
  }>(`/subscriptions/${subscriptionId}/payments`, { params: rest });

  return {
    data: response.data.data,
    totalCount: response.data.totalCount,
    hasMore: response.data.hasMore,
  };
}
