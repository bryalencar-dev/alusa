import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import type { NextRequest } from 'next/server';
import { GET as getCobrancas } from '@/app/api/financeiro/cobrancas/route';
import { GET as getPagamentos } from '@/app/api/financeiro/pagamentos/route';
import { prisma } from '@/src/prisma';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({ user: { id: 'u1', contaId: 'c1', role: 'FINANCEIRO' } })),
}));

function mockCobrancas() {
  vi.spyOn(prisma.cobranca, 'count').mockResolvedValue(1 as unknown as number);
  interface CobrancaMock {
    id: string;
    tipo: string;
    status: string;
    valor: number;
    vencimento: Date;
    matricula: { id: string; aluno: { id: string; nome: string } };
    asaasPaymentId: string | null;
  }
  const cobrancasMock: CobrancaMock[] = [
    {
      id: 'cb1',
      tipo: 'MENSALIDADE',
      status: 'PENDENTE',
      valor: 100.5,
      vencimento: new Date('2025-01-10T00:00:00.000Z'),
      matricula: { id: 'm1', aluno: { id: 'a1', nome: 'Aluno Teste' } },
      asaasPaymentId: null,
    },
  ];
  vi.spyOn(prisma.cobranca, 'findMany').mockResolvedValue(cobrancasMock as unknown as never);
}

function mockPagamentos() {
  vi.spyOn(prisma.pagamento, 'count').mockResolvedValue(1 as unknown as number);
  interface PagamentoMock {
    id: string;
    status: string;
    valorPago: number;
    dataPagamento: Date;
    formaPagamento: string;
    cobrancaId: string;
    cobranca: {
      id: string;
      tipo: string;
      status: string;
      valor: number;
      vencimento: Date;
      matricula: { aluno: { id: string; nome: string } };
    };
    asaasPaymentId: string | null;
    createdAt: Date;
  }
  const pagamentosMock: PagamentoMock[] = [
    {
      id: 'pg1',
      status: 'CONFIRMADO',
      valorPago: 50.25,
      dataPagamento: new Date('2025-02-01T00:00:00.000Z'),
      formaPagamento: 'PIX',
      cobrancaId: 'cb1',
      cobranca: {
        id: 'cb1',
        tipo: 'MENSALIDADE',
        status: 'PAGO',
        valor: 50.25,
        vencimento: new Date('2025-02-05T00:00:00.000Z'),
        matricula: { aluno: { id: 'a1', nome: 'Aluno Teste' } },
      },
      asaasPaymentId: null,
      createdAt: new Date(),
    },
  ];
  vi.spyOn(prisma.pagamento, 'findMany').mockResolvedValue(pagamentosMock as unknown as never);
}

afterAll(() => {
  vi.restoreAllMocks();
});

describe('API Financeiro Cobrancas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCobrancas();
  });

  it('retorna lista paginada básica', async () => {
    const req = { url: 'http://test/api/financeiro/cobrancas' } as unknown as NextRequest;
    const res = await getCobrancas(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('data');
    expect(json.total).toBe(1);
    expect(json.data[0].aluno.nome).toBe('Aluno Teste');
  });

  it('retorna lista de pagamentos mock', async () => {
    mockPagamentos();
    const req = { url: 'http://test/api/financeiro/pagamentos' } as unknown as NextRequest;
    const res = await getPagamentos(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.data[0].cobranca.tipo).toBe('MENSALIDADE');
  });
});
