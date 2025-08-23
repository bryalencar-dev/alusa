import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(req: Request){
  if(process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { cobrancaId } = await req.json();
  if(!cobrancaId) return NextResponse.json({ error: 'cobrancaId required' }, { status: 400 });
  await prisma.cobranca.update({ where: { id: cobrancaId }, data: { status: 'PAGA', pagoEm: new Date() } }).catch(()=>{});
  return NextResponse.json({ ok: true });
}