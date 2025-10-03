import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAsaasClientForConta } from '@alusa/lib/asaas/client';

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const user = (session as { user?: { contaId?: string; role?: string } } | null)?.user;
    if (!user?.contaId) return json(401, { error: 'NAO_AUTENTICADO' });
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return json(403, { error: 'SEM_PERMISSAO' });

    const client = await getAsaasClientForConta(user.contaId);
    // Chamada simples para validar token (endpoint de me/ myAccount não existe público; usamos listagem vazia paginada)
    const resp = await client.get('/payments', { params: { limit: 1 } });
    if (resp.status >= 200 && resp.status < 300) {
      return json(200, { ok: true });
    }
    return json(502, { ok: false });
  } catch (e) {
    return json(502, { ok: false, error: (e as Error).message });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
