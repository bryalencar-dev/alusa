import { NextResponse } from 'next/server';
import { z } from 'zod';

const acceptSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = acceptSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    // TODO: Implementar lógica de aceite de convite
    // - Validar token de convite
    // - Criar usuário com os dados fornecidos
    // - Invalidar token usado
    
    return NextResponse.json({ message: 'Convite aceito com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}