import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { assertTestRoutesEnabled } from '../../_guard';

export async function POST(req: Request){
  try { assertTestRoutesEnabled(); } catch (e){
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 403 });
  }
  const { matriculaId, status } = await req.json();
  if(!matriculaId || !status) return NextResponse.json({ error: 'params' }, { status: 400 });
  const m = await prisma.matricula.findUnique({ where: { id: matriculaId } });
  if(!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Cria presença simples (usa turmaId da matrícula se houver, senão cria turma dummy)
  let turmaId = m.turmaId;
  if(!turmaId){
    const turma = await prisma.turma.create({ data: { nome: 'Turma Auto' } });
    turmaId = turma.id;
    await prisma.matricula.update({ where: { id: m.id }, data: { turmaId } });
  }
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const existente = await prisma.presenca.findFirst({ where: { alunoId: m.alunoId, turmaId, dataAula: hoje } });
  if(!existente){
    await prisma.presenca.create({ data: { alunoId: m.alunoId, turmaId, dataAula: hoje, status } });
  }
  return NextResponse.json({ ok: true });
}