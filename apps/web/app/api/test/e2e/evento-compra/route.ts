import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request){
  if(process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { alunoEmail } = await req.json();
  if(!alunoEmail) return NextResponse.json({ error: 'alunoEmail required' }, { status: 400 });
  const aluno = await prisma.aluno.findFirst({ where: { email: alunoEmail } });
  if(!aluno) return NextResponse.json({ error: 'aluno not found' }, { status: 404 });
  const conta = await prisma.conta.create({ data: { nome: 'Conta Evento E2E' } });
  const evento = await prisma.evento.create({ data: { contaId: conta.id, nome: 'Evento E2E', dataInicio: new Date(), dataFim: new Date(Date.now()+3600000), tipo: 'WORKSHOP', status: 'ATIVO' } });
  const tipo = await prisma.tipoIngresso.create({ data: { eventoId: evento.id, nome: 'Padrão', valor: 50, qtdDisponivel: 100 } });
  const inscricao = await prisma.inscricaoEvento.create({ data: { eventoId: evento.id, tipoIngressoId: tipo.id, alunoId: aluno.id, quantidade: 1, valorTotal: 50 } });
  const ingresso = await prisma.ingresso.create({ data: { inscricaoId: inscricao.id, qrCode: 'QR-'+inscricao.id } });
  // cria cobrança associada ao evento
  await prisma.cobranca.create({ data: { eventoId: evento.id, valor: 50, vencimento: new Date(), status: 'PENDENTE' } });
  return NextResponse.json({ eventoId: evento.id, ingressoId: ingresso.id, qr: ingresso.qrCode });
}