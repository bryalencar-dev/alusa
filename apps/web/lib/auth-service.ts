import { PrismaClient, type Usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export type AuthUser = { id: string; email: string; nome: string; role: string };

// verifyCredentials: busca em Usuario e valida senha
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  try {
  const user: Usuario | null = await prisma.usuario.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.senhaHash);
    if (!ok) return null;
    return { id: user.id, email: user.email, nome: user.nome, role: user.role };
  } catch {
    // Falha inesperada (ex.: conexão). Não expor detalhes.
    return null;
  }
}
