/**
 * Validação centralizada das variáveis de ambiente do Asaas
 *
 * @module asaas/env
 */

export interface AsaasEnv {
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export class AsaasEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsaasEnvError';
  }
}

/**
 * Valida e retorna as variáveis de ambiente do Asaas
 *
 * @throws {AsaasEnvError} Se alguma variável obrigatória estiver ausente
 * @returns {AsaasEnv} Variáveis validadas
 */
export function validateAsaasEnv(): AsaasEnv {
  // Log de diagnóstico das variáveis carregadas
  const envVars = {
    ASAAS_BASE_URL: process.env.ASAAS_BASE_URL,
    ASAAS_API_KEY: process.env.ASAAS_API_KEY ? '***' : undefined,
    ASAAS_WEBHOOK_SECRET: process.env.ASAAS_WEBHOOK_SECRET ? '***' : undefined,
    FEATURE_ASAAS: process.env.FEATURE_ASAAS,
  };

  console.log('[Asaas] Variáveis de ambiente carregadas:', envVars);

  const baseUrl = process.env.ASAAS_BASE_URL;
  const apiKey = process.env.ASAAS_API_KEY;
  const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
  const enabled = process.env.FEATURE_ASAAS?.toLowerCase() === 'true';

  const missing: string[] = [];
  if (!baseUrl) missing.push('ASAAS_BASE_URL não configurada');
  if (!apiKey) missing.push('ASAAS_API_KEY não configurada');
  if (!webhookSecret) missing.push('ASAAS_WEBHOOK_SECRET não configurado');

  if (missing.length) {
    throw new AsaasEnvError(missing.join('; '));
  }

  if (!apiKey!.startsWith('$aact_')) {
    console.warn('[Asaas] ⚠️  API Key não parece válida (deveria começar com $aact_)');
  }

  return {
    baseUrl: baseUrl!,
    apiKey: apiKey!,
    webhookSecret: webhookSecret!,
    enabled,
  };
}

/**
 * Verifica se a integração Asaas está habilitada (sem lançar erro)
 *
 * @returns {boolean} True se FEATURE_ASAAS=true
 */
export function isAsaasEnabled(): boolean {
  return process.env.FEATURE_ASAAS?.toLowerCase() === 'true';
}

/**
 * URLs oficiais da API Asaas conforme documentação
 * @see https://docs.asaas.com/docs/autentica%C3%A7%C3%A3o-1
 */
export const ASAAS_API_URLS = {
  SANDBOX: 'https://api-sandbox.asaas.com/v3',
  PRODUCTION: 'https://api.asaas.com/v3',
} as const;

/**
 * Detecta se a API Key é de sandbox (homologação)
 * Keys de sandbox começam com $aact_hmlg_
 * Keys de produção começam com $aact_prod_
 */
export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey.includes('_hmlg_');
}

/**
 * Retorna a URL base correta da API Asaas com base na API key
 * 
 * @param apiKey - Chave da API do Asaas
 * @returns URL base (sandbox ou produção)
 */
export function getAsaasBaseUrl(apiKey: string): string {
  return isSandboxApiKey(apiKey) ? ASAAS_API_URLS.SANDBOX : ASAAS_API_URLS.PRODUCTION;
}
