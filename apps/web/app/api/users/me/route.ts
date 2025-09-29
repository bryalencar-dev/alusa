import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isTest = process.env.TEST_ROUTES_ENABLED === 'true';

    if (!session?.user) {
      if (isTest) {
        // Fallback para usuário admin do seed em ambiente de teste
        // Ordem segura: 1) Conta -> 2) Usuário -> 3) Atualiza ownerUserId
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
          where: { email: 'owner+users-me@example.com' },
          update: {},
          create: {
            id: 'owner-users-me',
            contaId: conta.id,
            nome: 'Owner Users Me',
            email: 'owner+users-me@example.com',
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
        const telefone = admin.telefone ?? null;
        const fotoGet = (admin as unknown as { foto?: string | null }).foto ?? null;
        return NextResponse.json({
          id: admin.id,
          name: admin.nome,
          email: admin.email,
          role: admin.role,
          telefone,
          foto: fotoGet,
        });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enriquecer com telefone a partir do banco; foto pode não estar no client gerado antigo
    let telefone: string | null = null;
    let fotoGet: string | null = null;
    if (session.user.id) {
      const dbUser = await prisma.usuario.findUnique({ where: { id: session.user.id } });
      const u = dbUser as unknown as { telefone?: string | null; foto?: string | null } | null;
      telefone = u?.telefone ?? null;
      fotoGet = u?.foto ?? null;
    }

    // Retorna informações do usuário atual
    return NextResponse.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      telefone,
      foto: fotoGet,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users/me — atualiza nome/telefone/foto do usuário autenticado
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isTest = process.env.TEST_ROUTES_ENABLED === 'true';
    let userId = session?.user?.id;
    if (!userId && isTest) {
      // Garante existência de conta-default e admin em teste
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
        where: { email: 'owner+users-me-patch@example.com' },
        update: {},
        create: {
          id: 'owner-users-me-patch',
          contaId: conta.id,
          nome: 'Owner Users Me Patch',
          email: 'owner+users-me-patch@example.com',
          senhaHash: 'x',
          role: 'ADMIN',
          status: 'ATIVO',
        },
      });
      if (conta.ownerUserId !== owner.id) {
        await prisma.conta.update({ where: { id: conta.id }, data: { ownerUserId: owner.id } });
      }
      let admin = await prisma.usuario.findUnique({
        where: { email: 'admin@example.com' },
        select: { id: true },
      });
      if (!admin) {
        const created = await prisma.usuario.create({
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
          select: { id: true },
        });
        admin = created;
      }
      userId = admin?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const schema = z.object({
      name: z.string().min(2, 'Nome muito curto').optional(),
      telefone: z.string().min(8, 'Telefone inválido').max(20).optional(),
      foto: z.string().url('URL inválida').optional(),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof parsed.data.name !== 'undefined') data.nome = parsed.data.name; // campo no banco é `nome`
    if (typeof parsed.data.telefone !== 'undefined') data.telefone = parsed.data.telefone;
    if (typeof parsed.data.foto !== 'undefined') data.foto = parsed.data.foto;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração fornecida' }, { status: 400 });
    }

    const updated = await prisma.usuario.update({
      where: { id: userId },
      data,
      // seleciona campos base; foto lida abaixo por compatibilidade
      select: { id: true, nome: true, email: true, role: true, telefone: true },
    });

    // Atualiza também a sessão em memória (opcional): a API do NextAuth não permite mutate aqui facilmente;
    // o cliente pode refazer GET /api/users/me para refletir alterações.

    const u2 = updated as unknown as {
      id: string;
      nome: string;
      email: string;
      role: string;
      telefone: string | null;
      foto?: string | null;
    };
    return NextResponse.json({
      id: updated.id,
      name: updated.nome,
      email: updated.email,
      role: updated.role,
      telefone: updated.telefone ?? null,
      foto: u2.foto ?? null,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
