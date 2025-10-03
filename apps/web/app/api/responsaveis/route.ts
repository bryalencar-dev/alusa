import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { responsavelSchema } from '@/lib/validations/aluno-responsavel.schema';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/responsaveis
 * Lista responsáveis (busca por nome/CPF)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    // Buscar responsáveis com filtro de nome/CPF
    const where: Prisma.ResponsavelWhereInput = {};
    if (q.trim()) {
      where.OR = [
        { nome: { contains: q.trim(), mode: 'insensitive' } },
        { cpf: { contains: q.replace(/\D/g, ''), mode: 'insensitive' } },
      ];
    }

    const responsaveis = await prisma.responsavel.findMany({
      where,
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        telefone: true,
        financeiro: true,
      },
      orderBy: { nome: 'asc' },
      take: 50,
    });

    return NextResponse.json({ items: responsaveis });
  } catch (error) {
    console.error('[API /api/responsaveis GET]', error);
    return NextResponse.json({ error: 'Erro ao buscar responsáveis' }, { status: 500 });
  }
}

/**
 * POST /api/responsaveis
 * Cria novo responsável
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Validar payload
    const validation = responsavelSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Verificar se CPF ou email já existe
    const cpfDigits = data.cpf.replace(/\D/g, '');
    const existente = await prisma.responsavel.findFirst({
      where: {
        OR: [{ cpf: cpfDigits }, ...(data.email ? [{ email: data.email }] : [])],
      },
    });

    if (existente) {
      if (existente.cpf === cpfDigits) {
        return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    // Criar responsável
    const responsavel = await prisma.responsavel.create({
      data: {
        nome: data.nome,
        cpf: cpfDigits,
        email: data.email || `temp_${Date.now()}@responsavel.local`,
        telefone: data.telefone?.replace(/\D/g, '') || '',
        financeiro: data.financeiro ?? true,
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        email: true,
        telefone: true,
        financeiro: true,
      },
    });

    return NextResponse.json(responsavel, { status: 201 });
  } catch (error) {
    console.error('[API /api/responsaveis POST]', error);
    return NextResponse.json({ error: 'Erro ao criar responsável' }, { status: 500 });
  }
}
