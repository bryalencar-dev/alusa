import { NextResponse } from 'next/server';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ADMIN', 'RECEPCAO', 'PROFESSOR']).optional().default('RECEPCAO'),
  escolaId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = inviteSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    // TODO: Implementar lógica de convite de usuário
    // - Verificar permissões do usuário atual
    // - Criar token de convite
    // - Enviar email de convite
    
    return NextResponse.json({ message: 'Convite enviado com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}