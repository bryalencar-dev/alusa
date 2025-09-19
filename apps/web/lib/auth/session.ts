import { getServerSession } from 'next-auth';
import { authOptions } from '../auth-options';

export type SessionUser = {
  id: string;
  role: 'ADMIN' | 'RECEPCAO' | string;
  contaId: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = (await getServerSession(authOptions)) as unknown as { user?: { id?: string; role?: string; contaId?: string } };
  const user = session?.user;
  if (!user?.id || !user?.role) return null;
  const contaId: string = user.contaId ?? 'conta-default';
  return { id: String(user.id), role: (user.role as 'ADMIN' | 'RECEPCAO' | string), contaId };
}
