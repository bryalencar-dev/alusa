import { PrismaClient, type Usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export type AuthUser = { id: string; email: string; nome: string; role: string; contaId?: string };

// verifyCredentials: busca em Usuario e valida senha
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  try {
    const inputEmail = email.trim();
    type SelectedUser = Pick<Usuario, 'id' | 'email' | 'nome' | 'role' | 'senhaHash' | 'status' | 'contaId'>;
    const user: SelectedUser | null = await prisma.usuario.findFirst({
      where: { email: { equals: inputEmail, mode: 'insensitive' } },
      select: { id: true, email: true, nome: true, role: true, senhaHash: true, status: true, contaId: true }
    });
    if (!user) {
      if (process.env.AUTH_DEBUG === 'true') console.debug('[auth] user not found', { email: inputEmail });
      return null;
    }
    // Bloquear login para usuários inativos
  if (user.status && String(user.status).toUpperCase() !== 'ATIVO') {
      if (process.env.AUTH_DEBUG === 'true') console.debug('[auth] user inactive', { email: inputEmail, status: (user as unknown as { status?: string }).status });
      return null;
    }
    const pepper = process.env.BCRYPT_PEPPER || '';
    let ok = await bcrypt.compare(password + pepper, user.senhaHash);
    // Fallback de desenvolvimento: se houver divergência de pepper, tentar sem pepper
    if (!ok && process.env.NODE_ENV !== 'production') {
      ok = await bcrypt.compare(password, user.senhaHash);
      if (process.env.AUTH_DEBUG === 'true') console.debug('[auth] pepper mismatch? tried without pepper', { email: inputEmail, ok });
    }
    if (!ok) {
      if (process.env.AUTH_DEBUG === 'true') console.debug('[auth] invalid password', { email: inputEmail });
      return null;
    }
  return { id: user.id, email: user.email, nome: user.nome, role: user.role, contaId: user.contaId };
  } catch {
    // Falha inesperada (ex.: conexão). Não expor detalhes.
    return null;
  }
}
