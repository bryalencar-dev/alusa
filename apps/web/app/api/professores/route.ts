import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProfessorCreateSchema } from '@alusa/lib';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status, headers: { 'cache-control': 'no-store' } });
}

const prisma = new PrismaClient();

type CreateBody = {
  contaId: string;
  nome: string;
  cpf: string;
  rg?: string | null;
  dataNasc: Date;
  sexo?: string | null;
  estadoCivil?: string | null;
  nacionalidade?: string | null;
  email: string;
  telefoneCel: string;
  telefoneFixo?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  formacao?: string | null;
  especialidades?: string[];
  dataAdmissao?: Date | null;
  statusContratual?: 'EFETIVO' | 'TEMPORARIO' | 'PRESTADOR' | 'VOLUNTARIO' | null;
  cargaHoraria?: number | null;
  miniBio?: string | null;
  foto?: string | null;
  status: 'ATIVO' | 'INATIVO';
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const contaId = url.searchParams.get('contaId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
    const where: Record<string, unknown> = {
      ...(contaId ? { contaId } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [{ nome: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.professor.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.professor.count({ where }),
    ]);
    return NextResponse.json({ data, page, pageSize, total }, { headers: { 'cache-control': 'no-store' } });
  } catch (e: unknown) {
    return jsonError(500, 'ERRO_DESCONHECIDO', (e as Error)?.message || 'Erro ao listar professores');
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ProfessorCreateSchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(422, 'ERRO_VALIDACAO', 'Falha de validação', parsed.error.flatten());
    }
    const data = parsed.data as CreateBody;
    // Sanitização mínima
    const toCreate = {
      nome: data.nome.trim(),
      cpf: data.cpf,
      rg: data.rg || null,
      dataNasc: data.dataNasc,
      sexo: data.sexo || null,
      estadoCivil: data.estadoCivil || null,
      nacionalidade: data.nacionalidade || null,
  email: data.email.trim(),
      telefoneCel: data.telefoneCel,
      telefoneFixo: data.telefoneFixo || null,
      cep: data.cep || null,
      logradouro: data.logradouro || null,
      numero: data.numero || null,
      complemento: data.complemento || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      formacao: data.formacao || null,
      especialidades: data.especialidades ?? [],
      dataAdmissao: data.dataAdmissao || null,
      statusContratual: data.statusContratual || null,
      cargaHoraria: data.cargaHoraria || null,
      miniBio: data.miniBio || null,
      foto: data.foto || null,
      status: data.status,
      conta: { connect: { id: data.contaId } },
    } as const;

    try {
      const created = await prisma.professor.create({ data: toCreate });
      return NextResponse.json({ data: created }, { status: 201, headers: { 'cache-control': 'no-store' } });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'P2002') {
        return jsonError(409, 'CONFLITO_UNICO', 'CPF ou e-mail já cadastrados');
      }
      throw e;
    }
  } catch (e: unknown) {
    return jsonError(400, 'REQUISICAO_INVALIDA', (e as Error)?.message || 'Dados inválidos');
  }
}
