/**
 * Testes Unitários: Financeiro Service
 *
 * Testa todas as funções do financeiroService.ts
 * Mock da API do Asaas para testes isolados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  deleteCobranca,
  pauseAssinatura,
  reenviarCobranca,
  gerarSegundaVia,
  refundCobranca,
  confirmarPagamentoManual,
  reativarAssinatura,
} from '../index';

// Mock do client Asaas (usa o caminho relativo para o módulo local)
const mockDelete = vi.fn();
const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock('../client', () => ({
  getAsaasClientForConta: vi.fn(() => ({
    delete: mockDelete,
    post: mockPost,
    get: mockGet,
    put: mockPut,
  })),
  getAsaasClient: vi.fn(() => ({
    delete: mockDelete,
    post: mockPost,
    get: mockGet,
    put: mockPut,
  })),
}));

describe('FinanceiroService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockResolvedValue({});
    mockPost.mockResolvedValue({});
    mockGet.mockResolvedValue({ data: {} });
    mockPut.mockResolvedValue({ data: { id: 'sub_123', status: 'INACTIVE' } });
  });

  describe('deleteCobranca', () => {
    it('deve deletar cobrança com sucesso', async () => {
      const input = {
        paymentId: 'pay_123',
        contaId: 'conta_abc',
      };

      const result = await deleteCobranca(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('deve rejeitar paymentId inválido', async () => {
      const input = {
        paymentId: '',
        contaId: 'conta_abc',
      };

      const result = await deleteCobranca(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('obrigatório');
    });
  });

  describe('pauseAssinatura', () => {
    it('deve pausar assinatura com sucesso usando PUT com status INACTIVE', async () => {
      const input = {
        subscriptionId: 'sub_123',
        contaId: 'conta_abc',
      };

      const result = await pauseAssinatura(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('pausada');
      expect(result.message).toContain('Novas cobranças não serão geradas');
      // Verifica que usou PUT ao invés de DELETE
      expect(mockPut).toHaveBeenCalledWith('/subscriptions/sub_123', { status: 'INACTIVE' });
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('deve rejeitar subscriptionId vazio', async () => {
      const input = {
        subscriptionId: '',
        contaId: 'conta_abc',
      };

      const result = await pauseAssinatura(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('obrigatório');
    });
  });

  describe('reenviarCobranca', () => {
    it('deve reenviar por EMAIL com sucesso', async () => {
      const input = {
        paymentId: 'pay_123',
        tipo: 'EMAIL' as const,
        contaId: 'conta_abc',
      };

      const result = await reenviarCobranca(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('e-mail');
    });

    it('deve reenviar por WHATSAPP com sucesso', async () => {
      const input = {
        paymentId: 'pay_123',
        tipo: 'WHATSAPP' as const,
        contaId: 'conta_abc',
      };

      const result = await reenviarCobranca(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('WhatsApp');
    });

    it('deve rejeitar tipo inválido', async () => {
      const input = {
        paymentId: 'pay_123',
        tipo: 'TELEGRAM' as unknown as 'EMAIL',
        contaId: 'conta_abc',
      };

      const result = await reenviarCobranca(input);

      expect(result.success).toBe(false);
    });
  });

  describe('gerarSegundaVia', () => {
    it('deve gerar segunda via com URLs válidas', async () => {
      const input = {
        paymentId: 'pay_123',
        contaId: 'conta_abc',
      };

      mockGet.mockResolvedValueOnce({
        data: {
          billingType: 'BOLETO',
          bankSlipUrl: 'https://example.com/boleto',
          invoiceUrl: 'https://example.com/invoice',
        },
      });

      const result = await gerarSegundaVia(input);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('invoiceUrl');
    });
  });

  describe('refundCobranca', () => {
    it('deve estornar valor total com sucesso', async () => {
      const input = {
        paymentId: 'pay_123',
        contaId: 'conta_abc',
      };

      const result = await refundCobranca(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('estornada');
    });

    it('deve estornar valor parcial com sucesso', async () => {
      const input = {
        paymentId: 'pay_123',
        value: 50.0,
        description: 'Estorno parcial',
        contaId: 'conta_abc',
      };

      const result = await refundCobranca(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('estornada');
    });

    it('deve rejeitar valor negativo', async () => {
      const input = {
        paymentId: 'pay_123',
        value: -10,
        contaId: 'conta_abc',
      };

      const result = await refundCobranca(input);

      expect(result.success).toBe(false);
    });
  });

  describe('confirmarPagamentoManual', () => {
    it('deve confirmar pagamento em dinheiro com sucesso', async () => {
      const input = {
        paymentId: 'pay_123',
        paymentDate: '2025-10-07',
        value: 199.9,
        notifyCustomer: true,
        contaId: 'conta_abc',
      };

      const result = await confirmarPagamentoManual(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pagamento confirmado');
    });

    it('deve rejeitar data futura', async () => {
      const input = {
        paymentId: 'pay_123',
        paymentDate: '2030-01-01',
        value: 199.9,
        contaId: 'conta_abc',
      };

      const result = await confirmarPagamentoManual(input);

      expect(result.success).toBe(false);
      expect(result.message.toLowerCase()).toContain('data');
    });

    it('deve rejeitar formato de data inválido', async () => {
      const input = {
        paymentId: 'pay_123',
        paymentDate: '07/10/2025',
        value: 199.9,
        contaId: 'conta_abc',
      };

      const result = await confirmarPagamentoManual(input);

      expect(result.success).toBe(false);
    });
  });

  describe('reativarAssinatura', () => {
    it('deve reativar assinatura com sucesso', async () => {
      const input = {
        customer: 'cus_123',
        billingType: 'BOLETO' as const,
        nextDueDate: '2025-11-10',
        value: 199.9,
        cycle: 'MONTHLY' as const,
        description: 'Mensalidade Academia',
        contaId: 'conta_abc',
      };

      mockPost.mockResolvedValueOnce({ data: { id: 'sub_new' } });

      const result = await reativarAssinatura(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('reativada');
      expect(result.data).toHaveProperty('id');
    });

    it('deve rejeitar billingType inválido', async () => {
      const input = {
        customer: 'cus_123',
        billingType: 'PAYPAL' as unknown as 'BOLETO',
        nextDueDate: '2025-11-10',
        value: 199.9,
        cycle: 'MONTHLY' as const,
        contaId: 'conta_abc',
      };

      const result = await reativarAssinatura(input);

      expect(result.success).toBe(false);
    });

    it('deve rejeitar cycle inválido', async () => {
      const input = {
        customer: 'cus_123',
        billingType: 'BOLETO' as const,
        nextDueDate: '2025-11-10',
        value: 199.9,
        cycle: 'DAILY' as unknown as 'MONTHLY',
        contaId: 'conta_abc',
      };

      const result = await reativarAssinatura(input);

      expect(result.success).toBe(false);
    });

    it('deve rejeitar valor zero ou negativo', async () => {
      const input = {
        customer: 'cus_123',
        billingType: 'BOLETO' as const,
        nextDueDate: '2025-11-10',
        value: 0,
        cycle: 'MONTHLY' as const,
        contaId: 'conta_abc',
      };

      const result = await reativarAssinatura(input);

      expect(result.success).toBe(false);
    });
  });
});
