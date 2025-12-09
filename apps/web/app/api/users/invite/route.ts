import { NextResponse } from 'next/server';
import { InviteUserService } from '@alusa/lib';
import { Role as PrismaRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ipFromRequest, rateLimit } from '@/lib/rate-limit';

const Roles = ['ADMIN', 'FINANCEIRO', 'RECEPCAO', 'PROFESSOR', 'RESPONSAVEL', 'ALUNO'] as const;

const inviteSchema = z.object({
  email: z.union([
    z.string().email('Email inválido'),
    z.null(),
    z.undefined(),
  ]).optional(), // Opcional para RESPONSAVEL
  role: z.enum(Roles).default('RECEPCAO'),
  escolaId: z.string().optional(),
  alunosIds: z.array(z.string()).optional(), // IDs dos alunos para vincular ao RESPONSAVEL
});

export async function POST(req: Request) {
  try {
    // Rate limit: 30 reqs / 15min por IP
    const ip = ipFromRequest(req);
    const rl = rateLimit(`invite:create:${ip}`, 30, 15 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 });
    const body: unknown = await req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

  const { email, role, alunosIds } = parsed.data as { email?: string; role: typeof Roles[number]; alunosIds?: string[] };
    
    // Bloquear convites para ADMIN — primeiro admin só via first-register
    if (role === 'ADMIN') {
      console.warn(`[AUDIT] Convite ADMIN bloqueado para ${email || 'unknown'}`);
      return NextResponse.json({ error: 'Convites para ADMIN não são permitidos.' }, { status: 403 });
    }
    
    // Validações específicas por role
    if (role === 'RESPONSAVEL') {
      // RESPONSAVEL: não precisa de email, mas precisa de alunos
      if (!alunosIds || alunosIds.length === 0) {
        return NextResponse.json({ error: 'É necessário vincular ao menos um aluno ao responsável.' }, { status: 400 });
      }
    } else {
      // Outras roles: email é obrigatório
      if (!email) {
        return NextResponse.json({ error: 'Email é obrigatório para esta função.' }, { status: 400 });
      }
    }

    const isTest = process.env.NODE_ENV === 'test' || process.env.TEST_ROUTES_ENABLED === 'true';
    const session = await getServerSession(authOptions);
    if (!session?.user && !isTest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Restrito a ADMIN — se há sessão, usa a role dela; em teste sem sessão, assume ADMIN
    const inviterRole = (session && typeof session.user === 'object' ? (session.user as { role?: string }).role : undefined) || (isTest ? 'ADMIN' : undefined);
    const isAdmin = String(inviterRole || '').toUpperCase() === 'ADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'Sem permissão para convidar este papel.' }, { status: 403 });

    // invitedById: preferir o usuário da sessão quando existir; em teste puro sem sessão, usa mock
    const invitedById = (session && typeof session.user === 'object' ? (session.user as { id?: string }).id : undefined) || (isTest ? 'admin-mock' : undefined);
    if (!invitedById) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      // Se há email, verificar se já existe usuário
      if (email) {
        const normalizedEmail = email.toLowerCase();
        const exists = await prisma.usuario.findUnique({ where: { email: normalizedEmail } });
        if (exists) {
          console.warn(`[AUDIT] Convite bloqueado por e-mail já existente: ${email}`);
          return NextResponse.json({ error: 'Usuário já cadastrado com este e-mail.' }, { status: 409 });
        }
      }
      
      // Criar convite (com ou sem email)
      const invite = await InviteUserService.createInvite(
        email ?? undefined,
        PrismaRole[role as keyof typeof PrismaRole], 
        invitedById
      );
      
      // Se for RESPONSAVEL, armazenar os IDs dos alunos no metadata do convite
      if (role === 'RESPONSAVEL' && alunosIds && alunosIds.length > 0) {
        await prisma.invite.update({
          where: { id: invite.id },
          data: {
            metadata: {
              alunosIds,
            },
          },
        });
      }
      
      // Construir link de registro (mesma rota para todos)
      const base = (process.env.NEXT_PUBLIC_APP_URL as string | undefined) ?? 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      
      const inviteUrl = `${base}/auth/register?token=${invite.token}`;
      
      return NextResponse.json({ 
        invite: {
          ...invite,
          inviteUrl,
        }
      }, { status: 201 });
    } catch (e: unknown) {
      const msg = (e instanceof Error) ? e.message : 'Erro ao criar convite';
      if (msg.includes('já existe') || msg.includes('cadastrado')) {
        console.warn(`[AUDIT] Convite duplicado bloqueado para ${email}`);
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      if (msg.includes('Admin') || msg.includes('ADMIN')) {
        return NextResponse.json({ error: msg }, { status: 403 });
      }
      throw e;
    }
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const contaId = (session.user as unknown as { contaId?: string }).contaId;
    if (!contaId) return NextResponse.json({ items: [] });
    const invites = await InviteUserService.listInvitesByConta(contaId);
    return NextResponse.json({ items: invites });
  } catch (error) {
    console.error('Error listing invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}