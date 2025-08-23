import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';

export type AuthUser = { id: string; email: string; name: string; role: string };

/**
 * Verifica credenciais contra prisma.user (schema atual) e fallback prisma.usuario (legado).
 * Retorna objeto simplificado para sessão ou null se inválido.
 */
export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  if (!email || !password) return null;

  // Modelo User (atual) com Role relacionada
  try {
  const u = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (u?.senhaHash) {
      const ok = await bcrypt.compare(password, u.senhaHash);
      if (ok) {
    // Prioriza perfil granular (ADMIN | PROFESSOR | RESPONSAVEL | ALUNO) se existir
    const perfilRole = (u as any).perfil as string | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
    const role = (perfilRole && ['ADMIN','PROFESSOR','RESPONSAVEL','ALUNO'].includes(perfilRole)) ? perfilRole : (u.role?.name || 'USER');
  return { id: u.id, email: u.email, name: u.email.split('@')[0], role };
      }
    }
  } catch (e) {
    console.warn('[auth-service] erro user', (e as Error).message);
  }

  // Fallback modelo legado Usuario se existir, incluindo perfil
  try {
    const anyPrisma = prisma as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (anyPrisma.usuario) {
      const uu = await anyPrisma.usuario.findUnique({ where: { email } });
      if (uu?.senhaHash) {
        const ok = await bcrypt.compare(password, uu.senhaHash);
        if (ok) {
          let role: string | undefined = (uu as any)?.role; // eslint-disable-line @typescript-eslint/no-explicit-any
          if (!role) {
            try {
              const ups = await anyPrisma.usuarioPerfil.findMany({
                where: { usuarioId: uu.id },
                include: { perfil: true },
                take: 1
              });
              role = ups?.[0]?.perfil?.nome;
            } catch { /* ignore */ }
          }
          role = role || 'USER';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { id: uu.id, email: uu.email, name: (uu as any).nome || uu.email, role };
        }
      }
    }
  } catch (e) {
    console.warn('[auth-service] erro usuario legado', (e as Error).message);
  }

  return null;
}
