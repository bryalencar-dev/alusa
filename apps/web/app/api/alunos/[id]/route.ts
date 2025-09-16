import { NextResponse } from 'next/server';
import { alunoUpdateSchema, updateAluno, deleteAluno } from '@alusa/lib';

// no extra types needed

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = alunoUpdateSchema.parse({ ...body, id: params.id });
    const aluno = await updateAluno(parsed);
    return NextResponse.json(aluno);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
  const url = new URL(req.url);
  const motivo = url.searchParams.get('motivo') || undefined;
  const aluno = await deleteAluno(params.id, motivo);
    return NextResponse.json(aluno);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
