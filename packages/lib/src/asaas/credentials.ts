/**
 * Gerenciamento de Credenciais Asaas
 *
 * @module asaas/credentials
 *
 * Responsável por armazenar, recuperar e validar credenciais Asaas
 * de forma segura, com suporte a criptografia e multi-tenancy.
 */

import { prisma } from '../prisma';
import { encryptSecret, decryptSecret } from '../security/encryption';
import { maskSecret } from './utils';
import type { AsaasCredentials, AsaasCredentialsMasked } from './types';
import { asaasCredentialsSchema, asaasTokenSchema } from './schemas';

// ============================================================================
// SAVE CREDENTIALS
// ============================================================================

/**
 * Salva credenciais completas do Asaas (API Key + Webhook Secret)
 *
 * @param contaId - ID da conta
 * @param input - Credenciais (apiKey e webhookSecret)
 *
 * @throws {Error} Se apiKey ou webhookSecret estiverem vazios
 *
 * @example
 * ```ts
 * await saveAsaasCredentials('conta-123', {
 *   apiKey: '$aact_hmlg_abc123...',
 *   webhookSecret: 'whsec_xyz789...'
 * });
 * ```
 */
export async function saveAsaasCredentials(
  contaId: string,
  input: { apiKey: string; webhookSecret: string },
): Promise<void> {
  // Validação com Zod
  const validated = asaasCredentialsSchema.parse(input);

  const apiKeyEncrypted = encryptSecret(validated.apiKey.trim());
  const webhookEncrypted = encryptSecret(validated.webhookSecret.trim());

  await prisma.conta.update({
    where: { id: contaId },
    data: {
      asaasApiKeyEncrypted: apiKeyEncrypted,
      asaasWebhookSecretEncrypted: webhookEncrypted,
      asaasCredsUpdatedAt: new Date(),
    },
  });

  console.log(`[Asaas] Credenciais salvas para conta ${contaId}`);
}

/**
 * Salva apenas o token de API (API Key) sem webhook secret
 *
 * Útil para rotação de chaves ou configuração inicial simplificada
 *
 * @param contaId - ID da conta
 * @param token - API Key do Asaas
 */
export async function saveAsaasTokenOnly(contaId: string, token: string): Promise<void> {
  const validated = asaasTokenSchema.parse({ token });

  const apiKeyEncrypted = encryptSecret(validated.token.trim());

  await prisma.conta.update({
    where: { id: contaId },
    data: {
      asaasApiKeyEncrypted: apiKeyEncrypted,
      asaasCredsUpdatedAt: new Date(),
    },
  });

  console.log(`[Asaas] Token atualizado para conta ${contaId}`);
}

// ============================================================================
// RETRIEVE CREDENTIALS
// ============================================================================

/**
 * Recupera credenciais mascaradas (para exibição)
 *
 * @param contaId - ID da conta
 * @returns Credenciais mascaradas com data de atualização
 *
 * @throws {Error} Se conta não for encontrada
 */
export async function getAsaasCredentials(contaId: string): Promise<AsaasCredentialsMasked> {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    select: {
      asaasApiKeyEncrypted: true,
      asaasWebhookSecretEncrypted: true,
      asaasCredsUpdatedAt: true,
    },
  });

  if (!conta) {
    throw new Error('Conta não encontrada');
  }

  return {
    apiKeyMasked: maskSecret(decryptSecret(conta.asaasApiKeyEncrypted)),
    webhookSecretMasked: maskSecret(decryptSecret(conta.asaasWebhookSecretEncrypted)),
    updatedAt: conta.asaasCredsUpdatedAt,
  };
}

/**
 * Recupera credenciais descriptografadas (para uso interno)
 *
 * ⚠️ Cuidado: Retorna valores sensíveis sem máscara
 *
 * @param contaId - ID da conta
 * @returns Credenciais descriptografadas ou null se não existirem
 */
export async function loadDecryptedAsaasCredentials(
  contaId: string,
): Promise<AsaasCredentials | null> {
  const conta = await prisma.conta.findUnique({
    where: { id: contaId },
    select: {
      asaasApiKeyEncrypted: true,
      asaasWebhookSecretEncrypted: true,
    },
  });

  if (!conta) return null;

  const apiKey = decryptSecret(conta.asaasApiKeyEncrypted) || undefined;
  const webhookSecret = decryptSecret(conta.asaasWebhookSecretEncrypted) || undefined;

  // Retorna null se não houver nenhuma credencial configurada
  if (!apiKey && !webhookSecret) return null;

  return { apiKey, webhookSecret };
}

// ============================================================================
// DELETE CREDENTIALS
// ============================================================================

/**
 * Remove credenciais Asaas de uma conta
 *
 * @param contaId - ID da conta
 */
export async function deleteAsaasCredentials(contaId: string): Promise<void> {
  await prisma.conta.update({
    where: { id: contaId },
    data: {
      asaasApiKeyEncrypted: null,
      asaasWebhookSecretEncrypted: null,
      asaasCredsUpdatedAt: null,
    },
  });

  console.log(`[Asaas] Credenciais removidas da conta ${contaId}`);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Verifica se uma conta possui credenciais Asaas configuradas
 *
 * @param contaId - ID da conta
 * @returns true se possui credenciais válidas
 */
export async function hasAsaasCredentials(contaId: string): Promise<boolean> {
  const creds = await loadDecryptedAsaasCredentials(contaId);
  return creds !== null && !!creds.apiKey;
}
