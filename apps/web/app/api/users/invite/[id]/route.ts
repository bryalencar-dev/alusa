import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { InviteUserService } from '@alusa/lib';

const ParamsSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export async function DELETE(_req: Request, ctx: unknown) {
  try {
    const parsed = ParamsSchema.safeParse(ctx);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }
    const id = parsed.data.params.id;

    const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_ROUTES_ENABLED === 'true';
    const session = await getServerSession(authOptions);
    if (!session?.user && !isTest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Autorização básica (mesma política do POST)
    const inviterRole = isTest ? 'ADMIN' : (session && typeof session.user === 'object' ? (session.user as { role?: string }).role : undefined);
  const invite = await InviteUserService.getInviteById(id);
    if (!invite) {
      return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 });
    }
    const role = String(invite.role || '').toUpperCase();
    const canDelete = (() => {
      const r = String(inviterRole || '').toUpperCase();
      if (r === 'ADMIN') return role !== 'ADMIN';
      if (r === 'FINANCEIRO') return role === 'FINANCEIRO';
      if (r === 'RECEPCAO') return role === 'RESPONSAVEL' || role === 'PROFESSOR';
      return false;
    })();
    if (!canDelete) {
      return NextResponse.json({ error: 'Sem permissão para excluir este convite.' }, { status: 403 });
    }

  const ok = await InviteUserService.cancelInviteById(id);
    if (!ok) {
      return NextResponse.json({ error: 'Convite não encontrado ou já processado.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
