import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createFirstUser, EmailInUseError, CpfCnpjInUseError, PasswordPolicyError } from '@/lib/first-user-service';
import { resetDb } from '../utils/reset-db';

const prisma = new PrismaClient();

describe('createFirstUser', () => {
  beforeEach(async () => { await resetDb(prisma); });

  const base = { escolaNome: 'Escola X', cpfCnpj: '12345678901', nome: 'Admin', email: 'admin@example.com', senha: 'SenhaFort3!' };

  it('cria primeiro usuário ADMIN', async () => {
  interface UserShape { email: string; role: string }
  const u = await createFirstUser(base) as unknown as UserShape;
  expect(u.email).toBe(base.email);
  expect(u.role).toBe('ADMIN');
  });

  it('falha senha fraca', async () => {
    await expect(createFirstUser({ ...base, email: 'a2@example.com', senha: 'fraca' })).rejects.toBeInstanceOf(PasswordPolicyError);
  });

  it('falha email duplicado', async () => {
    await createFirstUser(base);
    await expect(createFirstUser({ ...base, email: 'admin@example.com', cpfCnpj: '22222222222' })).rejects.toBeInstanceOf(EmailInUseError);
  });

  it('falha cpfCnpj duplicado', async () => {
    await createFirstUser(base);
    await expect(createFirstUser({ ...base, email: 'outro@example.com' })).rejects.toBeInstanceOf(CpfCnpjInUseError);
  });
});
