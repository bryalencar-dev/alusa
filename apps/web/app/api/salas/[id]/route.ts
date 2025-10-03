import { NextResponse } from 'next/server';
import { updateSala, deleteSala, salaSchema } from '@alusa/lib';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const body = await req.json();
    const contaId = typeof body.contaId === 'string' ? body.contaId.trim() : '';
    if (!contaId) return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    if (
      body.nome !== undefined ||
      body.capacidade !== undefined ||
      body.status !== undefined ||
      body.descricao !== undefined
    ) {
      const parsed = salaSchema.partial().safeParse({
        nome: body.nome,
        capacidade: body.capacidade,
        status: body.status,
        // Normaliza null -> undefined
        descricao: body.descricao === null ? undefined : body.descricao,
      });
      if (!parsed.success)
        return jsonError(422, 'ERRO_VALIDACAO', 'Falha de validação', parsed.error.flatten());
    }
    try {
      const sala = await updateSala({
        id: ctx.params.id,
        contaId,
        nome: body.nome,
        descricao: body.descricao,
        capacidade: body.capacidade,
        status: body.status,
      });
      return NextResponse.json({ data: sala });
    } catch (e) {
      return jsonError(400, 'ERRO_ATUALIZAR_SALA', (e as Error).message);
    }
  } catch (e) {
    return jsonError(400, 'REQUISICAO_INVALIDA', (e as Error).message);
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const contaId = url.searchParams.get('contaId')?.trim();
    if (!contaId) return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    try {
      const sala = await deleteSala(ctx.params.id, contaId);
      return NextResponse.json({ data: sala });
    } catch (e) {
      return jsonError(400, 'ERRO_EXCLUIR_SALA', (e as Error).message);
    }
  } catch (e) {
    return jsonError(400, 'REQUISICAO_INVALIDA', (e as Error).message);
  }
}
