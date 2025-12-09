import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAsaasCredentials, saveAsaasTokenOnly } from '@alusa/lib';
import { invalidateAsaasClientCache } from '@alusa/lib/asaas/client';

// RBAC permitido para gestão de integrações
const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

type SessionUser = { id?: string; role?: string; contaId?: string };
async function resolveAuth(): Promise<{ session: unknown; user: SessionUser | null }> {
  const session = await getServerSession(authOptions).catch(() => null);
  const user = (session as { user?: SessionUser } | null)?.user ?? null;
  return { session, user };
}

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export async function GET() {
  try {
    const { user } = await resolveAuth();
    if (!user?.id || !user?.contaId) return json(401, { error: 'NAO_AUTENTICADO' });
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return json(403, { error: 'SEM_PERMISSAO' });

    const creds = await getAsaasCredentials(user.contaId);
    return json(200, { credentials: creds });
  } catch (e) {
    console.error('[API Integracoes Asaas][GET] Erro', e);
    return json(500, { error: 'ERRO_INTERNO', message: (e as Error).message });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await resolveAuth();
    if (!user?.id || !user?.contaId) return json(401, { error: 'NAO_AUTENTICADO' });
    if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
      return json(403, { error: 'SEM_PERMISSAO' });

    const body = (await req.json().catch(() => null)) as { token?: string } | null;
    if (!body || typeof body !== 'object') return json(400, { error: 'PAYLOAD_INVALIDO' });
    if (!body.token) return json(422, { error: 'CAMPOS_OBRIGATORIOS', missing: ['token'] });

    // Validação básica do formato do token Asaas
    const token = String(body.token).trim();
    if (!token.startsWith('$aact_')) {
      return json(422, {
        error: 'TOKEN_FORMATO_INVALIDO',
        message: 'Token inválido. A chave API do Asaas deve começar com $aact_prod_ (produção) ou $aact_hmlg_ (sandbox).',
      });
    }

    await saveAsaasTokenOnly(user.contaId, token);
    // Garante que novas chamadas usem o token atualizado
    invalidateAsaasClientCache(user.contaId);

    const creds = await getAsaasCredentials(user.contaId);
    return json(200, { saved: true, credentials: creds });
  } catch (e) {
    const errorMessage = (e as Error).message;
    console.error('[API Integracoes Asaas][POST] Erro', e);
    
    // Mensagens de erro mais descritivas
    if (errorMessage.includes('ENCRYPTION_KEY')) {
      return json(500, { 
        error: 'CONFIGURACAO_SERVIDOR', 
        message: 'Erro de configuração do servidor. ENCRYPTION_KEY não está configurada.' 
      });
    }
    
    return json(500, { error: 'ERRO_INTERNO', message: errorMessage });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
