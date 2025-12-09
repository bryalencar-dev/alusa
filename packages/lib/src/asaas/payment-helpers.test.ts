import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAvulsaPayment, getAvulsaPaymentData } from './payment-helpers';

// Mock all dependencies
vi.mock('../prisma', () => ({
  prisma: {
    cobranca: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('./payment', () => ({
  createPayment: vi.fn(),
  getPayment: vi.fn(),
  getPixQrCode: vi.fn(),
}));

vi.mock('./customer', () => ({
  getCustomer: vi.fn(),
}));

describe('payment-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAvulsaPayment', () => {
    it('deve criar pagamento PIX com sucesso', async () => {
      // Setup mocks
      const { prisma } = await import('../prisma');
      const { createPayment } = await import('./payment');
      const { getCustomer } = await import('./customer');

      vi.mocked(prisma.cobranca.findUnique).mockResolvedValue({
        id: 'cob-123',
        valor: 150,
        vencimento: new Date('2025-12-31'),
        descricao: 'Taxa',
        asaasPaymentId: null,
        matricula: {
          aluno: { id: 'alu-1', asaasCustomerId: 'cus_123' },
          responsavel: null,
        },
      } as never);

      vi.mocked(getCustomer).mockResolvedValue({ id: 'cus_123' } as never);

      vi.mocked(createPayment).mockResolvedValue({
        id: 'pay_789',
        value: 150,
        status: 'PENDING',
        billingType: 'PIX',
        dueDate: '2025-12-31',
        invoiceUrl: 'https://asaas.com/i/789',
      } as never);

      vi.mocked(prisma.cobranca.update).mockResolvedValue({} as never);

      // Execute
      const result = await createAvulsaPayment({
        cobrancaId: 'cob-123',
        billingType: 'PIX',
      });

      // Assert
      expect(result.paymentId).toBe('pay_789');
      expect(result.billingType).toBe('PIX');
      expect(prisma.cobranca.update).toHaveBeenCalledWith({
        where: { id: 'cob-123' },
        data: {
          asaasPaymentId: 'pay_789',
          formaPagamento: 'PIX',
        },
      });
    });

    it('deve lançar erro quando cobrança não existe', async () => {
      const { prisma } = await import('../prisma');
      vi.mocked(prisma.cobranca.findUnique).mockResolvedValue(null);

      await expect(
        createAvulsaPayment({
          cobrancaId: 'invalid',
          billingType: 'PIX',
        }),
      ).rejects.toThrow('Cobrança invalid não encontrada');
    });

    it('deve lançar erro quando cobrança já tem asaasPaymentId', async () => {
      const { prisma } = await import('../prisma');

      vi.mocked(prisma.cobranca.findUnique).mockResolvedValue({
        id: 'cob-123',
        asaasPaymentId: 'pay_existing',
        matricula: {},
      } as never);

      await expect(
        createAvulsaPayment({
          cobrancaId: 'cob-123',
          billingType: 'PIX',
        }),
      ).rejects.toThrow('já possui payment vinculado');
    });

    it('deve lançar erro quando não há asaasCustomerId', async () => {
      const { prisma } = await import('../prisma');

      vi.mocked(prisma.cobranca.findUnique).mockResolvedValue({
        id: 'cob-123',
        asaasPaymentId: null,
        matricula: {
          aluno: { id: 'alu-1', asaasCustomerId: null },
          responsavel: null,
        },
      } as never);

      await expect(
        createAvulsaPayment({
          cobrancaId: 'cob-123',
          billingType: 'PIX',
        }),
      ).rejects.toThrow('não possui asaasCustomerId');
    });
  });

  describe('getAvulsaPaymentData', () => {
    it('deve retornar dados de pagamento PIX', async () => {
      const { getPayment } = await import('./payment');

      vi.mocked(getPayment).mockResolvedValue({
        id: 'pay_pix_123',
        value: 120,
        status: 'PENDING',
        billingType: 'PIX',
        dueDate: '2025-12-31',
        invoiceUrl: 'https://asaas.com/i/pix_123',
      } as never);

      const result = await getAvulsaPaymentData('pay_pix_123');

      expect(result.paymentId).toBe('pay_pix_123');
      expect(result.billingType).toBe('PIX');
      expect(result.value).toBe(120);
    });

    it('deve retornar dados de pagamento BOLETO', async () => {
      const { getPayment } = await import('./payment');

      vi.mocked(getPayment).mockResolvedValue({
        id: 'pay_bol_456',
        value: 150,
        status: 'PENDING',
        billingType: 'BOLETO',
        dueDate: '2025-11-30',
        bankSlipUrl: 'https://asaas.com/boleto/456.pdf',
        invoiceUrl: 'https://asaas.com/i/bol_456',
      } as never);

      const result = await getAvulsaPaymentData('pay_bol_456');

      expect(result.paymentId).toBe('pay_bol_456');
      expect(result.bankSlipUrl).toBe('https://asaas.com/boleto/456.pdf');
    });

    it('deve retornar dados de pagamento CREDIT_CARD', async () => {
      const { getPayment } = await import('./payment');

      vi.mocked(getPayment).mockResolvedValue({
        id: 'pay_card_789',
        value: 200,
        status: 'CONFIRMED',
        billingType: 'CREDIT_CARD',
        dueDate: '2025-10-15',
        invoiceUrl: 'https://asaas.com/i/card_789',
      } as never);

      const result = await getAvulsaPaymentData('pay_card_789');

      expect(result.status).toBe('CONFIRMED');
      expect(result.invoiceUrl).toBe('https://asaas.com/i/card_789');
    });

    it('deve propagar erros da API', async () => {
      const { getPayment } = await import('./payment');

      vi.mocked(getPayment).mockRejectedValue(new Error('Payment not found'));

      await expect(getAvulsaPaymentData('invalid')).rejects.toThrow('Payment not found');
    });
  });
});
