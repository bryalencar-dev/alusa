// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { verifyCredentials } from '../../lib/auth/auth-service';

const USERS = [
  { email: 'aluno@example.com', senha: 'senha123' },
  { email: 'professor@example.com', senha: 'senha123' },
  { email: 'responsavel@example.com', senha: 'senha123' }
];

describe('verifyCredentials()', () => {
  for (const u of USERS) {
    it(`autentica ${u.email}`, async () => {
      const r = await verifyCredentials(u.email, u.senha);
      expect(r).toBeTruthy();
      expect(r?.email).toBe(u.email);
      expect(r?.id).toBeTruthy();
      expect(r?.role).toBeTruthy();
    });
  }
  it('retorna null para senha incorreta', async () => {
    const r = await verifyCredentials('aluno@example.com', 'errada');
    expect(r).toBeNull();
  });
});
