import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request){
  if(process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { qr } = await req.json();
  if(!qr) return NextResponse.json({ error: 'qr required' }, { status: 400 });
  const ingresso = await prisma.ingresso.findFirst({ where: { qrCode: qr } });
  if(!ingresso) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if(ingresso.usadoEm) return NextResponse.json({ error: 'already used' }, { status: 409 });
  await prisma.ingresso.update({ where: { id: ingresso.id }, data: { usadoEm: new Date() } });
  return NextResponse.json({ ok: true });
}