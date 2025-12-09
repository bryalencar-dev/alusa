/**
 * Testes unitários para API de Payments do Asaas
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/asaas/payments/route';
import { NextRequest } from 'next/server';
import * as asaasLib from '@alusa/lib/asaas';
import type { AsaasPayment as PaymentEntity } from '@alusa/lib/asaas/payment';

// Mock do Prisma
vi.mock('@/src/prisma', () => ({
  prisma: {
    cobranca: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock das funções do Asaas
vi.mock('@alusa/lib/asaas', async () => {
  const actual = await vi.importActual<typeof asaasLib>('@alusa/lib/asaas');
  return {
    ...actual,
    createPayment: vi.fn(),
    listPayments: vi.fn(),
    isAsaasEnabled: vi.fn(() => true),
    AsaasEnvError: actual.AsaasEnvError,
  };
});

describe('POST /api/asaas/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar payment com dados customizados', async () => {
    // Arrange
    const mockPayment: PaymentEntity = {
      object: 'payment',
      id: 'pay_123',
      dateCreated: '2025-01-01',
      customer: 'cus_123',
      value: 199.9,
      netValue: 199.9,
      billingType: 'BOLETO',
      dueDate: '2025-10-10',
      status: 'PENDING',
      canBePaidAfterDueDate: false,
      deleted: false,
      anticipated: false,
      anticipable: true,
    };

    vi.mocked(asaasLib.createPayment).mockResolvedValue(mockPayment);

    const request = new NextRequest('http://localhost:3001/api/asaas/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customData: {
          customer: 'cus_123',
          billingType: 'BOLETO',
          value: 199.9,
          dueDate: '2025-10-10',
          description: 'Teste',
        },
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.payment).toEqual(mockPayment);
  });

  it('deve retornar 400 se dados inválidos', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3001/api/asaas/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}), // Falta cobrancaId e customData
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Dados inválidos');
  });
});

describe('GET /api/asaas/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve listar payments com filtros', async () => {
    // Arrange
    const mockList = {
      data: [
        { id: 'pay_1', value: 100, status: 'PENDING' },
        { id: 'pay_2', value: 200, status: 'RECEIVED' },
      ],
      totalCount: 2,
      hasMore: false,
    };

    vi.mocked(asaasLib.listPayments).mockResolvedValue(
      mockList as unknown as ReturnType<typeof asaasLib.listPayments> extends Promise<infer T>
        ? T
        : never,
    );

    const request = new NextRequest(
      'http://localhost:3001/api/asaas/payments?customer=cus_123&status=PENDING',
    );

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(asaasLib.listPayments).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_123',
      }),
    );
  });

  it('deve retornar 403 se integração desabilitada', async () => {
    // Arrange
    vi.mocked(asaasLib.isAsaasEnabled).mockReturnValue(false);

    const request = new NextRequest('http://localhost:3001/api/asaas/payments');

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data.error).toBe('Integração com Asaas não habilitada');
  });
});
