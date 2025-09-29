import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
vi.mock('next-auth', () => {
  return {
    getServerSession: vi.fn(),
  };
});
import { getServerSession } from 'next-auth';
import { PATCH } from '@/app/api/users/me/route';

vi.mock('@prisma/client', async (orig) => {
  const actual = await (orig as unknown as () => Promise<Record<string, unknown>>)();
  type UsuarioUpdateArgs = { where: { id: string }; data: Partial<{ nome: string; telefone: string | null; foto: string | null }> };
  class MockPrisma {
    usuario = {
      update: vi.fn(async ({ where, data }: UsuarioUpdateArgs) => {
        return { id: where.id, nome: data.nome ?? 'Nome', email: 'u@test.com', role: 'ADMIN', telefone: data.telefone ?? null, foto: data.foto ?? null };
      }),
      findUnique: vi.fn(async () => ({ telefone: '11999999999', foto: null })),
    };
  }
  return { ...actual, PrismaClient: MockPrisma };
});

describe('PATCH /api/users/me', () => {
  beforeEach(() => {
    (getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'user-1', name: 'User', email: 'u@test.com', role: 'ADMIN' } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('atualiza nome e telefone com sucesso', async () => {
    const req = new Request('http://x/api/users/me', { method: 'PATCH', body: JSON.stringify({ name: 'Novo Nome', telefone: '(11) 99999-9999' }) });
    const res = await PATCH(req as unknown as Request);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe('Novo Nome');
    expect(json.telefone).toBeDefined();
  });

  it('retorna 400 em validação inválida', async () => {
    const req = new Request('http://x/api/users/me', { method: 'PATCH', body: JSON.stringify({ name: 'a' }) });
    const res = await PATCH(req as unknown as Request);
    expect(res.status).toBe(400);
  });

  it('retorna 401 quando não autenticado', async () => {
  (getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const req = new Request('http://x/api/users/me', { method: 'PATCH', body: JSON.stringify({ name: 'Ok' }) });
    const res = await PATCH(req as unknown as Request);
    expect(res.status).toBe(401);
  });
});
