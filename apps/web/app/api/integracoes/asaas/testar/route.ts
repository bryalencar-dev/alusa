import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAsaasClientForConta } from '@alusa/lib/asaas/client';
import { loadDecryptedAsaasCredentials } from '@alusa/lib';

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

    // Garante que há token salvo por conta antes de chamar o Asaas
    const creds = await loadDecryptedAsaasCredentials(user.contaId).catch(() => null);
    if (!creds?.apiKey) {
      return json(422, { error: 'Token da API do Asaas não configurado para esta conta.' });
    }

    const client = await getAsaasClientForConta(user.contaId);
    // Chamada simples para validar token (endpoint /payments com limit=1)
    const resp = await client.get('/payments', { params: { limit: 1 } });
    if (resp.status >= 200 && resp.status < 300) {
      return json(200, { ok: true });
    }
    return json(502, { ok: false, error: 'Resposta inesperada do Asaas' });
  } catch (e) {
    const errorMessage = (e as Error).message;
    console.error('[API Integracoes Asaas][testar] Erro', e);
    
    // Mensagens de erro mais descritivas baseadas na resposta do Asaas
    if (errorMessage.includes('invalid_access_token')) {
      return json(401, { ok: false, error: 'Token inválido ou revogado. Verifique sua chave API no painel do Asaas.' });
    }
    if (errorMessage.includes('invalid_environment')) {
      return json(401, { ok: false, error: 'Token não pertence a este ambiente. Verifique se está usando token de Sandbox ou Produção corretamente.' });
    }
    if (errorMessage.includes('access_token_not_found')) {
      return json(401, { ok: false, error: 'Token não encontrado na requisição. Erro de configuração.' });
    }
    if (errorMessage.includes('ENCRYPTION_KEY')) {
      return json(500, { ok: false, error: 'Erro de configuração do servidor. ENCRYPTION_KEY não está configurada.' });
    }
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      return json(502, { ok: false, error: 'Não foi possível conectar ao servidor Asaas. Verifique a URL base configurada.' });
    }
    
    return json(502, { ok: false, error: errorMessage });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
