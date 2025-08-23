import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { assertTestRoutesEnabled } from '../../../_guard';

export async function POST(req: Request){
  try { assertTestRoutesEnabled(); } catch (e){
    const err = e as Error & { status?: number };
    return NextResponse.json({ error: err.message }, { status: err.status ?? 403 });
  }
  const { cobrancaId } = await req.json();
  if(!cobrancaId) return NextResponse.json({ error: 'cobrancaId required' }, { status: 400 });
  await prisma.cobranca.update({ where: { id: cobrancaId }, data: { status: 'PAGA', pagoEm: new Date() } }).catch(()=>{});
  return NextResponse.json({ ok: true });
}