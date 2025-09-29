import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { InviteUserService } from '@alusa/lib';
import { ipFromRequest, rateLimit } from '@/lib/rate-limit';


// Política de senha alinhada ao first-user-service
const passwordMinLength = Number(process.env.PASSWORD_MIN_LENGTH || 8);
const passwordMessage = 'Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.';
const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{' + String(passwordMinLength) + ',}$');

const acceptSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().regex(passwordRegex, passwordMessage),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  // O e-mail será SEMPRE o do convite. Campo permitido no payload será ignorado.
  email: z.string().email('E-mail inválido').optional(),
});

const tokenQuerySchema = z.object({ token: z.string().min(1) });

export async function GET(req: Request) {
  try {
    // Rate limit: 60 reqs / 15 min por IP (consulta de token)
    const ip = ipFromRequest(req);
    const rl = rateLimit(`accept-invite:validate:${ip}`, 60, 15 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 });
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    const parsed = tokenQuerySchema.safeParse({ token });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Token ausente' }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Convite inválido' }, { status: 404 });
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Convite expirado' }, { status: 410 });
    }
    return NextResponse.json({ email: invite.email, role: invite.role });
  } catch (error) {
    console.error('Error validating invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Rate limit: 20 reqs / 15 min por IP
    const ip = ipFromRequest(req);
    const rl = rateLimit(`accept-invite:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.ok) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 });
    const body: unknown = await req.json();
    const parsed = acceptSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { token, password, name } = parsed.data;

    const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const pepper = process.env.BCRYPT_PEPPER || '';
    const senhaHash = await bcrypt.hash(password + pepper, rounds);
    try {
      const user = await InviteUserService.acceptInvite(token, name, senhaHash);
      return NextResponse.json({ message: 'Convite aceito com sucesso', user: { id: user.id, email: user.email, role: user.role } }, { status: 200 });
    } catch (e: unknown) {
      const msg = (e instanceof Error) ? e.message : '';
      if (msg.includes('expirado')) return NextResponse.json({ error: 'Convite expirado' }, { status: 410 });
      if (msg.includes('inválido')) return NextResponse.json({ error: 'Convite inválido' }, { status: 404 });
      if (msg.includes('já cadastrado') || msg.includes('em uso')) return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 409 });
      throw e;
    }
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}