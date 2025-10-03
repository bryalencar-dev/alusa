/**
 * Testes unitários para API de Customers do Asaas
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/asaas/customers/route';
import { NextRequest } from 'next/server';
import * as asaasLib from '@alusa/lib/asaas';

// Mock do Prisma
vi.mock('@/src/prisma', () => ({
  prisma: {
    aluno: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    responsavel: {
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
    createCustomer: vi.fn(),
    isAsaasEnabled: vi.fn(() => true),
    AsaasEnvError: actual.AsaasEnvError,
  };
});

describe('POST /api/asaas/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar customer com dados customizados', async () => {
    // Arrange
    const mockCustomer = {
      id: 'cus_000123',
      name: 'João Silva',
      cpfCnpj: '12345678901',
      email: 'joao@test.com',
    };

    vi.mocked(asaasLib.createCustomer).mockResolvedValue(mockCustomer as asaasLib.AsaasCustomer);

    const request = new NextRequest('http://localhost:3001/api/asaas/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customData: {
          name: 'João Silva',
          cpfCnpj: '12345678901',
          email: 'joao@test.com',
        },
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.customer).toEqual(mockCustomer);
    expect(asaasLib.createCustomer).toHaveBeenCalledWith({
      name: 'João Silva',
      cpfCnpj: '12345678901',
      email: 'joao@test.com',
    });
  });

  it('deve retornar 403 se integração Asaas estiver desabilitada', async () => {
    // Arrange
    vi.mocked(asaasLib.isAsaasEnabled).mockReturnValue(false);

    const request = new NextRequest('http://localhost:3001/api/asaas/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customData: {
          name: 'João Silva',
          cpfCnpj: '12345678901',
        },
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data.error).toBe('Integração com Asaas não habilitada');
  });

  it('deve retornar 400 se dados inválidos', async () => {
    // Arrange
    vi.mocked(asaasLib.isAsaasEnabled).mockReturnValue(true); // Garante que está habilitado

    const request = new NextRequest('http://localhost:3001/api/asaas/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Falta alunoId, responsavelId e customData
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Dados inválidos');
  });

  it('deve retornar 500 se erro de configuração do Asaas', async () => {
    // Arrange
    vi.mocked(asaasLib.isAsaasEnabled).mockReturnValue(true); // Garante que está habilitado

    vi.mocked(asaasLib.createCustomer).mockRejectedValue(
      new asaasLib.AsaasEnvError('ASAAS_API_KEY não configurada'),
    );

    const request = new NextRequest('http://localhost:3001/api/asaas/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customData: {
          name: 'João Silva',
          cpfCnpj: '12345678901',
        },
      }),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Configuração Asaas ausente');
    expect(data.message).toContain('ASAAS_API_KEY');
  });
});
