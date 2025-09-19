import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProfessorUpdateSchema } from '@alusa/lib';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status, headers: { 'cache-control': 'no-store' } });
}
const prisma = new PrismaClient();

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const prof = await prisma.professor.findUnique({ where: { id: ctx.params.id } });
  if (!prof) return jsonError(404, 'NAO_ENCONTRADO', 'Professor não encontrado');
  return NextResponse.json({ data: prof }, { headers: { 'cache-control': 'no-store' } });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const json = await req.json();
    // Regra: impedir alteração de cpf e email
    if (json.cpf !== undefined || json.email !== undefined) {
      return jsonError(400, 'REGRA_NEGOCIO', 'Não é permitido alterar CPF ou e-mail do professor.');
    }

    const parsed = ProfessorUpdateSchema.safeParse(json);
    if (!parsed.success) return jsonError(422, 'ERRO_VALIDACAO', 'Falha de validação', parsed.error.flatten());
    const data = parsed.data;

    // Sanitização mínima
  if (data.nome) data.nome = data.nome.trim();

    try {
      const updated = await prisma.professor.update({ where: { id: ctx.params.id }, data });
      return NextResponse.json({ data: updated });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') return jsonError(409, 'CONFLITO_UNICO', 'Conflito de campos únicos');
      if ((e as { code?: string })?.code === 'P2025') return jsonError(404, 'NAO_ENCONTRADO', 'Professor não encontrado');
      throw e;
    }
  } catch (e: unknown) {
    return jsonError(400, 'REQUISICAO_INVALIDA', (e as Error)?.message || 'Dados inválidos');
  }
}

export async function DELETE() {
  return jsonError(405, 'NAO_SUPORTADO', 'Use status INATIVO como soft delete');
}
