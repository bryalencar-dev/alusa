import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@alusa/lib';
import {
  saveAsaasCredentials,
  getAsaasCredentials,
  loadDecryptedAsaasCredentials,
} from '@alusa/lib';

let contaId: string;

describe('AsaasCredentialsService', () => {
  beforeAll(async () => {
    const conta = await prisma.conta.create({
      data: {
        nome: 'Conta Test Credenciais',
        cpfCnpj: '11122233344455',
        status: 'ATIVO',
      },
    });
    contaId = conta.id;
  });

  it('salva e recupera credenciais mascaradas', async () => {
    await saveAsaasCredentials(contaId, {
      apiKey: 'sk_test_1234567890abcdef',
      webhookSecret: 'whsec_abcdef1234567890',
    });
    const masked = await getAsaasCredentials(contaId);
    expect(masked.apiKeyMasked).toBeTruthy();
    expect(masked.webhookSecretMasked).toBeTruthy();
    expect(masked.apiKeyMasked?.startsWith('sk_')).toBe(true);
  });

  it('retorna descriptografado para uso interno', async () => {
    const raw = await loadDecryptedAsaasCredentials(contaId);
    expect(raw).toBeTruthy();
    expect(raw?.apiKey).toContain('sk_test_');
  });
});
