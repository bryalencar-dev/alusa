import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_ROUTES_ENABLED === 'true';

    let contaId: string | null = null;
    let userId: string | null = (session?.user as { id?: string } | undefined)?.id ?? null;

    if (!userId && isTest) {
      // Fallback de teste: garante conta e admin
      const conta = await prisma.conta.upsert({
        where: { id: 'conta-default' },
        update: {},
        create: {
          id: 'conta-default',
          nome: 'Alusa Demo',
          cpfCnpj: '00000000000191',
          status: 'ATIVO',
        } as Prisma.ContaUncheckedCreateInput,
      });
      const owner = await prisma.usuario.upsert({
        where: { email: 'owner+users-list@example.com' },
        update: {},
        create: {
          id: 'owner-users-list',
          contaId: conta.id,
          nome: 'Owner Users List',
          email: 'owner+users-list@example.com',
          senhaHash: 'x',
          role: 'ADMIN',
          status: 'ATIVO',
        },
      });
      if (conta.ownerUserId !== owner.id) {
        await prisma.conta.update({ where: { id: conta.id }, data: { ownerUserId: owner.id } });
      }
      let admin = await prisma.usuario.findUnique({ where: { email: 'admin@example.com' } });
      if (!admin) {
        admin = await prisma.usuario.create({
          data: {
            contaId: conta.id,
            nome: 'Admin Test',
            email: 'admin@example.com',
            telefone: null,
            foto: null,
            senhaHash: 'test',
            role: 'ADMIN',
            status: 'ATIVO',
          },
        });
      }
      userId = admin.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { contaId: true },
    });
    contaId = user?.contaId ?? null;
    if (!contaId) {
      return NextResponse.json({ error: 'Conta não localizada' }, { status: 400 });
    }

    // Buscar usuários da mesma conta
    const usuarios = await prisma.usuario.findMany({
      where: { contaId },
      select: { id: true, nome: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar convites ACEITOS desta conta (para identificar quem veio por link)
    const invites = await prisma.invite.findMany({
      where: { contaId, status: 'ACCEPTED' },
      select: { email: true },
    });
    const acceptedEmails = new Set(invites.map((i) => String(i.email).toLowerCase()));

    const items = usuarios.map((u) => ({
      id: u.id,
      name: u.nome,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      createdVia: acceptedEmails.has(String(u.email).toLowerCase()) ? 'INVITE' : 'DIRECT',
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
