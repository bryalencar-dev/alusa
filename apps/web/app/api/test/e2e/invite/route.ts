import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request){
  if(process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  let email: string | undefined;
  try {
    const body = await req.json();
    email = body?.email;
  } catch { /* corpo vazio */ }
  if(!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  // Gera token de convite simples (não persiste ainda em tabela Invite se não existir schema funcional para fluxo real) - fallback
  // Caso exista tabela Invite usamos.
  let token = crypto.randomBytes(12).toString('hex');
  try {
    const invite = await prisma.invite.create({ data: { email, token, expiresAt: new Date(Date.now()+1000*60*60*24) } });
    token = invite.token;
  } catch {
    // tabela pode não permitir duplicado, fallback permanece
  }
  const link = `http://localhost:3000/convite/${token}`;
  return NextResponse.json({ token, link });
}