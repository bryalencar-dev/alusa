import { NextResponse } from 'next/server';
import { prisma } from '@/src/prisma';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'missing_email' }, { status: 400 });
  const user = await prisma.usuario.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } }, select: { id: true, email: true, nome: true, role: true } });
  if (!user) return NextResponse.json({ exists: false }, { status: 200 });
  return NextResponse.json({ exists: true, user }, { status: 200 });
}
