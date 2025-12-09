import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

const addressSchema = z
  .object({
    street: z.string().trim().max(120).optional(),
    number: z.string().trim().max(20).optional(),
    district: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(2).optional(),
    cep: z
      .string()
      .trim()
      .regex(/^\d{5}-?\d{3}$/)
      .optional(),
  })
  .strict();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const contaId = (session as { user?: { contaId?: string } } | null)?.user?.contaId || null;
    if (!contaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conta = await prisma.conta.findUnique({
      where: { id: contaId },
      select: {
        enderecoLogradouro: true,
        enderecoNumero: true,
        enderecoBairro: true,
        enderecoCidade: true,
        enderecoUf: true,
        enderecoCep: true,
      } as any,
    });
    if (!conta) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    return NextResponse.json({
      street: conta.enderecoLogradouro ?? '',
      number: conta.enderecoNumero ?? '',
      district: conta.enderecoBairro ?? '',
      city: conta.enderecoCidade ?? '',
      state: conta.enderecoUf ?? '',
      cep: conta.enderecoCep ?? '',
    });
  } catch (error) {
    console.error('Error reading school address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const contaId = (session as { user?: { contaId?: string } } | null)?.user?.contaId || null;
    if (!contaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
    }

    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const data = parsed.data;
    const updated = await prisma.conta.update({
      where: { id: contaId },
      data: {
        enderecoLogradouro: typeof data.street === 'string' ? data.street : undefined,
        enderecoNumero: typeof data.number === 'string' ? data.number : undefined,
        enderecoBairro: typeof data.district === 'string' ? data.district : undefined,
        enderecoCidade: typeof data.city === 'string' ? data.city : undefined,
        enderecoUf: typeof data.state === 'string' ? data.state.toUpperCase() : undefined,
        enderecoCep: typeof data.cep === 'string' ? data.cep.replace(/\D/g, '') : undefined,
      } as any,
      select: {
        enderecoLogradouro: true,
        enderecoNumero: true,
        enderecoBairro: true,
        enderecoCidade: true,
        enderecoUf: true,
        enderecoCep: true,
      } as any,
    });
    return NextResponse.json({
      street: updated.enderecoLogradouro ?? '',
      number: updated.enderecoNumero ?? '',
      district: updated.enderecoBairro ?? '',
      city: updated.enderecoCidade ?? '',
      state: updated.enderecoUf ?? '',
      cep: updated.enderecoCep ?? '',
    });
  } catch (error) {
    console.error('Error updating school address:', error);
    const msg = (error as Error)?.message || '';
    if (/Unknown arg|Unknown field|column .* does not exist/i.test(msg)) {
      return NextResponse.json(
        { error: 'Campos de endereço não encontrados. Rode a migration do banco.' },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
