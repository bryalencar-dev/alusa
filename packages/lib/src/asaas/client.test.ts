/**
 * Testes unitários para o cliente Asaas
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAsaasClient, isAsaasEnabled } from './client';

describe('Asaas Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env para cada teste
    process.env = { ...originalEnv };
    process.env.ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3';
    process.env.ASAAS_API_KEY = 'test_api_key_12345';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getAsaasClient', () => {
    it('deve criar client com configuração correta', () => {
      const client = getAsaasClient();

      expect(client.defaults.baseURL).toBe('https://sandbox.asaas.com/api/v3');
      expect(client.defaults.headers['access_token']).toBe('test_api_key_12345');
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
      expect(client.defaults.headers['User-Agent']).toBe('Alusa/1.0');
      expect(client.defaults.timeout).toBe(30000);
    });

    it('deve lançar erro se ASAAS_BASE_URL não configurada', () => {
      delete process.env.ASAAS_BASE_URL;

      expect(() => getAsaasClient()).toThrow('ASAAS_BASE_URL não configurada');
    });

    it('deve lançar erro se ASAAS_API_KEY não configurada', () => {
      delete process.env.ASAAS_API_KEY;

      expect(() => getAsaasClient()).toThrow('ASAAS_API_KEY não configurada');
    });
  });

  describe('isAsaasEnabled', () => {
    it('deve retornar true quando FEATURE_ASAAS=true', () => {
      process.env.FEATURE_ASAAS = 'true';

      expect(isAsaasEnabled()).toBe(true);
    });

    it('deve retornar false quando FEATURE_ASAAS=false', () => {
      process.env.FEATURE_ASAAS = 'false';

      expect(isAsaasEnabled()).toBe(false);
    });

    it('deve retornar false quando FEATURE_ASAAS não está definida', () => {
      delete process.env.FEATURE_ASAAS;

      expect(isAsaasEnabled()).toBe(false);
    });
  });
});
