import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request){
  if(process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { alunoEmail, planoNome, turmaNome, taxa } = await req.json();
  if(!alunoEmail || !planoNome) return NextResponse.json({ error: 'params' }, { status: 400 });
  const aluno = await prisma.aluno.findFirst({ where: { email: alunoEmail } });
  if(!aluno) return NextResponse.json({ error: 'aluno not found' }, { status: 404 });
  let plano = await prisma.plano.findFirst({ where: { nome: planoNome } });
  if(!plano){ plano = await prisma.plano.create({ data: { nome: planoNome, mensalidade: 100 } }); }
  let turmaId: string | undefined;
  if(turmaNome){
    let turma = await prisma.turma.findFirst({ where: { nome: turmaNome } });
    if(!turma) turma = await prisma.turma.create({ data: { nome: turmaNome } });
    turmaId = turma.id;
  }
  const matricula = await prisma.matricula.create({ data: { alunoId: aluno.id, planoId: plano.id, turmaId, dataInicio: new Date(), status: 'ATIVA', taxaMatricula: taxa } });
  // desconto: não implementa lógica detalhada - placeholder (poderia criar registros em Desconto/DescontoMatricula)
  return NextResponse.json({ id: matricula.id });
}