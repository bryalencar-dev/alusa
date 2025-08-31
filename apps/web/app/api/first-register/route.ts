import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createFirstUser, EmailInUseError, CpfCnpjInUseError, PasswordPolicyError } from '@/lib/first-user-service';

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
  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  try {
    const user = await createFirstUser(parsed.data);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } }, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof EmailInUseError || e instanceof CpfCnpjInUseError || e instanceof PasswordPolicyError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (typeof e === 'object' && e && 'code' in e) {
      const code = (e as any).code as string;
      if (code === 'P2002') {
        return NextResponse.json({ error: 'E-mail ou CPF/CNPJ já utilizado.' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}