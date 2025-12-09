/**
 * Cliente Axios para integração com API Asaas
 *
 * @see https://docs.asaas.com/reference/introducao
 */

import axios, { type AxiosInstance } from 'axios';
import { getAsaasBaseUrl, validateAsaasEnv } from './env';
import { loadDecryptedAsaasCredentials } from '../services/integracoes/asaas-credentials-service';

/**
 * Cliente HTTP configurado para comunicação com Asaas
 *
 * Configuração:
 * - Base URL: ASAAS_BASE_URL (sandbox ou produção)
 * - Autenticação: Header `access_token`
 * - Timeout: 30s
 * - Validação: Verifica variáveis de ambiente antes de criar
 */
interface ClientConfig {
  baseUrl: string;
  apiKey: string;
}

function buildClient(cfg: ClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: cfg.baseUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      access_token: cfg.apiKey,
      'User-Agent': 'Alusa/1.0',
    },
  });

  // Interceptor de request para logs (apenas em dev)
  if (process.env.NODE_ENV === 'development') {
    client.interceptors.request.use(
      (config) => {
        console.log(`[Asaas Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: Error) => {
        console.error('[Asaas Request Error]', error);
        return Promise.reject(error);
      },
    );
  }

  // Interceptor de response para tratamento de erros
  client.interceptors.response.use(
    (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Asaas Response] ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error: {
      response?: {
        status?: number;
        data?: { errors?: Array<{ description?: string }> };
      };
      message: string;
      config?: { url?: string };
    }) => {
      // Formatar erro para facilitar debug
      const errorData = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      };

      console.error('[Asaas Response Error]', errorData);

      // Re-lançar erro com informações estruturadas
      interface AsaasError extends Error {
        statusCode?: number;
        data?: unknown;
      }

      const enhancedError: AsaasError = new Error(
        `Asaas API Error: ${error.response?.data?.errors?.[0]?.description || error.message}`,
      );
      enhancedError.statusCode = error.response?.status;
      enhancedError.data = error.response?.data;

      return Promise.reject(enhancedError);
    },
  );

  return client;
}

/**
 * Instância singleton do client
 * Reutilizar para aproveitar conexões HTTP
 */
let globalClient: AxiosInstance | null = null;

/**
 * Função interna para resetar o client global (usada apenas em testes)
 */
export function __resetAsaasClientForTests() {
  globalClient = null;
}

/**
 * Client padrão baseado em variáveis de ambiente (legado / fallback)
 */
export function getAsaasClient(): AxiosInstance {
  if (!globalClient) {
    const env = validateAsaasEnv();
    globalClient = buildClient({ baseUrl: env.baseUrl, apiKey: env.apiKey });
  }
  return globalClient;
}

const perContaCache = new Map<string, AxiosInstance>();

/**
 * Obtém client com credenciais específicas da conta se existirem, senão fallback para env.
 * Cache em memória por conta para reduzir hits no banco.
 */
export async function getAsaasClientForConta(contaId: string): Promise<AxiosInstance> {
  if (perContaCache.has(contaId)) return perContaCache.get(contaId)!;

  // Verifica se a conta possui credenciais cadastradas
  const creds = await loadDecryptedAsaasCredentials(contaId).catch(() => null);
  if (creds?.apiKey) {
    const baseUrl = getAsaasBaseUrl(creds.apiKey);
    const client = buildClient({ baseUrl, apiKey: creds.apiKey });
    perContaCache.set(contaId, client);
    return client;
  }

  // Fallback para client global
  return getAsaasClient();
}

/**
 * Invalidar cache de client por conta (usar após rotação de credenciais)
 */
export function invalidateAsaasClientCache(contaId?: string) {
  if (contaId) perContaCache.delete(contaId);
}

/**
 * Verifica se a integração com Asaas está habilitada
 */
export function isAsaasEnabled(): boolean {
  return process.env.FEATURE_ASAAS === 'true';
}
