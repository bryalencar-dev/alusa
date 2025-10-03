import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { atualizarStatusMatricula, cancelarMatricula, buscarMatriculaPorId } from '@alusa/lib';
import { StatusMatricula } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

async function resolveContaId(explicit?: string | null) {
  const session = await getServerSession(authOptions).catch(() => null);
  const sessionContaId = (session as { user?: { contaId?: string } } | null)?.user?.contaId || null;
  const requested = explicit?.trim() || null;
  if (requested && sessionContaId && requested !== sessionContaId) {
    return { contaId: null, mismatch: true, sessionContaId };
  }
  return { contaId: requested || sessionContaId, mismatch: false, sessionContaId };
}

const statusValues = new Set(Object.values(StatusMatricula));

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const contaCtx = await resolveContaId(null);
    if (!contaCtx.contaId) {
      return jsonError(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    }

    const matricula = await buscarMatriculaPorId({
      id: ctx.params.id,
      contaId: contaCtx.contaId,
    });

    if (!matricula) {
      return jsonError(404, 'NAO_ENCONTRADO', 'Matrícula não encontrada');
    }

    return NextResponse.json({ matricula }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    return jsonError(500, 'ERRO_BUSCAR_MATRICULA', (error as Error).message);
  }
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
    if (!contaCtx.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    const statusRaw = (body as { status?: unknown }).status;
    if (typeof statusRaw !== 'string' || !statusValues.has(statusRaw as StatusMatricula)) {
      return jsonError(422, 'STATUS_INVALIDO', 'Status informado é inválido.');
    }
    const dataFimRaw = (body as { dataFim?: unknown }).dataFim;
    let dataFim: Date | undefined = undefined;
    if (typeof dataFimRaw === 'string' && dataFimRaw.trim().length) {
      const parsed = new Date(dataFimRaw);
      if (!Number.isNaN(parsed.getTime())) dataFim = parsed;
    } else if (dataFimRaw instanceof Date) {
      dataFim = dataFimRaw;
    }

    const matricula = await atualizarStatusMatricula({
      id: ctx.params.id,
      contaId: contaCtx.contaId,
      status: statusRaw as StatusMatricula,
      dataFim,
    });

    return NextResponse.json(
      {
        data: {
          id: matricula.id,
          alunoId: matricula.alunoId,
          planoId: matricula.planoId,
          turmaId: matricula.turmaId,
          comboId: matricula.comboId,
          status: matricula.status,
          dataInicio: matricula.dataInicio.toISOString(),
          dataFim: matricula.dataFim ? matricula.dataFim.toISOString() : null,
          taxaMatricula: matricula.taxaMatricula ? Number(matricula.taxaMatricula) : null,
          asaasId: matricula.asaasId,
          createdAt: matricula.createdAt.toISOString(),
          updatedAt: matricula.updatedAt.toISOString(),
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('Erro ao atualizar matrícula:', error);
    if ((error as { name?: string }).name === 'ZodError') {
      return jsonError(422, 'ERRO_VALIDACAO', (error as Error).message, error as Error);
    }
    return jsonError(500, 'ERRO_ATUALIZAR_MATRICULA', (error as Error).message);
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const contaCtx = await resolveContaId(url.searchParams.get('contaId'));
    if (contaCtx.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!contaCtx.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    await cancelarMatricula({ id: ctx.params.id, contaId: contaCtx.contaId });
    return NextResponse.json(
      { success: true },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('Erro ao cancelar matrícula:', error);
    return jsonError(500, 'ERRO_CANCELAR_MATRICULA', (error as Error).message);
  }
}
