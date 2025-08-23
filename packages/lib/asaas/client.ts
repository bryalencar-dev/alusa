import 'node-fetch';

export interface AsaasChargeRequest {
  customer: string; // Asaas customer ID
  value: number; // amount in BRL
  dueDate: string; // YYYY-MM-DD
  billingType?: 'BOLETO' | 'PIX' | 'UNDEFINED';
}

export interface AsaasChargeResponse {
  id: string;
  customer: string;
  value: number;
  status: string;
  dueDate: string;
}

export interface AsaasListChargesResponse {
  data: AsaasChargeResponse[];
  totalCount: number;
  hasMore: boolean;
}

export interface ChargeInput {
  customerId: string; // internal customer id (we assume mapping already resolves to Asaas customer)
  amount: number; // decimal value in reais
  dueDate: Date;
}

export interface InternalCharge {
  externalId: string;
  customerExternalId: string;
  amount: number;
  status: string;
  dueDate: Date;
}

function getBaseUrl() {
  return process.env.ASAAS_BASE_URL || 'https://sandbox.asaas.com/api/v3';
}

function getApiKey() {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error('ASAAS_API_KEY ausente');
  return key;
}

export function isAsaasEnabled() {
  return process.env.FEATURE_ASAAS === 'true';
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: getApiKey(),
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function createCharge(customerExternalId: string, amount: number, dueDate: Date): Promise<InternalCharge> {
  const body: AsaasChargeRequest = {
    customer: customerExternalId,
    value: amount,
    dueDate: dueDate.toISOString().slice(0, 10),
    billingType: 'UNDEFINED'
  };
  const resp = await asaasFetch<AsaasChargeResponse>('/payments', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return {
    externalId: resp.id,
    customerExternalId: resp.customer,
    amount: resp.value,
    status: mapExternalStatus(resp.status),
    dueDate: new Date(resp.dueDate)
  };
}

export async function getCharges(): Promise<InternalCharge[]> {
  const resp = await asaasFetch<AsaasListChargesResponse>('/payments');
  return resp.data.map(p => ({
    externalId: p.id,
    customerExternalId: p.customer,
    amount: p.value,
    status: mapExternalStatus(p.status),
    dueDate: new Date(p.dueDate)
  }));
}

export function mapExternalStatus(status: string): string {
  switch (status) {
    case 'PENDING':
    case 'RECEIVED':
    case 'CONFIRMED':
      return 'PENDING';
    case 'RECEIVED_IN_CASH':
    case 'PAID':
      return 'PAID';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'REFUNDED':
      return 'REFUNDED';
    default:
      return 'PENDING';
  }
}