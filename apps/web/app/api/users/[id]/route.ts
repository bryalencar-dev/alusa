import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const patchSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
});

async function requireAdminAndGetContaId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: 'Unauthorized', status: 401 } as const;
  const role = String((session.user as { role?: string }).role || '').toUpperCase();
  if (role !== 'ADMIN') return { error: 'Forbidden', status: 403 } as const;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return { error: 'Unauthorized', status: 401 } as const;
  const me = await prisma.usuario.findUnique({ where: { id: userId }, select: { contaId: true, id: true } });
  if (!me?.contaId) return { error: 'Conta não localizada', status: 400 } as const;
  return { contaId: me.contaId, currentUserId: me.id } as const;
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdminAndGetContaId();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await _req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const where = { id: params.id, contaId: auth.contaId };
    const exists = await prisma.usuario.findFirst({ where, select: { id: true, role: true } });
    if (!exists) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    // Bloquear mudanças de role/status do Owner
    const conta = await prisma.conta.findUnique({ where: { id: auth.contaId }, select: { ownerUserId: true } });
    if (conta && conta.ownerUserId === params.id) {
      // auditoria de tentativa
      console.warn(`[AUDIT] Tentativa de alterar role/status do Owner por ${auth.currentUserId}`);
      return NextResponse.json({ error: 'Alterações no usuário Owner não são permitidas.' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (typeof parsed.data.name !== 'undefined') data.nome = parsed.data.name;
    if (typeof parsed.data.status !== 'undefined') data.status = parsed.data.status;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });

    const updated = await prisma.usuario.update({ where: { id: params.id }, data, select: { id: true, nome: true, email: true, role: true, status: true } });
    return NextResponse.json({ user: { id: updated.id, name: updated.nome, email: updated.email, role: updated.role, status: updated.status } });
  } catch (e) {
    console.error('Error updating user:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdminAndGetContaId();
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (params.id === auth.currentUserId) {
      return NextResponse.json({ error: 'Você não pode inativar a si mesmo.' }, { status: 400 });
    }

    const url = new URL(_req.url);
    const hard = url.searchParams.get('hard') || url.searchParams.get('permanent') || url.searchParams.get('force');
    const isHardDelete = typeof hard === 'string' && ['1','true','yes','on'].includes(hard.toLowerCase());

    const where = { id: params.id, contaId: auth.contaId };
    const exists = await prisma.usuario.findFirst({ where, select: { id: true, status: true } });
    if (!exists) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    // Bloquear exclusão do Owner
    const conta = await prisma.conta.findUnique({ where: { id: auth.contaId }, select: { ownerUserId: true } });
    if (conta && conta.ownerUserId === params.id) {
      console.warn(`[AUDIT] Tentativa de excluir Owner por ${auth.currentUserId}`);
      return NextResponse.json({ error: 'Exclusão do usuário Owner não é permitida.' }, { status: 403 });
    }

    if (isHardDelete) {
      // Exclusão permanente
      const deleted = await prisma.usuario.delete({ where: { id: params.id } });
      return NextResponse.json({ ok: true, id: deleted.id, hard: true });
    }

    // Soft delete (inativar)
    const updated = await prisma.usuario.update({ where: { id: params.id }, data: { status: 'INATIVO' }, select: { id: true } });
    return NextResponse.json({ ok: true, id: updated.id, hard: false });
  } catch (e) {
    console.error('Error deleting user:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
