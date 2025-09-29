import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { verifyCredentials } from '@/lib/auth-service';
import { createFirstUser } from '@/lib/first-user-service';
import { resetDb } from '../../tests/utils/reset-db';

// Só roda estes testes se houver DATABASE_URL real (Postgres),
// evitando falhas quando Prisma está configurado para Data Proxy ou sem DB local.
const hasDb = !!process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
const describeIf = hasDb ? describe : describe.skip;

describeIf('verifyCredentials', () => {
  const prisma = new PrismaClient();
  const email = 'test@example.com';
  const senha = 'SenhaFort3!';
    beforeAll(async () => {
      await resetDb(prisma);
      // Cria conta e usuário inicial (owner) usando o serviço oficial
      await createFirstUser({ escolaNome: 'Conta Teste', cpfCnpj: '00000000000', nome: 'Teste', email, senha });
    });
  afterAll(async () => { await prisma.$disconnect(); });
  it('retorna usuário válido com credenciais corretas', async () => {
    const res = await verifyCredentials(email, senha);
    expect(res?.email).toBe(email);
    expect(res?.role).toBe('ADMIN');
  });
  it('retorna null para senha incorreta', async () => {
    const res = await verifyCredentials(email, 'errada');
    expect(res).toBeNull();
  });
});