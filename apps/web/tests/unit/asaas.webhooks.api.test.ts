/**
 * Testes unitários para Webhook do Asaas
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { POST } from '../../app/api/asaas/webhooks/route';

vi.mock('@alusa/lib', async () => {
  const actual = await vi.importActual<typeof import('@alusa/lib')>('@alusa/lib');
  return {
    ...actual,
    loadDecryptedAsaasCredentials: vi.fn(),
  };
});

// Mock do Prisma
vi.mock('@/src/prisma', () => ({
  prisma: {
    webhookAsaas: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    conta: {
      findFirst: vi.fn(),
    },
    cobranca: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pagamento: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    matricula: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    matriculaLog: {
      create: vi.fn(),
    },
  },
}));

// Import prisma DEPOIS do mock
const { prisma } = await import('@/src/prisma');
const { loadDecryptedAsaasCredentials } = await import('@alusa/lib');

describe('POST /api/asaas/webhooks', () => {
  const WEBHOOK_SECRET = 'test-secret-key-12345';
  const CONTA_ID = 'conta-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ASAAS_WEBHOOK_SECRET = WEBHOOK_SECRET;

    // Mock padrão: conta existe
    vi.mocked(prisma.conta.findFirst).mockResolvedValue({
      id: CONTA_ID,
      nome: 'Conta Teste',
      status: 'ATIVO',
      createdAt: new Date(),
      updatedAt: new Date(),
      cpfCnpj: '12345678000100',
      ownerUserId: null,
      enderecoCep: null,
      enderecoLogradouro: null,
      enderecoNumero: null,
      enderecoBairro: null,
      enderecoCidade: null,
      enderecoUf: null,
      asaasApiKeyEncrypted: null,
      asaasWebhookSecretEncrypted: null,
      asaasCredsUpdatedAt: null,
    } as never);

    vi.mocked(prisma.cobranca.findFirst).mockResolvedValue({
      matriculaId: 'matricula-123',
    } as never);

    vi.mocked(prisma.matricula.findUnique).mockResolvedValue({
      aluno: { contaId: CONTA_ID },
    } as never);

    vi.mocked(prisma.matricula.findFirst).mockResolvedValue(null);

    vi.mocked(loadDecryptedAsaasCredentials).mockResolvedValue({
      apiKey: 'test-api-key',
      webhookSecret: WEBHOOK_SECRET,
    });
  });

  function createSignature(payload: string): string {
    return crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  }

  function createRequest(payload: string, signature: string | null): NextRequest {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (signature) {
      headers.set('asaas-signature', signature);
    }

    return new NextRequest('http://localhost:3001/api/asaas/webhooks', {
      method: 'POST',
      headers,
      body: payload,
    });
  }

  it('deve retornar 401 quando a assinatura for inválida', async () => {
    const payload = JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_123', status: 'RECEIVED' },
    });

    const req = createRequest(payload, 'assinatura-invalida');
    const response = await POST(req);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Assinatura inválida');
  });

  it('deve retornar 401 quando a assinatura não for fornecida', async () => {
    const payload = JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_123', status: 'RECEIVED' },
    });

    const req = createRequest(payload, null);
    const response = await POST(req);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Assinatura inválida');
  });

  it('deve retornar 400 quando o evento não for fornecido', async () => {
    const payload = JSON.stringify({
      payment: { id: 'pay_123', status: 'RECEIVED' },
    });

    const signature = createSignature(payload);
    const req = createRequest(payload, signature);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Evento não fornecido');
  });

  it('deve processar webhook válido PAYMENT_RECEIVED', async () => {
    const payload = JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_123',
        customer: 'cus_test',
        status: 'RECEIVED',
        value: 100.0,
        netValue: 97.5,
        billingType: 'PIX',
        dateCreated: '2025-01-15',
        paymentDate: '2025-01-15',
      },
    });

    const signature = createSignature(payload);

    // Mock upsert do webhook
    vi.mocked(prisma.webhookAsaas.upsert).mockResolvedValue({
      id: 'webhook-123',
      eventId: 'pay_123',
      evento: 'PAYMENT_RECEIVED',
      payload: JSON.parse(payload),
      status: 'RECEBIDO',
      contaId: CONTA_ID,
      recebidoEm: new Date(),
      processadoEm: null,
    });

    // Mock update para marcar como PROCESSADO
    vi.mocked(prisma.webhookAsaas.update).mockResolvedValue({
      id: 'webhook-123',
      eventId: 'pay_123',
      evento: 'PAYMENT_RECEIVED',
      payload: JSON.parse(payload),
      status: 'PROCESSADO',
      contaId: CONTA_ID,
      recebidoEm: new Date(),
      processadoEm: new Date(),
    });

    // Mock busca e atualização de cobrança
    vi.mocked(prisma.cobranca.findUnique).mockResolvedValue({
      id: 'cobranca-123',
      asaasPaymentId: 'pay_123',
      status: 'PENDENTE',
      matriculaId: 'matricula-123',
      matricula: {
        id: 'matricula-123',
        status: 'PENDENTE_TAXA',
        taxaStatus: 'PENDENTE',
      },
    } as never);

    vi.mocked(prisma.cobranca.update).mockResolvedValue({
      id: 'cobranca-123',
      asaasPaymentId: 'pay_123',
      status: 'PAGO',
    } as never);

    // Mock atualização de matrícula
    vi.mocked(prisma.matricula.update).mockResolvedValue({
      id: 'matricula-123',
      status: 'ATIVA',
      taxaStatus: 'PAGO',
    } as never);

    // Mock upsert de pagamento
    vi.mocked(prisma.pagamento.upsert).mockResolvedValue({
      id: 'pagamento-123',
    } as never);

    const req = createRequest(payload, signature);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);
    expect(json.processed).toBe(true);

    // Verificar que o webhook foi persistido
    const expectedEventId = 'PAYMENT_RECEIVED:pay_123:RECEIVED:2025-01-15';
    expect(prisma.webhookAsaas.upsert).toHaveBeenCalledWith({
      where: { eventId: expectedEventId },
      update: expect.objectContaining({
        evento: 'PAYMENT_RECEIVED',
        status: 'RECEBIDO',
      }),
      create: expect.objectContaining({
        eventId: expectedEventId,
        evento: 'PAYMENT_RECEIVED',
        status: 'RECEBIDO',
        contaId: CONTA_ID,
      }),
    });

    // Verificar que foi marcado como processado
    expect(prisma.webhookAsaas.update).toHaveBeenCalledWith({
      where: { id: 'webhook-123' },
      data: {
        status: 'PROCESSADO',
        processadoEm: expect.any(Date),
      },
    });
  });

  it('deve processar webhook válido SUBSCRIPTION_CREATED', async () => {
    const payload = JSON.stringify({
      event: 'SUBSCRIPTION_CREATED',
      subscription: {
        id: 'sub_123',
        customer: 'cus_test',
        status: 'ACTIVE',
        value: 100.0,
        cycle: 'MONTHLY',
        nextDueDate: '2025-02-15',
      },
    });

    const signature = createSignature(payload);

    // Mock upsert do webhook
    vi.mocked(prisma.webhookAsaas.upsert).mockResolvedValue({
      id: 'webhook-456',
      eventId: 'sub_123',
      evento: 'SUBSCRIPTION_CREATED',
      payload: JSON.parse(payload),
      status: 'RECEBIDO',
      contaId: CONTA_ID,
      recebidoEm: new Date(),
      processadoEm: null,
    });

    // Mock update para marcar como PROCESSADO
    vi.mocked(prisma.webhookAsaas.update).mockResolvedValue({
      id: 'webhook-456',
      eventId: 'sub_123',
      evento: 'SUBSCRIPTION_CREATED',
      payload: JSON.parse(payload),
      status: 'PROCESSADO',
      contaId: CONTA_ID,
      recebidoEm: new Date(),
      processadoEm: new Date(),
    });

    // Mock busca de matrícula para resolver contaId (fase anterior à persistência)
    vi.mocked(prisma.matricula.findFirst).mockResolvedValue({
      aluno: { contaId: CONTA_ID },
    } as never);

    // Mock busca de matrícula
    vi.mocked(prisma.matricula.findUnique).mockResolvedValue({
      id: 'matricula-123',
      asaasSubscriptionId: 'sub_123',
      status: 'PENDENTE_TAXA',
      aluno: { contaId: CONTA_ID },
      plano: { id: 'plano-123', nome: 'Plano Teste' },
    } as never);

    // Mock atualização de matrícula
    vi.mocked(prisma.matricula.update).mockResolvedValue({
      id: 'matricula-123',
      asaasSubscriptionId: 'sub_123',
      status: 'ATIVA',
    } as never);

    const req = createRequest(payload, signature);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);
    expect(json.processed).toBe(true);

    // Verificar que o webhook foi persistido
    const expectedEventId = 'SUBSCRIPTION_CREATED:sub_123:ACTIVE:2025-02-15';
    expect(prisma.webhookAsaas.upsert).toHaveBeenCalledWith({
      where: { eventId: expectedEventId },
      update: expect.objectContaining({
        evento: 'SUBSCRIPTION_CREATED',
        status: 'RECEBIDO',
      }),
      create: expect.objectContaining({
        eventId: expectedEventId,
        evento: 'SUBSCRIPTION_CREATED',
        status: 'RECEBIDO',
        contaId: CONTA_ID,
      }),
    });

    // Verificar que foi marcado como processado
    expect(prisma.webhookAsaas.update).toHaveBeenCalledWith({
      where: { id: 'webhook-456' },
      data: {
        status: 'PROCESSADO',
        processadoEm: expect.any(Date),
      },
    });
  });

  it('deve retornar 200 mesmo com erro no processamento (idempotência)', async () => {
    const payload = JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_999',
        status: 'RECEIVED',
      },
    });

    const signature = createSignature(payload);

    // Mock upsert do webhook
    vi.mocked(prisma.webhookAsaas.upsert).mockResolvedValue({
      id: 'webhook-error',
      eventId: 'pay_999',
      evento: 'PAYMENT_RECEIVED',
      payload: JSON.parse(payload),
      status: 'RECEBIDO',
      contaId: CONTA_ID,
      recebidoEm: new Date(),
      processadoEm: null,
    });

    // Mock update para marcar como ERRO
    vi.mocked(prisma.webhookAsaas.update).mockResolvedValue({
      id: 'webhook-error',
      eventId: 'pay_999',
      evento: 'PAYMENT_RECEIVED',
      payload: JSON.parse(payload),
      status: 'ERRO',
      contaId: CONTA_ID,
      recebidoEm: new Date(),
      processadoEm: null,
    });

    // Simular erro no processamento (ex: cobrança não encontrada)
    vi.mocked(prisma.cobranca.update).mockRejectedValue(new Error('Cobrança não encontrada'));

    const req = createRequest(payload, signature);
    const response = await POST(req);

    // Mesmo com erro, retorna 200 para não retentar
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);
    expect(json.error).toBe('Erro ao processar, mas payload salvo');

    // Verificar que foi marcado como ERRO
    expect(prisma.webhookAsaas.update).toHaveBeenCalledWith({
      where: { id: 'webhook-error' },
      data: { status: 'ERRO' },
    });
  });

  it('deve retornar 400 quando não conseguir resolver conta', async () => {
    // Mock: nenhuma conta disponível para fallback e nenhum relacionamento associado
    vi.mocked(prisma.cobranca.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.matricula.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.conta.findFirst).mockResolvedValue(null);

    const payload = JSON.stringify({
      event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_123', status: 'RECEIVED' },
    });

    const signature = createSignature(payload);
    const req = createRequest(payload, signature);
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Conta não resolvida');
  });
});
