/**
 * Serviço de integração com Asaas - Customer (Cliente)
 *
 * Responsável por criar e gerenciar customers no Asaas,
 * sincronizando com os dados de Aluno e Responsável da Alusa.
 */

import { loadDecryptedAsaasCredentials } from '../../asaas/credentials';
import { registrarLogIntegracao, startTimer } from '../../asaas/logIntegracao';
import { getAsaasBaseUrl, isSandboxApiKey } from '../../asaas/env';
import { applyAsaasNotificationPreferencesToCustomer } from '../../services/integracoes/asaas-notifications.service';

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string; // bairro
  city?: string;
  state?: string; // UF
  externalReference?: string; // ID do aluno/responsável na Alusa
  additionalEmails?: string;
  notificationDisabled?: boolean;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  deleted?: boolean; // Indica se o customer foi deletado no Asaas
  // ... outros campos retornados pelo Asaas
}

async function applyNotificationPreferencesSafe(contaId: string, customerId: string) {
  try {
    await applyAsaasNotificationPreferencesToCustomer(contaId, customerId);
  } catch (error) {
    console.warn('[AsaasCustomer] Falha ao aplicar preferências de notificação', {
      contaId,
      customerId,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}

/**
 * Cria um customer no Asaas.
 *
 * @param customerData - Dados do cliente (aluno ou responsável)
 * @param contaId - ID da conta Alusa (para buscar credenciais)
 * @param idempotencyKey - Chave única para evitar duplicação (ex: alunoId ou responsavelId)
 * @returns Customer criado com asaasCustomerId
 */
export async function createAsaasCustomer(
  customerData: AsaasCustomerData,
  contaId: string,
  idempotencyKey: string,
  entidade: 'ALUNO' | 'RESPONSAVEL' = 'ALUNO',
  entidadeId?: string,
): Promise<AsaasCustomerResponse> {
  const getTimer = startTimer();
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const isSandbox = isSandboxApiKey(credentials.apiKey);
  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/customers`;

  console.log('🔗 Criando customer no Asaas:', {
    name: customerData.name,
    cpfCnpj: customerData.cpfCnpj.slice(0, 3) + '***',
    externalReference: customerData.externalReference,
    sandbox: isSandbox,
    apiUrl,
  });

  const buildUpdatePayload = (): Partial<AsaasCustomerData> => {
    const entries = Object.entries({
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      mobilePhone: customerData.mobilePhone,
      postalCode: customerData.postalCode,
      address: customerData.address,
      addressNumber: customerData.addressNumber,
      complement: customerData.complement,
      province: customerData.province,
      city: customerData.city,
      state: customerData.state,
      externalReference: customerData.externalReference,
      additionalEmails: customerData.additionalEmails,
      notificationDisabled: customerData.notificationDisabled,
    }).filter(([, value]) => value !== undefined);

    return Object.fromEntries(entries) as Partial<AsaasCustomerData>;
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: credentials.apiKey,
        'User-Agent': 'Alusa-Platform/1.0',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(customerData),
    });

    const duration = getTimer();
    const rawBody = await response.text();

    const safeParse = <T>(body: string): T | null => {
      if (!body) return null;
      try {
        return JSON.parse(body) as T;
      } catch (parseErr) {
        console.warn('⚠️ Resposta inválida ao criar customer no Asaas, tentando fallback:', {
          status: response.status,
          body: body.slice(0, 200),
          error: parseErr instanceof Error ? parseErr.message : 'unknown',
        });
        return null;
      }
    };

    const parsedBody = safeParse<
      AsaasCustomerResponse | { errors?: Array<{ description?: string }> }
    >(rawBody);

    if (!response.ok) {
      const errorMessage =
        (parsedBody && 'errors' in parsedBody && parsedBody.errors?.[0]?.description) ||
        rawBody ||
        'Erro ao criar customer';

      console.error('❌ Erro ao criar customer no Asaas:', {
        status: response.status,
        body: rawBody ? rawBody.slice(0, 300) : null,
      });

      if (response.status === 409) {
        const cpfCnpjDigits = customerData.cpfCnpj.replace(/\D/g, '');
        const existingCustomer = await findAsaasCustomerByCpfCnpj(cpfCnpjDigits, contaId);

        if (existingCustomer) {
          let reusableCustomer = existingCustomer;
          const updatePayload = buildUpdatePayload();

          if (Object.keys(updatePayload).length) {
            try {
              reusableCustomer = await updateAsaasCustomer(
                existingCustomer.id,
                updatePayload,
                contaId,
              );
            } catch (updateError) {
              console.warn('⚠️ Falha ao alinhar dados do customer existente no Asaas:', {
                asaasCustomerId: existingCustomer.id,
                error:
                  updateError instanceof Error
                    ? updateError.message
                    : 'Erro desconhecido ao atualizar',
              });
            }
          }

          console.warn('⚠️ Customer já existia no Asaas, reutilizando registro:', {
            asaasCustomerId: existingCustomer.id,
            cpfCnpj: cpfCnpjDigits,
          });

          if (entidadeId) {
            await registrarLogIntegracao({
              contaId,
              tipoOperacao: 'CREATE_CUSTOMER',
              entidade,
              entidadeId,
              asaasId: reusableCustomer.id,
              status: 'SUCCESS',
              httpStatus: response.status,
              request: customerData as unknown as Record<string, unknown>,
              response: reusableCustomer as unknown as Record<string, unknown>,
              errorMessage: 'Customer já existia no Asaas',
              idempotencyKey,
              duration,
            });
          }

          await applyNotificationPreferencesSafe(contaId, reusableCustomer.id);
          return reusableCustomer;
        }
      }

      if (entidadeId) {
        await registrarLogIntegracao({
          contaId,
          tipoOperacao: 'CREATE_CUSTOMER',
          entidade,
          entidadeId,
          status: 'ERROR',
          httpStatus: response.status,
          request: customerData as unknown as Record<string, unknown>,
          response: parsedBody as unknown as Record<string, unknown>,
          errorMessage,
          idempotencyKey,
          duration,
        });
      }

      throw new Error(`Erro ao criar customer no Asaas: ${response.status} - ${errorMessage}`);
    }

    let customer = parsedBody && 'id' in parsedBody ? (parsedBody as AsaasCustomerResponse) : null;

    if (!customer) {
      // Resposta vazia ou inválida - buscar customer por CPF como fallback
      const cpfCnpjDigits = customerData.cpfCnpj.replace(/\D/g, '');
      let fallbackCustomer = await findAsaasCustomerByCpfCnpj(cpfCnpjDigits, contaId);

      if (!fallbackCustomer) {
        throw new Error(
          rawBody
            ? `Resposta inválida do Asaas ao criar customer: ${rawBody.slice(0, 200)}`
            : 'Resposta vazia do Asaas ao criar customer',
        );
      }

      const updatePayload = buildUpdatePayload();

      if (Object.keys(updatePayload).length) {
        try {
          fallbackCustomer = await updateAsaasCustomer(fallbackCustomer.id, updatePayload, contaId);
        } catch (updateError) {
          console.warn('⚠️ Falha ao alinhar dados do customer recuperado no Asaas:', {
            asaasCustomerId: fallbackCustomer.id,
            error:
              updateError instanceof Error ? updateError.message : 'Erro desconhecido ao atualizar',
          });
        }
      }

      customer = fallbackCustomer;
      console.log('ℹ️ Customer recuperado por CPF após resposta vazia do Asaas:', {
        asaasCustomerId: customer.id,
        name: customer.name,
      });
    }

    console.log('✅ Customer criado no Asaas:', {
      asaasCustomerId: customer.id,
      name: customer.name,
      statusCode: response.status,
    });

    if (entidadeId) {
      await registrarLogIntegracao({
        contaId,
        tipoOperacao: 'CREATE_CUSTOMER',
        entidade,
        entidadeId,
        asaasId: customer.id,
        status: 'SUCCESS',
        httpStatus: response.status,
        request: customerData as unknown as Record<string, unknown>,
        response: customer as unknown as Record<string, unknown>,
        idempotencyKey,
        duration,
      });
    }

    await applyNotificationPreferencesSafe(contaId, customer.id);

    return customer;
  } catch (error) {
    const duration = getTimer();

    // Log de exceção
    if (entidadeId) {
      await registrarLogIntegracao({
        contaId,
        tipoOperacao: 'CREATE_CUSTOMER',
        entidade,
        entidadeId,
        status: 'ERROR',
        request: customerData as unknown as Record<string, unknown>,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        idempotencyKey,
        duration,
      });
    }

    throw error;
  }
}

/**
 * Verifica se um customer existe no Asaas pelo ID.
 *
 * @param asaasCustomerId - ID do customer no Asaas
 * @param contaId - ID da conta Alusa
 * @returns Customer se existir e estiver ativo, null caso contrário
 */
export async function getAsaasCustomerById(
  asaasCustomerId: string,
  contaId: string,
): Promise<AsaasCustomerResponse | null> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    return null;
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/customers/${asaasCustomerId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        access_token: credentials.apiKey,
        'User-Agent': 'Alusa-Platform/1.0',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Customer ${asaasCustomerId} não encontrado no Asaas:`, response.status);
      return null;
    }

    const customer = (await response.json()) as AsaasCustomerResponse;

    // Verificar se o customer está deletado
    if (customer.deleted === true) {
      console.warn(`⚠️ Customer ${asaasCustomerId} está marcado como deletado no Asaas`);
      return null;
    }

    return customer;
  } catch (error) {
    console.error(`❌ Erro ao buscar customer ${asaasCustomerId}:`, error);
    return null;
  }
}

/**
 * Busca um customer existente no Asaas por CPF/CNPJ.
 *
 * @param cpfCnpj - CPF ou CNPJ (apenas dígitos)
 * @param contaId - ID da conta Alusa
 * @returns Customer encontrado ou null
 */
export async function findAsaasCustomerByCpfCnpj(
  cpfCnpj: string,
  contaId: string,
): Promise<AsaasCustomerResponse | null> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    return null;
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/customers`;

  const searchParams = new URLSearchParams({ cpfCnpj });
  const response = await fetch(`${apiUrl}?${searchParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
  });

  if (!response.ok) {
    console.error('❌ Erro ao buscar customer no Asaas:', response.status);
    return null;
  }

  const result = (await response.json()) as { data: AsaasCustomerResponse[]; totalCount: number };

  if (result.totalCount > 0 && result.data.length > 0) {
    return result.data[0];
  }

  return null;
}

/**
 * Atualiza um customer no Asaas.
 *
 * @param asaasCustomerId - ID do customer no Asaas
 * @param customerData - Dados atualizados
 * @param contaId - ID da conta Alusa
 * @returns Customer atualizado
 */
export async function updateAsaasCustomer(
  asaasCustomerId: string,
  customerData: Partial<AsaasCustomerData>,
  contaId: string,
): Promise<AsaasCustomerResponse> {
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/customers/${asaasCustomerId}`;

  console.log('🔗 Atualizando customer no Asaas:', {
    asaasCustomerId,
    name: customerData.name,
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: credentials.apiKey,
      'User-Agent': 'Alusa-Platform/1.0',
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('❌ Erro ao atualizar customer no Asaas:', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Erro ao atualizar customer no Asaas: ${response.status} - ${errorBody}`);
  }

  const customer = (await response.json()) as AsaasCustomerResponse;

  console.log('✅ Customer atualizado no Asaas:', {
    asaasCustomerId: customer.id,
    name: customer.name,
  });

  return customer;
}

/**
 * Exclui um customer no Asaas.
 *
 * @param asaasCustomerId - ID do customer no Asaas
 * @param contaId - ID da conta Alusa
 * @param entidade - Tipo de entidade (ALUNO ou RESPONSAVEL)
 * @param entidadeId - ID da entidade no sistema Alusa
 * @returns true se excluído com sucesso
 */
export async function deleteAsaasCustomer(
  asaasCustomerId: string,
  contaId: string,
  entidade: 'ALUNO' | 'RESPONSAVEL',
  entidadeId: string,
): Promise<boolean> {
  const getTimer = startTimer();
  const credentials = await loadDecryptedAsaasCredentials(contaId);

  if (!credentials?.apiKey) {
    throw new Error('Credenciais do Asaas não configuradas para esta conta');
  }

  const baseUrl = getAsaasBaseUrl(credentials.apiKey);
  const apiUrl = `${baseUrl}/customers/${asaasCustomerId}`;

  console.log('🗑️ Excluindo customer no Asaas:', {
    asaasCustomerId,
    entidade,
    entidadeId,
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        access_token: credentials.apiKey,
        'User-Agent': 'Alusa-Platform/1.0',
      },
    });

    const duration = getTimer();

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ Erro ao excluir customer no Asaas:', {
        status: response.status,
        body: errorBody,
      });

      // Log de erro
      await registrarLogIntegracao({
        contaId,
        tipoOperacao: 'DELETE_CUSTOMER',
        entidade,
        entidadeId,
        asaasId: asaasCustomerId,
        status: 'ERROR',
        httpStatus: response.status,
        errorMessage: errorBody || 'Erro ao excluir customer',
        duration,
      });

      return false;
    }

    console.log('✅ Customer excluído no Asaas:', {
      asaasCustomerId,
    });

    // Log de sucesso
    await registrarLogIntegracao({
      contaId,
      tipoOperacao: 'DELETE_CUSTOMER',
      entidade,
      entidadeId,
      asaasId: asaasCustomerId,
      status: 'SUCCESS',
      httpStatus: response.status,
      duration,
    });

    return true;
  } catch (error) {
    const duration = getTimer();

    // Log de exceção
    await registrarLogIntegracao({
      contaId,
      tipoOperacao: 'DELETE_CUSTOMER',
      entidade,
      entidadeId,
      asaasId: asaasCustomerId,
      status: 'ERROR',
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
      duration,
    });

    throw error;
  }
}
