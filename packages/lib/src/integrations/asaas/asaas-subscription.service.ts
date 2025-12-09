/**
 * Serviço de integração com Asaas - Subscription (Assinatura Recorrente)
 *
 * Responsável por criar e gerenciar assinaturas no Asaas,
 * sincronizando com as matrículas da Alusa.
 */

import { loadDecryptedAsaasCredentials } from '../../asaas/credentials';
import { getAsaasBaseUrl, isSandboxApiKey } from '../../asaas/env';
import { PeriodicidadePlano } from '@prisma/client';

/**
 * Mapeia periodicidade do plano Alusa para ciclo Asaas
 */
function mapPeriodicidadeToCycle(
  periodicidade: PeriodicidadePlano,
): 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' {
  const map: Record<
    PeriodicidadePlano,
    'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  > = {
    SEMANAL: 'WEEKLY',
    QUINZENAL: 'BIWEEKLY',
    MENSAL: 'MONTHLY',
    TRIMESTRAL: 'QUARTERLY',
    ANUAL: 'YEARLY',
  };

  return map[periodicidade] || 'MONTHLY';
}

/**
 * Mapeia forma de pagamento Alusa para billingType Asaas
 */
function mapFormaPagamentoToBillingType(
  formaPagamento: 'PIX' | 'CARTAO' | 'BOLETO' | 'DINHEIRO',
): 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED' {
  const map: Record<string, 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'UNDEFINED'> = {
    PIX: 'PIX',
    CARTAO: 'CREDIT_CARD',
    BOLETO: 'BOLETO',
    DINHEIRO: 'UNDEFINED', // Dinheiro não é suportado em assinaturas
  };

  return map[formaPagamento] || 'BOLETO';
}

export interface AsaasSubscriptionData {
  customer: string; // asaasCustomerId
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description: string;
  endDate?: string; // YYYY-MM-DD (opcional, data fim da assinatura)
  externalReference?: string; // ID da matrícula na Alusa
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number; // Juros mensal (%)
  };
  fine?: {
    value: number; // Multa (%)
  };
  maxPayments?: number; // Número máximo de cobranças (opcional)
}

export interface AsaasSubscriptionResponse {
  object: 'subscription';
  id: string;
  dateCreated: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string;
  billingType: string;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  externalReference?: string;
  deleted: boolean;
  endDate?: string;
  maxPayments?: number;
  // ... outros campos
}

/**
 * Cria uma subscription no Asaas.
 *
 * @param subscriptionData - Dados da assinatura (matrícula)
 * @param contaId - ID da conta Alusa (para buscar credenciais)
 * @param idempotencyKey - Chave única para evitar duplicação (ex: matriculaId)
 * @returns Subscription criada com asaasSubscriptionId
 */
export async function createAsaasSubscription(
  subscriptionData: AsaasSubscriptionData,
  contaId: string,
  idempotencyKey: string,
): Promise<AsaasSubscriptionResponse> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const isSandbox = isSandboxApiKey(credentials.apiKey);
  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/subscriptions`;

  console.log('🔗 Criando subscription no Asaas:', {
    customer: subscriptionData.customer,
    value: subscriptionData.value,
    cycle: subscriptionData.cycle,
    billingType: subscriptionData.billingType,
    externalReference: subscriptionData.externalReference,
    sandbox: isSandbox,
    apiUrl,
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Erro ao criar subscription no Asaas:', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Erro ao criar subscription no Asaas: ${response.status} - ${errorBody}`);
  }

  const subscription = (await response.json()) as AsaasSubscriptionResponse;

  console.log('✅ Subscription criada no Asaas:', {
    asaasSubscriptionId: subscription.id,
    customer: subscription.customer,
    value: subscription.value,
    status: subscription.status,
  });

  return subscription;
}

/**
 * Busca uma subscription no Asaas por ID.
 *
 * @param asaasSubscriptionId - ID da subscription no Asaas
 * @param contaId - ID da conta Alusa
 * @returns Subscription encontrada ou null
 */
export async function getAsaasSubscription(
  asaasSubscriptionId: string,
  contaId: string,
): Promise<AsaasSubscriptionResponse | null> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    return null;
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/subscriptions/${asaasSubscriptionId}`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
  });

  if (!response.ok) {
    console.error('❌ Erro ao buscar subscription no Asaas:', response.status);
    return null;
  }

  const subscription = (await response.json()) as AsaasSubscriptionResponse;
  return subscription;
}

/**
 * Atualiza uma subscription no Asaas.
 *
 * @param asaasSubscriptionId - ID da subscription no Asaas
 * @param subscriptionData - Dados atualizados
 * @param contaId - ID da conta Alusa
 * @returns Subscription atualizada
 */
export async function updateAsaasSubscription(
  asaasSubscriptionId: string,
  subscriptionData: Partial<AsaasSubscriptionData>,
  contaId: string,
): Promise<AsaasSubscriptionResponse> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/subscriptions/${asaasSubscriptionId}`;

  console.log('🔗 Atualizando subscription no Asaas:', {
    asaasSubscriptionId,
    updates: Object.keys(subscriptionData),
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
    body: JSON.stringify(subscriptionData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Erro ao atualizar subscription no Asaas:', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Erro ao atualizar subscription no Asaas: ${response.status} - ${errorBody}`);
  }

  const subscription = (await response.json()) as AsaasSubscriptionResponse;

  console.log('✅ Subscription atualizada no Asaas:', {
    asaasSubscriptionId: subscription.id,
    status: subscription.status,
  });

  return subscription;
}

/**
 * Cancela uma subscription no Asaas (soft delete).
 *
 * @param asaasSubscriptionId - ID da subscription no Asaas
 * @param contaId - ID da conta Alusa
 */
export async function cancelAsaasSubscription(
  asaasSubscriptionId: string,
  contaId: string,
): Promise<void> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/subscriptions/${asaasSubscriptionId}`;

  console.log('🗑️ Cancelando subscription no Asaas:', { asaasSubscriptionId });

  const response = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Erro ao cancelar subscription no Asaas:', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Erro ao cancelar subscription no Asaas: ${response.status} - ${errorBody}`);
  }

  console.log('✅ Subscription cancelada no Asaas:', { asaasSubscriptionId });
}

/**
 * Lista payments (cobranças) de uma subscription.
 *
 * @param asaasSubscriptionId - ID da subscription no Asaas
 * @param contaId - ID da conta Alusa
 * @returns Lista de payments
 */
export async function listAsaasSubscriptionPayments(
  asaasSubscriptionId: string,
  contaId: string,
): Promise<Array<{ id: string; status: string; dueDate: string; value: number }>> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/subscriptions/${asaasSubscriptionId}/payments`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
  });

  if (!response.ok) {
    console.error('❌ Erro ao listar payments da subscription no Asaas:', response.status);
    return [];
  }

  const result = (await response.json()) as {
    data: Array<{ id: string; status: string; dueDate: string; value: number }>;
  };

  return result.data || [];
}

export { mapPeriodicidadeToCycle, mapFormaPagamentoToBillingType };
