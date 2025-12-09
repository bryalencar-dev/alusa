import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from 'next-auth';
import { GET as checkoutGet } from '@/app/api/portal/financeiro/[id]/checkout/route';
import { GET as boletoGet } from '@/app/api/portal/financeiro/[id]/boleto/route';
import { GET as pixGet } from '@/app/api/portal/financeiro/[id]/pix/route';
import { POST as processCardPost } from '@/app/api/portal/financeiro/[id]/process-card/route';

const buildRequest = (url: string, method: 'GET' | 'POST' = 'GET'): NextRequest =>
  new Request(url, { method }) as unknown as NextRequest;

describe('Portal Financeiro - pagamentos', () => {
  beforeEach(() => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', role: 'RESPONSAVEL', contaId: 'conta-1' },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('bloqueia checkout público e orienta procurar secretaria', async () => {
    const response = await checkoutGet(
      buildRequest('http://localhost/api/portal/financeiro/abc/checkout'),
      { params: { id: 'abc' } },
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.message).toMatch(/secretaria/i);
  });

  it('bloqueia geração de boleto', async () => {
    const response = await boletoGet(
      buildRequest('http://localhost/api/portal/financeiro/abc/boleto'),
      { params: { id: 'abc' } },
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toMatch(/boleto/i);
  });

  it('bloqueia geração de QR Code PIX', async () => {
    const response = await pixGet(
      buildRequest('http://localhost/api/portal/financeiro/abc/pix'),
      { params: { id: 'abc' } },
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toMatch(/QR Code/i);
  });

  it('bloqueia processamento de cartão', async () => {
    const response = await processCardPost(
      buildRequest('http://localhost/api/portal/financeiro/abc/process-card', 'POST'),
      { params: { id: 'abc' } },
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toMatch(/cartão/i);
  });

  it('retorna 401 quando não autenticado', async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const response = await checkoutGet(
      buildRequest('http://localhost/api/portal/financeiro/abc/checkout'),
      { params: { id: 'abc' } },
    );
    expect(response.status).toBe(401);
  });
});
