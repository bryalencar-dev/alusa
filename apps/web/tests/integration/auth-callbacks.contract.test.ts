/* Teste de contrato: valida mapeamento jwt -> session sem subir HTTP */
import { describe, it, expect } from 'vitest';
import { authConfig } from '../../auth.config';

const callbacks = authConfig.callbacks!;

describe('NextAuth callbacks contract', () => {
  it('jwt() copia id/role/email/name quando user presente', async () => {
    const user = { id: 'u1', email: 'aluno@example.com', name: 'Aluno', role: 'ADMIN' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const tokenOut = await callbacks.jwt!({ token: {}, user } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((tokenOut as any).id).toBe('u1'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((tokenOut as any).role).toBe('ADMIN'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(tokenOut.email).toBe('aluno@example.com');
    expect(tokenOut.name).toBe('Aluno');
  });

  it('session() materializa session.user completo', async () => {
    const sessionIn = { user: {} } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const token = { id: 'u2', email: 'professor@example.com', name: 'Professor', role: 'PROFESSOR' } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const sessionOut = await callbacks.session!({ session: sessionIn, token } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((sessionOut as any).user.id).toBe('u2'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((sessionOut as any).user.email).toBe('professor@example.com'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((sessionOut as any).user.name).toBe('Professor'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect((sessionOut as any).user.role).toBe('PROFESSOR'); // eslint-disable-line @typescript-eslint/no-explicit-any
  });
});
