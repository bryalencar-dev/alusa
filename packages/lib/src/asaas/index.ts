/**
 * Módulo de integração com Asaas (Pagamentos)
 *
 * @module @alusa/lib/asaas
 *
 * @example
 * ```ts
 * import { createCustomer, createSubscription } from '@alusa/lib/asaas';
 *
 * // Criar customer
 * const customer = await createCustomer({
 *   name: 'João Silva',
 *   cpfCnpj: '12345678901',
 *   email: 'joao@example.com',
 * });
 *
 * // Criar assinatura recorrente
 * const subscription = await createSubscription({
 *   customer: customer.id,
 *   value: 199.90,
 *   billingType: 'BOLETO',
 *   nextDueDate: '2025-10-05',
 *   cycle: 'MONTHLY',
 * });
 * ```
 */

// Client
export { getAsaasClient } from './client';
export { getAsaasClientForConta, invalidateAsaasClientCache } from './client';

// Environment validation
export { validateAsaasEnv, isAsaasEnabled, AsaasEnvError, getAsaasBaseUrl, isSandboxApiKey, ASAAS_API_URLS } from './env';
export type { AsaasEnv } from './env';

// Customer
export {
  createCustomer,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  listCustomers,
  createCustomerSchema,
  type CreateCustomerInput,
  type AsaasCustomer,
} from './customer';

// Subscription
export {
  createSubscription,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  listSubscriptions,
  listSubscriptionPayments,
  inactivateSubscription,
  reactivateSubscription,
  createSubscriptionSchema,
  billingTypeSchema,
  cycleSchema,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
  type AsaasSubscription,
  type BillingType,
  type Cycle,
  type SubscriptionStatus,
} from './subscription';

// Payment
export {
  createPayment,
  getPayment,
  updatePayment,
  deletePayment,
  listPayments,
  restorePayment,
  confirmCashPayment,
  undoCashPayment,
  getPixQrCode,
  createPaymentSchema,
  type CreatePaymentInput,
  type AsaasPayment,
  type PaymentStatus,
  type PixQrCodeResponse,
} from './payment';

// Financeiro service helpers
export {
  deleteCobranca,
  pauseAssinatura,
  reenviarCobranca,
  gerarSegundaVia,
  refundCobranca,
  confirmarPagamentoManual,
  reativarAssinatura,
} from './financeiroService';

export type {
  DeleteCobrancaInput,
  PauseAssinaturaInput,
  ReenviarCobrancaInput,
  GerarSegundaViaInput,
  RefundCobrancaInput,
  ConfirmarPagamentoManualInput,
  ReativarAssinaturaInput,
  FinanceiroActionResponse,
  SegundaViaResponse,
} from './financeiroService';

// Utility functions
export {
  formatDate,
  getCurrentBrasiliaDate,
  calcularProximoVencimento,
  mapPaymentStatus,
} from './utils';
export { registrarLogFinanceiro, type AcaoFinanceira } from './logFinanceiro';

// Payment helpers
export { createAvulsaPayment, getAvulsaPaymentData } from './payment-helpers';
export type { AvulsaPaymentInput, AvulsaPaymentResult } from './payment-helpers';
