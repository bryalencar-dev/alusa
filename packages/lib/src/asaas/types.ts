/**
 * Tipos TypeScript para integração Asaas
 *
 * @module asaas/types
 *
 * Define interfaces e tipos usados nos serviços e rotas Asaas.
 * Baseado na documentação oficial: https://docs.asaas.com
 */

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export interface AsaasCustomer {
  object: 'customer';
  id: string;
  dateCreated: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  cpfCnpj: string;
  personType: 'FISICA' | 'JURIDICA';
  deleted: boolean;
  additionalEmails?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  observations?: string;
  municipalInscription?: string;
  stateInscription?: string;
  canDelete: boolean;
  canEdit: boolean;
  cannotBeDeletedReason?: string;
  cannotEditReason?: string;
  foreignCustomer: boolean;
}

export interface AsaasCustomerList {
  object: 'list';
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomer[];
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'OVERDUE' | 'DELETED';

export interface AsaasSubscription {
  object: 'subscription';
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  value: number;
  netValue?: number;
  nextDueDate: string;
  cycle: string;
  description?: string;
  billingType: string;
  deleted: boolean;
  status: SubscriptionStatus;
  externalReference?: string;
  sendPaymentByPostalService: boolean;
  discount?: {
    value: number;
    limitDate?: string;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  split?: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
    externalReference?: string;
    description?: string;
  }>;
}

export interface AsaasSubscriptionList {
  object: 'list';
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasSubscription[];
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'DELETED'
  | 'AWAITING_RISK_ANALYSIS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED';

export interface AsaasPayment {
  object: 'payment';
  id: string;
  dateCreated: string;
  customer: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  billingType: string;
  confirmedDate?: string | null;
  pixTransaction?: string;
  status: PaymentStatus;
  dueDate: string;
  originalDueDate: string;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  installmentNumber?: number;
  invoiceUrl: string;
  invoiceNumber?: string;
  externalReference?: string;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  creditDate?: string;
  estimatedCreditDate?: string;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  bankSlipUrl?: string;
  lastInvoiceViewedDate?: string;
  lastBankSlipViewedDate?: string;
  discount?: {
    value: number;
    limitDate?: string;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  postalService: boolean;
  split?: Array<{
    id: string;
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
    status: string;
    externalReference?: string;
  }>;
  chargeback?: {
    status: string;
    reason: string;
  };
  refunds?: Array<{
    dateCreated: string;
    status: string;
    value: number;
    description?: string;
  }>;
}

export interface AsaasPaymentList {
  object: 'list';
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasPayment[];
}

/**
 * Informações do QR Code PIX
 */
export interface AsaasPixInfo {
  encodedImage: string; // Base64 da imagem do QR Code
  payload: string; // String de copiar e colar
  expirationDate: string;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookEventData {
  id: string; // ID único do evento
  event: string;
  dateCreated?: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
  transfer?: {
    id: string;
    status: string;
    value: number;
    netValue?: number;
    effectiveDate?: string | null;
  };
  bill?: {
    id: string;
    status: string;
    value: number;
    dueDate: string;
    paymentDate?: string | null;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AsaasError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

export interface AsaasErrorResponse extends Error {
  statusCode?: number;
  data?: AsaasError;
}

// ============================================================================
// CREDENTIALS TYPES
// ============================================================================

export interface AsaasCredentials {
  apiKey?: string;
  webhookSecret?: string;
}

export interface AsaasCredentialsMasked {
  apiKeyMasked: string | null;
  webhookSecretMasked?: string | null;
  updatedAt: Date | null;
}

// ============================================================================
// SERVICE OPTIONS
// ============================================================================

/**
 * Opções para operações que suportam multi-tenancy
 */
export interface AsaasServiceOptions {
  contaId?: string; // ID da conta (para credenciais específicas)
}

/**
 * Opções para listagem paginada
 */
export interface AsaasListOptions extends AsaasServiceOptions {
  offset?: number;
  limit?: number;
}

/**
 * Opções para filtros de customer
 */
export interface AsaasCustomerFilters extends AsaasListOptions {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  groupName?: string;
  externalReference?: string;
}

/**
 * Opções para filtros de subscription
 */
export interface AsaasSubscriptionFilters extends AsaasListOptions {
  customer?: string;
  status?: SubscriptionStatus;
  billingType?: string;
  externalReference?: string;
}

/**
 * Opções para filtros de payment
 */
export interface AsaasPaymentFilters extends AsaasListOptions {
  customer?: string;
  subscription?: string;
  status?: PaymentStatus;
  billingType?: string;
  dateCreatedGe?: string; // >=
  dateCreatedLe?: string; // <=
  paymentDateGe?: string;
  paymentDateLe?: string;
  estimatedCreditDateGe?: string;
  estimatedCreditDateLe?: string;
  externalReference?: string;
}
