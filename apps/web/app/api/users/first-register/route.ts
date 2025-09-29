import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createFirstUser, EmailInUseError, CpfCnpjInUseError, PasswordPolicyError } from '@/lib/first-user-service';
import { ipFromRequest, rateLimit } from '@/lib/rate-limit';


const passwordMinLength = Number(process.env.PASSWORD_MIN_LENGTH || 8);
const passwordMessage = 'Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.';
const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{' + String(passwordMinLength) + ',}$');

const schema = z.object({
  escolaNome: z.string().min(2),
  cpfCnpj: z.string().min(11),
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().regex(passwordRegex, passwordMessage)
});

export async function POST(req: Request) {
  // Rate limit: 10 reqs / 15 min por IP
  const ip = ipFromRequest(req);
  const rl = rateLimit(`first-register:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, { status: 429 });
  // Regra atualizada: cadastro via tela de registro SEM token
  // deve sempre criar uma nova Conta e um ADMIN para ela.
  // Não bloqueamos mais quando já existem usuários na base.

  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
  try {
    const user = await createFirstUser(parsed.data);
    return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof EmailInUseError || e instanceof CpfCnpjInUseError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    if (e instanceof PasswordPolicyError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (typeof e === 'object' && e !== null && 'code' in e) {
      const code = (e as { code?: string }).code;
      if (code === 'P2002') {
        return NextResponse.json({ error: 'E-mail ou CPF/CNPJ já utilizado.' }, { status: 409 });
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}