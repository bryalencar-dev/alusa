import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { editarMatricula } from '@alusa/lib';
import { authOptions } from '@/lib/auth-options';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

type SessionUser = {
  id?: string | null;
  contaId?: string | null;
};

async function resolveContaId(explicit?: string | null) {
  const session = await getServerSession(authOptions).catch(() => null);
  const sessionUser = (session as { user?: SessionUser } | null)?.user ?? null;
  const sessionContaId = sessionUser?.contaId || null;
  const sessionUserId = sessionUser?.id || null;
  const requested = explicit?.trim() || null;
  if (requested && sessionContaId && requested !== sessionContaId) {
    return { contaId: null, mismatch: true, sessionContaId, sessionUserId };
  }
  return {
    contaId: requested || sessionContaId,
    mismatch: false,
    sessionContaId,
    sessionUserId,
  };
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'PAYLOAD_INVALIDO', 'Payload inválido');
    }

    const contaCtx = await resolveContaId((body as { contaId?: string | null }).contaId ?? null);
    if (contaCtx.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!contaCtx.contaId || !contaCtx.sessionUserId) {
      return jsonError(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    }

    const { turmaId, comboId, planoId, motivo } = body as {
      turmaId?: string | null;
      comboId?: string | null;
      planoId?: string | null;
      motivo?: string | null;
    };

    const matricula = await editarMatricula({
      matriculaId: ctx.params.id,
      contaId: contaCtx.contaId,
      createdById: contaCtx.sessionUserId,
      turmaId: turmaId ?? undefined,
      comboId: comboId ?? undefined,
      planoId: planoId ?? undefined,
      motivo: motivo ?? undefined,
    });

    return NextResponse.json(
      {
        data: {
          id: matricula.id,
          turmaId: matricula.turmaId,
          comboId: matricula.comboId,
          planoId: matricula.planoId,
          asaasSubscriptionId: matricula.asaasSubscriptionId,
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[EDITAR_MATRICULA] Erro:', error);
    if ((error as { name?: string }).name === 'ZodError') {
      return jsonError(422, 'ERRO_VALIDACAO', (error as Error).message, error);
    }
    return jsonError(500, 'ERRO_EDITAR_MATRICULA', (error as Error).message);
  }
}
