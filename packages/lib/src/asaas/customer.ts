/**
 * Service para gerenciamento de Customers (Clientes) no Asaas
 *
 * @see https://docs.asaas.com/reference/criar-novo-cliente
 */

import { z } from 'zod';
import { getAsaasClient, getAsaasClientForConta } from './client';

/**
 * Schema de validação para criação de customer
 */
export const createCustomerSchema = z.object({
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

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/**
 * Resposta da API Asaas ao criar customer
 */
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
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
}

/**
 * Cria um novo customer no Asaas
 *
 * @param input - Dados do customer
 * @returns Customer criado
 *
 * @example
 * ```ts
 * const customer = await createCustomer({
 *   name: 'João Silva',
 *   cpfCnpj: '12345678901',
 *   email: 'joao@example.com',
 *   phone: '11987654321',
 * });
 *
 * console.log(customer.id); // 'cus_000000000000'
 * ```
 */
type CustomerRequestOptions = { contaId?: string; idempotencyKey?: string };

export async function createCustomer(
  input: CreateCustomerInput,
  opts?: CustomerRequestOptions,
): Promise<AsaasCustomer> {
  // Validar input
  const validated = createCustomerSchema.parse(input);

  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();
  const idempotencyKey = opts?.idempotencyKey ?? validated.externalReference ?? validated.cpfCnpj;

  const response = await client.post<AsaasCustomer>(
    '/customers',
    validated,
    idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
  );

  return response.data;
}

/**
 * Busca um customer por ID
 *
 * @param customerId - ID do customer no Asaas
 * @returns Customer encontrado
 */
export async function getCustomer(
  customerId: string,
  opts?: CustomerRequestOptions,
): Promise<AsaasCustomer> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.get<AsaasCustomer>(`/customers/${customerId}`);

  return response.data;
}

/**
 * Atualiza um customer existente
 *
 * @param customerId - ID do customer no Asaas
 * @param input - Dados para atualizar
 * @returns Customer atualizado
 */
export async function updateCustomer(
  customerId: string,
  input: Partial<CreateCustomerInput>,
  opts?: CustomerRequestOptions,
): Promise<AsaasCustomer> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.post<AsaasCustomer>(`/customers/${customerId}`, input);

  return response.data;
}

/**
 * Deleta um customer (soft delete)
 *
 * @param customerId - ID do customer no Asaas
 * @returns Customer deletado
 */
export async function deleteCustomer(
  customerId: string,
  opts?: CustomerRequestOptions,
): Promise<AsaasCustomer> {
  const client = opts?.contaId ? await getAsaasClientForConta(opts.contaId) : getAsaasClient();

  const response = await client.delete<AsaasCustomer>(`/customers/${customerId}`);

  return response.data;
}

/**
 * Lista customers com filtros opcionais
 *
 * @param filters - Filtros de busca
 * @returns Lista de customers
 */
export async function listCustomers(filters?: {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  groupName?: string;
  externalReference?: string;
  offset?: number;
  limit?: number;
  contaId?: string;
}): Promise<{ data: AsaasCustomer[]; totalCount: number; hasMore: boolean }> {
  const { contaId, ...rest } = filters || {};
  const client = contaId ? await getAsaasClientForConta(contaId) : getAsaasClient();

  const response = await client.get<{
    object: 'list';
    hasMore: boolean;
    totalCount: number;
    limit: number;
    offset: number;
    data: AsaasCustomer[];
  }>('/customers', { params: rest });

  return {
    data: response.data.data,
    totalCount: response.data.totalCount,
    hasMore: response.data.hasMore,
  };
}
