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

  // Validações
  if (!enabled) {
    throw new AsaasEnvError(
      'Integração Asaas desabilitada. Configure FEATURE_ASAAS=true em apps/web/.env.local',
    );
  }

  if (!baseUrl) {
    throw new AsaasEnvError(
      'ASAAS_BASE_URL não configurada. Adicione em apps/web/.env.local:\n' +
        'ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3',
    );
  }

  if (!apiKey) {
    throw new AsaasEnvError(
      'ASAAS_API_KEY não configurada. Adicione em apps/web/.env.local:\n' +
        'ASAAS_API_KEY=sua_chave_sandbox_aqui\n\n' +
        '💡 Obtenha sua chave em: https://sandbox.asaas.com > Integrações > API Key',
    );
  }

  if (!webhookSecret) {
    throw new AsaasEnvError(
      'ASAAS_WEBHOOK_SECRET não configurado. Adicione em apps/web/.env.local:\n' +
        'ASAAS_WEBHOOK_SECRET=seu_segredo_webhook\n\n' +
        '💡 Gere com: openssl rand -hex 32',
    );
  }

  // Validação do formato da API Key
  if (!apiKey.startsWith('$aact_')) {
    console.warn('[Asaas] ⚠️  API Key não parece válida (deveria começar com $aact_)');
  }

  return {
    baseUrl,
    apiKey,
    webhookSecret,
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
