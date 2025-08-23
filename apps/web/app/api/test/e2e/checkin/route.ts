import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { assertTestRoutesEnabled } from '../../_guard';

export async function POST(req: Request){
  try { assertTestRoutesEnabled(); } catch (e){
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 403 });
  }
  const { qr } = await req.json();
  if(!qr) return NextResponse.json({ error: 'qr required' }, { status: 400 });
  const ingresso = await prisma.ingresso.findFirst({ where: { qrCode: qr } });
  if(!ingresso) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if(ingresso.usadoEm) return NextResponse.json({ error: 'already used' }, { status: 409 });
  await prisma.ingresso.update({ where: { id: ingresso.id }, data: { usadoEm: new Date() } });
  return NextResponse.json({ ok: true });
}