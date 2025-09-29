import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  planoCreateSchema,
  planoUpdateSchema,
  planoFilterSchema,
  listPlanos,
  createPlano,
  updatePlano,
  deletePlano,
} from '@alusa/lib';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

async function resolveContaId(requestContaId: string | null): Promise<string | null> {
  if (requestContaId?.trim()) return requestContaId.trim();
  const session = await getServerSession(authOptions).catch(() => null);
  const sessionContaId =
    (session as { user?: { contaId?: string } } | null)?.user?.contaId?.trim() || null;
  return sessionContaId;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const contaIdParam = url.searchParams.get('contaId');
    const contaId = await resolveContaId(contaIdParam);
    if (!contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    const statusParam = url.searchParams.get('status');
    const searchParam = url.searchParams.get('q') ?? undefined;

    const filtersParse = planoFilterSchema.safeParse({
      contaId,
      status: statusParam === 'ATIVO' || statusParam === 'INATIVO' ? statusParam : undefined,
      search: searchParam,
    });

    if (!filtersParse.success) {
      return jsonError(422, 'ERRO_VALIDACAO', 'Filtros inválidos', filtersParse.error.flatten());
    }

    const planos = await listPlanos(filtersParse.data);
    return NextResponse.json({ data: planos });
  } catch (error) {
    console.error('[planos][GET] erro ao listar planos', error);
    return jsonError(500, 'ERRO_LISTAR_PLANOS', (error as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'REQUISICAO_INVALIDA', 'Payload inválido');
    }

    const contaId = await resolveContaId((body as { contaId?: string }).contaId ?? null);
    if (!contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    const parsed = planoCreateSchema.safeParse({ ...body, contaId });
    if (!parsed.success) {
      return jsonError(422, 'ERRO_VALIDACAO', 'Falha de validação', parsed.error.flatten());
    }

    try {
      const plano = await createPlano(parsed.data);
      return NextResponse.json({ data: plano }, { status: 201 });
    } catch (error) {
      return jsonError(400, 'ERRO_CRIAR_PLANO', (error as Error).message);
    }
  } catch (error) {
    console.error('[planos][POST] erro inesperado', error);
    return jsonError(500, 'ERRO_CRIAR_PLANO', (error as Error).message);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'REQUISICAO_INVALIDA', 'Payload inválido');
    }

    const id = (body as { id?: string }).id?.trim();
    if (!id) {
      return jsonError(400, 'ID_OBRIGATORIO', 'id é obrigatório');
    }

    const contaId = await resolveContaId((body as { contaId?: string }).contaId ?? null);
    if (!contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    const parsed = planoUpdateSchema.safeParse({ ...body, id, contaId });
    if (!parsed.success) {
      return jsonError(422, 'ERRO_VALIDACAO', 'Falha de validação', parsed.error.flatten());
    }

    try {
      const { id: _ignoredId, ...payload } = parsed.data;
      void _ignoredId;
      const plano = await updatePlano(id, payload);
      return NextResponse.json({ data: plano });
    } catch (error) {
      return jsonError(400, 'ERRO_ATUALIZAR_PLANO', (error as Error).message);
    }
  } catch (error) {
    console.error('[planos][PATCH] erro inesperado', error);
    return jsonError(500, 'ERRO_ATUALIZAR_PLANO', (error as Error).message);
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'REQUISICAO_INVALIDA', 'Payload inválido');
    }

    const id = (body as { id?: string }).id?.trim();
    if (!id) {
      return jsonError(400, 'ID_OBRIGATORIO', 'id é obrigatório');
    }

    const contaId = await resolveContaId((body as { contaId?: string }).contaId ?? null);
    if (!contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    try {
      const plano = await deletePlano(id, contaId);
      return NextResponse.json({ data: plano });
    } catch (error) {
      return jsonError(400, 'ERRO_EXCLUIR_PLANO', (error as Error).message);
    }
  } catch (error) {
    console.error('[planos][DELETE] erro inesperado', error);
    return jsonError(500, 'ERRO_EXCLUIR_PLANO', (error as Error).message);
  }
}
