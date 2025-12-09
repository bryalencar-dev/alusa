import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

const schoolUpdateSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome muito curto').max(120, 'Nome muito longo').optional(),
    cpfCnpj: z
      .string()
      .trim()
      .regex(/^[0-9.\-/]{11,18}$/i, 'CNPJ/CPF inválido')
      .optional(),
  })
  .strict();

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessUser = (session as { user?: { id?: string; contaId?: string } } | null)?.user;
    if (!sessUser?.id || !sessUser?.contaId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
    }

    const parsed = schoolUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }

    const input = parsed.data;
    const data: Record<string, unknown> = {};
    if (typeof input.name !== 'undefined') data.nome = input.name;
    if (typeof input.cpfCnpj !== 'undefined') data.cpfCnpj = input.cpfCnpj.replace(/\D/g, '');

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: { formErrors: ['Nenhuma alteração fornecida'] } }, { status: 400 });
    }

    const updated = await prisma.conta.update({
      where: { id: sessUser.contaId },
      data: data as any,
      select: {
        id: true,
        nome: true,
        cpfCnpj: true,
        status: true,
        ownerUserId: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.nome,
      cpfCnpj: updated.cpfCnpj,
      status: updated.status,
      ownerUserId: updated.ownerUserId,
    });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

