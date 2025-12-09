import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { encerrarContratosExpirados } from '@alusa/lib';

export const dynamic = 'force-dynamic';

type SessionUser = {
  id?: string;
  role?: string;
  contaId?: string;
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * POST /api/jobs/encerrar-contratos
 *
 * Executa o job de encerramento automático de contratos expirados.
 * Pode ser chamado manualmente por admins ou por um cron job externo.
 *
 * Query params:
 * - contaId (opcional): se informado, processa apenas matrículas desta conta
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const user = (session as { user?: SessionUser } | null)?.user ?? null;

    // Verificar se é admin ou request de cron (pode usar header ou token)
    const cronToken = req.headers.get('x-cron-token');
    const isValidCron = cronToken === process.env.CRON_SECRET_TOKEN;
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

    if (!isValidCron && !isAdmin) {
      return jsonError(403, 'PERMISSAO_NEGADA', 'Apenas admins podem executar este job.');
    }

    const url = new URL(req.url);
    const contaId = url.searchParams.get('contaId') ?? undefined;

    // Se não for admin, só pode processar sua própria conta
    if (!isAdmin && contaId && contaId !== user?.contaId) {
      return jsonError(403, 'CONTA_INVALIDA', 'Você só pode processar contratos da sua conta.');
    }

    const result = await encerrarContratosExpirados(contaId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[Job Encerrar Contratos] Erro:', error);
    return jsonError(500, 'ERRO_JOB', (error as Error).message);
  }
}

/**
 * GET /api/jobs/encerrar-contratos
 *
 * Retorna informações sobre o job (para debug/monitoramento).
 */
export async function GET() {
  return NextResponse.json({
    job: 'encerrar-contratos-expirados',
    description: 'Encerra automaticamente contratos com dataFimContrato < hoje',
    method: 'POST',
    params: {
      contaId: 'opcional - processa apenas matrículas desta conta',
    },
    headers: {
      'x-cron-token': 'token para execução via cron (opcional se admin)',
    },
  });
}
