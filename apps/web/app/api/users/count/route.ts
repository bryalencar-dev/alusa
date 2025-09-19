import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  if (process.env.TEST_ROUTES_ENABLED !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 404 });
  }
  const count = await prisma.usuario.count();
  return NextResponse.json({ count });
}
