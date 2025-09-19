import { NextResponse } from 'next/server';
import { prisma } from '@/src/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Upsert da conta demo em ambientes de desenvolvimento/teste
    if (process.env.NODE_ENV !== 'production') {
      const conta = await prisma.conta.upsert({
        where: { id: 'conta-default' },
        update: {},
        create: { id: 'conta-default', nome: 'Alusa Demo', cpfCnpj: '00000000000191', status: 'ATIVO' },
      });
      return NextResponse.json({ ok: true, conta: { id: conta.id, nome: conta.nome } }, { status: 200 });
    }

    // Em produção, apenas um ping leve ao banco
    const now = await prisma.$queryRawUnsafe<Date[]>(`SELECT NOW()`);
    return NextResponse.json({ ok: true, now: now?.[0] ?? null }, { status: 200 });
  } catch (e: unknown) {
    const message = (e as Error).message || 'erro no health';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
