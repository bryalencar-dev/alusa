import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyCredentials } from '@/lib/auth-service';
import { resetDb } from '../../tests/utils/reset-db';

const prisma = new PrismaClient();

describe('verifyCredentials', () => {
  const email = 'test@example.com';
  const senha = 'SenhaFort3!';
    beforeAll(async () => {
      await resetDb(prisma);
      const senhaHash: string = await bcrypt.hash(senha, 10);
      // Cria usuario com conta aninhada para evitar problemas de FK em ambientes recém-resetados
      await prisma.usuario.create({
        data: {
          nome: 'Teste',
          email,
          senhaHash,
          role: 'ADMIN',
          conta: { create: { nome: 'Conta Teste', cpfCnpj: '00000000000' } }
        }
      });
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