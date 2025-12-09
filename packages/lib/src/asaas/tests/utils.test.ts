/**
 * Testes unitários - Utilities Asaas
 *
 * @group unit
 * @module asaas/tests
 */

import { describe, it, expect } from 'vitest';
import {
  mapPaymentStatus,
  mapSubscriptionStatus,
  isPaymentPaid,
  isPaymentPending,
  isSubscriptionActive,
  sanitizeCpfCnpj,
  sanitizePhone,
  sanitizeCep,
  formatCurrency,
  formatDate,
  calcularProximoVencimento,
  isValidCpf,
  isValidCnpj,
  isValidCpfCnpj,
  generateIdempotencyKey,
  extractWebhookEventId,
  formatAsaasError,
  maskSecret,
} from '../utils';

describe('Asaas Utils - Status Mapping', () => {
  describe('mapPaymentStatus', () => {
    it('deve mapear status RECEIVED para PAGO', () => {
      expect(mapPaymentStatus('RECEIVED')).toBe('PAGO');
    });

    it('deve mapear status CONFIRMED para PAGO', () => {
      expect(mapPaymentStatus('CONFIRMED')).toBe('PAGO');
    });

    it('deve mapear status OVERDUE para ATRASADO', () => {
      expect(mapPaymentStatus('OVERDUE')).toBe('ATRASADO');
    });

    it('deve mapear status REFUNDED para ESTORNADO', () => {
      expect(mapPaymentStatus('REFUNDED')).toBe('ESTORNADO');
    });

    it('deve retornar DESCONHECIDO para status inválido', () => {
      expect(mapPaymentStatus('INVALID_STATUS')).toBe('DESCONHECIDO');
    });
  });

  describe('mapSubscriptionStatus', () => {
    it('deve mapear status ACTIVE para ATIVA', () => {
      expect(mapSubscriptionStatus('ACTIVE')).toBe('ATIVA');
    });

    it('deve mapear status DELETED para CANCELADA', () => {
      expect(mapSubscriptionStatus('DELETED')).toBe('CANCELADA');
    });
  });

  describe('isPaymentPaid', () => {
    it('deve retornar true para pagamentos recebidos', () => {
      expect(isPaymentPaid('RECEIVED')).toBe(true);
      expect(isPaymentPaid('CONFIRMED')).toBe(true);
      expect(isPaymentPaid('RECEIVED_IN_CASH')).toBe(true);
    });

    it('deve retornar false para pagamentos pendentes', () => {
      expect(isPaymentPaid('PENDING')).toBe(false);
      expect(isPaymentPaid('OVERDUE')).toBe(false);
    });
  });

  describe('isPaymentPending', () => {
    it('deve retornar true para pagamentos pendentes', () => {
      expect(isPaymentPending('PENDING')).toBe(true);
      expect(isPaymentPending('AWAITING_RISK_ANALYSIS')).toBe(true);
    });

    it('deve retornar false para pagamentos confirmados', () => {
      expect(isPaymentPending('RECEIVED')).toBe(false);
    });
  });

  describe('isSubscriptionActive', () => {
    it('deve retornar true apenas para ACTIVE', () => {
      expect(isSubscriptionActive('ACTIVE')).toBe(true);
    });

    it('deve retornar false para outros status', () => {
      expect(isSubscriptionActive('DELETED')).toBe(false);
      expect(isSubscriptionActive('EXPIRED')).toBe(false);
    });
  });
});

describe('Asaas Utils - Data Formatting', () => {
  describe('sanitizeCpfCnpj', () => {
    it('deve remover pontuação de CPF', () => {
      expect(sanitizeCpfCnpj('123.456.789-01')).toBe('12345678901');
    });

    it('deve remover pontuação de CNPJ', () => {
      expect(sanitizeCpfCnpj('12.345.678/0001-95')).toBe('12345678000195');
    });

    it('deve retornar string vazia se entrada for vazia', () => {
      expect(sanitizeCpfCnpj('')).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('deve remover formatação de telefone', () => {
      expect(sanitizePhone('(11) 98765-4321')).toBe('11987654321');
    });

    it('deve manter apenas dígitos', () => {
      expect(sanitizePhone('+55 11 9 8765-4321')).toBe('5511987654321');
    });
  });

  describe('sanitizeCep', () => {
    it('deve remover hífen do CEP', () => {
      expect(sanitizeCep('12345-678')).toBe('12345678');
    });
  });

  describe('formatCurrency', () => {
    it('deve arredondar para 2 casas decimais', () => {
      expect(formatCurrency(199.999)).toBe(200.0);
      expect(formatCurrency(199.991)).toBe(199.99);
    });

    it('deve manter valores inteiros', () => {
      expect(formatCurrency(100)).toBe(100);
    });
  });

  describe('formatDate', () => {
    it('deve formatar Date para YYYY-MM-DD', () => {
      const date = new Date('2025-10-06T10:00:00');
      expect(formatDate(date)).toBe('2025-10-06');
    });

    it('deve formatar string ISO para YYYY-MM-DD', () => {
      expect(formatDate('2025-10-06T10:00:00Z')).toBe('2025-10-06');
    });

    it('deve adicionar zeros à esquerda', () => {
      const date = new Date('2025-01-05T10:00:00');
      expect(formatDate(date)).toBe('2025-01-05');
    });
  });

  describe('calcularProximoVencimento', () => {
    it('deve calcular vencimento para o dia especificado', () => {
      const data = calcularProximoVencimento(15);
      expect(data.getDate()).toBe(15);
    });

    it('deve avançar para o próximo mês se dia já passou', () => {
      const hoje = new Date();
      const diaPassado = hoje.getDate() - 5;
      if (diaPassado > 0) {
        const data = calcularProximoVencimento(diaPassado);
        expect(data.getMonth()).toBe((hoje.getMonth() + 1) % 12);
      }
    });

    it('deve calcular vencimento N meses à frente', () => {
      const data = calcularProximoVencimento(15, 2);
      const hoje = new Date();
      expect(data.getMonth()).toBe((hoje.getMonth() + 2) % 12);
    });
  });
});

describe('Asaas Utils - Validation', () => {
  describe('isValidCpf', () => {
    it('deve validar CPF correto', () => {
      expect(isValidCpf('11144477735')).toBe(true); // CPF válido
    });

    it('deve rejeitar CPF com dígitos repetidos', () => {
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('00000000000')).toBe(false);
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(isValidCpf('123')).toBe(false);
    });

    it('deve aceitar CPF com formatação', () => {
      expect(isValidCpf('111.444.777-35')).toBe(true);
    });
  });

  describe('isValidCnpj', () => {
    it('deve validar CNPJ correto', () => {
      expect(isValidCnpj('11222333000181')).toBe(true); // CNPJ válido
    });

    it('deve rejeitar CNPJ com dígitos repetidos', () => {
      expect(isValidCnpj('11111111111111')).toBe(false);
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(isValidCnpj('123')).toBe(false);
    });
  });

  describe('isValidCpfCnpj', () => {
    it('deve validar CPF quando tem 11 dígitos', () => {
      expect(isValidCpfCnpj('11144477735')).toBe(true);
    });

    it('deve validar CNPJ quando tem 14 dígitos', () => {
      expect(isValidCpfCnpj('11222333000181')).toBe(true);
    });

    it('deve rejeitar string com tamanho diferente de 11 ou 14', () => {
      expect(isValidCpfCnpj('123')).toBe(false);
    });
  });
});

describe('Asaas Utils - Idempotence', () => {
  describe('generateIdempotencyKey', () => {
    it('deve gerar chave a partir de partes fornecidas', () => {
      expect(generateIdempotencyKey('user', '123', 'create')).toBe('user|123|create');
    });

    it('deve funcionar com uma única parte', () => {
      expect(generateIdempotencyKey('single')).toBe('single');
    });
  });

  describe('extractWebhookEventId', () => {
    it('deve extrair ID do campo id diretamente', () => {
      const payload = { id: 'evt_12345', event: 'PAYMENT_RECEIVED' };
      expect(extractWebhookEventId(payload)).toBe('evt_12345');
    });

    it('deve gerar ID a partir de event + payment.id', () => {
      const payload = {
        event: 'PAYMENT_RECEIVED',
        payment: { id: 'pay_67890' },
      };
      expect(extractWebhookEventId(payload)).toBe('PAYMENT_RECEIVED:pay_67890');
    });

    it('deve gerar ID a partir de event + subscription.id', () => {
      const payload = {
        event: 'SUBSCRIPTION_CREATED',
        subscription: { id: 'sub_abcde' },
      };
      expect(extractWebhookEventId(payload)).toBe('SUBSCRIPTION_CREATED:sub_abcde');
    });

    it('deve retornar null para payload inválido', () => {
      expect(extractWebhookEventId(null)).toBe(null);
      expect(extractWebhookEventId({})).toBe(null);
      expect(extractWebhookEventId('string')).toBe(null);
    });
  });
});

describe('Asaas Utils - Error Handling', () => {
  describe('formatAsaasError', () => {
    it('deve formatar erro do Asaas com múltiplos erros', () => {
      const error = {
        statusCode: 400,
        data: {
          errors: [
            { code: 'invalid_cpfCnpj', description: 'CPF inválido' },
            { code: 'required_field', description: 'Campo obrigatório' },
          ],
        },
      };
      expect(formatAsaasError(error)).toBe(
        '[invalid_cpfCnpj] CPF inválido; [required_field] Campo obrigatório',
      );
    });

    it('deve formatar erro do Asaas sem detalhes', () => {
      const error = { statusCode: 500 };
      expect(formatAsaasError(error)).toBe('Erro 500: Falha na comunicação com Asaas');
    });

    it('deve formatar erro genérico', () => {
      const error = new Error('Erro de rede');
      expect(formatAsaasError(error)).toBe('Erro de rede');
    });

    it('deve lidar com erro desconhecido', () => {
      expect(formatAsaasError('string de erro')).toBe('Erro desconhecido');
    });
  });
});

describe('Asaas Utils - Masking', () => {
  describe('maskSecret', () => {
    it('deve mascarar valores sensíveis', () => {
      expect(maskSecret('sk_test_abc123def456')).toBe('sk_••••456');
    });

    it('deve retornar •••• para valores curtos', () => {
      expect(maskSecret('abc')).toBe('••••');
      expect(maskSecret('123456')).toBe('••••');
    });

    it('deve retornar null para valores null/undefined', () => {
      expect(maskSecret(null)).toBe(null);
      expect(maskSecret(undefined)).toBe(null);
    });

    it('deve retornar null para string vazia', () => {
      expect(maskSecret('')).toBe(null);
    });
  });
});
