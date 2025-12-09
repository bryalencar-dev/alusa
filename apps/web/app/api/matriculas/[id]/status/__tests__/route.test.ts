/**
 * Testes unitários para /api/matriculas/[id]/status
 *
 * @module __tests__/api/matriculas/status
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '../route';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@alusa/lib', async () => {
  const actual = await vi.importActual<typeof import('@alusa/lib')>('@alusa/lib');
  return {
    ...actual,
    syncMatriculaStatus: vi.fn(),
  };
});

describe('PATCH /api/matriculas/[id]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 401 se usuário não autenticado', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/matriculas/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAUSADA' }),
    });

    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autenticado');
  });

  it('deve retornar 400 se status inválido', async () => {
    const { getServerSession } = await import('next-auth');
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    const request = new NextRequest('http://localhost:3000/api/matriculas/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INVALIDO' }),
    });

    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Status inválido');
  });

  it('deve retornar 404 se matrícula não encontrada', async () => {
    const { getServerSession } = await import('next-auth');
    const { ManualSyncError, syncMatriculaStatus } = await import('@alusa/lib');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    vi.mocked(syncMatriculaStatus).mockRejectedValue(
      new ManualSyncError(404, 'MATRICULA_NOT_FOUND', 'Matrícula não encontrada.'),
    );

    const request = new NextRequest('http://localhost:3000/api/matriculas/123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAUSADA' }),
    });

    const response = await PATCH(request, { params: { id: '123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('MATRICULA_NOT_FOUND');
    expect(data.message).toBe('Matrícula não encontrada.');
  });

  it('deve pausar matrícula com sucesso', async () => {
    const { getServerSession } = await import('next-auth');
    const { syncMatriculaStatus } = await import('@alusa/lib');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    vi.mocked(syncMatriculaStatus).mockResolvedValue({
      matriculaId: 'matricula-123',
      previousStatus: 'ATIVA',
      newStatus: 'PAUSADA',
      asaasAction: 'SUSPEND',
      cobrancasAtualizadas: 0,
      paymentSync: {
        totalFromAsaas: 0,
        matched: 0,
        updated: 0,
        warnings: [],
        details: [],
        expectedWebhooks: ['SUBSCRIPTION_INACTIVATED'],
      },
      nextDueDate: null,
    });

    const request = new NextRequest('http://localhost:3000/api/matriculas/matricula-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAUSADA' }),
    });

    const response = await PATCH(request, { params: { id: 'matricula-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Status atualizado para PAUSADA');
    expect(syncMatriculaStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        matriculaId: 'matricula-123',
        targetStatus: 'PAUSADA',
        contaId: 'conta-123',
        actorId: 'user-123',
      }),
    );
  });

  it('deve retomar matrícula com sucesso', async () => {
    const { getServerSession } = await import('next-auth');
    const { syncMatriculaStatus } = await import('@alusa/lib');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    vi.mocked(syncMatriculaStatus).mockResolvedValue({
      matriculaId: 'matricula-123',
      previousStatus: 'PAUSADA',
      newStatus: 'ATIVA',
      asaasAction: 'ACTIVATE',
      cobrancasAtualizadas: 0,
      paymentSync: {
        totalFromAsaas: 0,
        matched: 0,
        updated: 0,
        warnings: [],
        details: [],
        expectedWebhooks: ['SUBSCRIPTION_ACTIVATED'],
      },
      nextDueDate: '2025-10-10',
    });

    const request = new NextRequest('http://localhost:3000/api/matriculas/matricula-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ATIVA' }),
    });

    const response = await PATCH(request, { params: { id: 'matricula-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Status atualizado para ATIVA');
  });

  it('deve cancelar matrícula com sucesso', async () => {
    const { getServerSession } = await import('next-auth');
    const { syncMatriculaStatus } = await import('@alusa/lib');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    vi.mocked(syncMatriculaStatus).mockResolvedValue({
      matriculaId: 'matricula-123',
      previousStatus: 'ATIVA',
      newStatus: 'CANCELADA',
      asaasAction: 'DELETE',
      cobrancasAtualizadas: 0,
      paymentSync: {
        totalFromAsaas: 0,
        matched: 0,
        updated: 0,
        warnings: [],
        details: [],
        expectedWebhooks: ['SUBSCRIPTION_DELETED'],
      },
      nextDueDate: null,
    });

    const request = new NextRequest('http://localhost:3000/api/matriculas/matricula-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELADA' }),
    });

    const response = await PATCH(request, { params: { id: 'matricula-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Status atualizado para CANCELADA');
  });

  it('deve retornar erro 502 para falha no Asaas', async () => {
    const { getServerSession } = await import('next-auth');
    const { ManualSyncError, syncMatriculaStatus } = await import('@alusa/lib');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    vi.mocked(syncMatriculaStatus).mockRejectedValue(
      new ManualSyncError(502, 'ASAAS_ERROR', 'Falha ao sincronizar status com o Asaas.'),
    );

    const request = new NextRequest('http://localhost:3000/api/matriculas/matricula-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAUSADA' }),
    });

    const response = await PATCH(request, { params: { id: 'matricula-123' } });
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('ASAAS_ERROR');
    expect(data.message).toBe('Falha ao sincronizar status com o Asaas.');
  });

  it('deve retornar 500 para erros não tratados', async () => {
    const { getServerSession } = await import('next-auth');
    const { syncMatriculaStatus } = await import('@alusa/lib');

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', contaId: 'conta-123', role: 'ADMIN' },
    } as never);

    vi.mocked(syncMatriculaStatus).mockRejectedValue(new Error('Erro inesperado'));

    const request = new NextRequest('http://localhost:3000/api/matriculas/matricula-123/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PAUSADA' }),
    });

    const response = await PATCH(request, { params: { id: 'matricula-123' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('INTERNAL_ERROR');
  });
});
