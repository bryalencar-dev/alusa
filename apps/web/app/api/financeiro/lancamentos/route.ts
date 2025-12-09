import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeGetServerSession } from '@/lib/safe-server-session';
import { prisma } from '@/src/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SessUser = { id?: string; contaId?: string; role?: string };
const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

const statusByTipo: Record<'RECEITA' | 'DESPESA', Array<'RECEBIDO' | 'PREVISTO' | 'PAGO' | 'PENDENTE' | 'ESTORNADO'>> = {
  RECEITA: ['RECEBIDO', 'PREVISTO', 'ESTORNADO'],
  DESPESA: ['PAGO', 'PENDENTE', 'ESTORNADO'],
};

const formaPagamentoList = [
  'PIX',
  'BOLETO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'DINHEIRO',
  'TRANSFERENCIA',
  'TED',
  'DOC',
  'DEBITO_AUTOMATICO',
  'CHEQUE',
  'VOUCHER',
  'OUTRO',
] as const;

const lancamentoSchema = z
  .object({
    tipo: z.enum(['RECEITA', 'DESPESA']),
    origem: z.enum(['SISTEMA', 'MANUAL']).default('MANUAL'),
    status: z.enum(['RECEBIDO', 'PREVISTO', 'PAGO', 'PENDENTE', 'ESTORNADO']),
    valor: z.number().positive(),
    descricao: z.string().min(2).max(255),
    referencia: z.string().max(255).optional().nullable(),
    centroCustoId: z.string().min(1).optional().nullable(),
    categoriaId: z.string().min(1).optional().nullable(),
    subcategoriaId: z.string().min(1).optional().nullable(),
    formaPagamento: z.enum(formaPagamentoList).optional().nullable(),
    dataEfetiva: z.string().optional().nullable(),
    dataPrevista: z.string().optional().nullable(),
    observacao: z.string().max(2000).optional().nullable(),
    anexoUrl: z.string().max(1024).optional().nullable(),
    externalRef: z.string().max(255).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const allowed = statusByTipo[val.tipo as 'RECEITA' | 'DESPESA'];
    if (!allowed.includes(val.status as any)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Status nao permitido para o tipo selecionado',
        path: ['status'],
      });
    }

    const isEfetivo = val.status === 'RECEBIDO' || val.status === 'PAGO' || val.status === 'ESTORNADO';
    const isPrevisto = val.status === 'PREVISTO' || val.status === 'PENDENTE';
    if (isEfetivo && !val.dataEfetiva) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data efetiva obrigatoria para este status',
        path: ['dataEfetiva'],
      });
    }
    if (isPrevisto && !val.dataPrevista) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data prevista obrigatoria para status previsto/pendente',
        path: ['dataPrevista'],
      });
    }
  });

function err(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { 'cache-control': 'no-store' } });
}

function parseDate(input?: string | null): Date | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

async function ensureCategoria(contaId: string, tipo: 'RECEITA' | 'DESPESA', categoriaId?: string | null) {
  if (!categoriaId) return null;
  const cat = await prisma.categoriaLancamento.findFirst({
    where: { id: categoriaId, contaId, tipo },
    select: { id: true, tipo: true, parentId: true },
  });
  if (!cat) throw new Error('Categoria nao encontrada para esta conta ou tipo');
  return cat.id;
}

async function ensureCentroCusto(contaId: string, tipo: 'RECEITA' | 'DESPESA', centroId?: string | null) {
  if (!centroId) return null;
  const centro = await prisma.centroCusto.findFirst({
    where: { id: centroId, contaId, status: 'ATIVO' },
    select: { id: true, tipo: true },
  });
  if (!centro) throw new Error('Centro de custo nao encontrado ou inativo');
  if (centro.tipo !== 'MISTO' && centro.tipo !== tipo) {
    throw new Error('Centro de custo incompatível com o tipo do lancamento');
  }
  return centro.id;
}

function serializeLancamento(l: any) {
  const valorNumber = Number(l.valor);
  return {
    id: l.id,
    tipo: l.tipo,
    origem: l.origem,
    status: l.status,
    valor: valorNumber,
    descricao: l.descricao,
    referencia: l.referencia,
    centroCustoId: l.centroCustoId,
    centroCustoNome: l.centroCusto?.nome ?? null,
    categoriaId: l.categoriaId,
    categoriaNome: l.categoria?.nome ?? null,
    subcategoriaId: l.subcategoriaId,
    subcategoriaNome: l.subcategoria?.nome ?? null,
    formaPagamento: l.formaPagamento,
    dataEfetiva: l.dataEfetiva?.toISOString() ?? null,
    dataPrevista: l.dataPrevista?.toISOString() ?? null,
    isEstorno: l.isEstorno,
    parentId: l.parentId,
    dataEstorno: l.dataEstorno?.toISOString() ?? null,
    motivoEstorno: l.motivoEstorno ?? null,
    observacao: l.observacao ?? null,
    anexoUrl: l.anexoUrl ?? null,
    externalRef: l.externalRef ?? null,
    createdById: l.createdById ?? null,
    createdAt: l.createdAt?.toISOString() ?? null,
    updatedAt: l.updatedAt?.toISOString() ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await safeGetServerSession();
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuario nao autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase())) return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
    const tipo = url.searchParams.get('tipo') || undefined;
    const status = url.searchParams.getAll('status').filter(Boolean);
    const origem = url.searchParams.getAll('origem').filter(Boolean);
    const centroCustoId = url.searchParams.get('centroCustoId') || undefined;
    const categoriaId = url.searchParams.get('categoriaId') || undefined;
    const subcategoriaId = url.searchParams.get('subcategoriaId') || undefined;
    const search = url.searchParams.get('q')?.trim();
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const sort = url.searchParams.get('sort') === 'valor' ? 'valor' : 'dataEfetiva';
    const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = { contaId: user.contaId };
    const andFilters: Record<string, unknown>[] = [];

    if (tipo) where.tipo = tipo as any;
    if (status.length) where.status = { in: status };
    if (origem.length) where.origem = { in: origem };
    if (centroCustoId) where.centroCustoId = centroCustoId;
    if (categoriaId) where.categoriaId = categoriaId;
    if (subcategoriaId) where.subcategoriaId = subcategoriaId;
    if (search) {
      andFilters.push({
        OR: [
          { descricao: { contains: search, mode: 'insensitive' } },
          { referencia: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    if (fromDate) {
      andFilters.push({
        OR: [{ dataEfetiva: { gte: fromDate } }, { dataPrevista: { gte: fromDate } }],
      });
    }
    if (toDate) {
      andFilters.push({
        OR: [{ dataEfetiva: { lte: toDate } }, { dataPrevista: { lte: toDate } }],
      });
    }
    if (andFilters.length) where.AND = andFilters;

    const [total, items] = await prisma.$transaction([
      prisma.lancamento.count({ where }),
      prisma.lancamento.findMany({
        where,
        orderBy: [
          { [sort]: order as 'asc' | 'desc' },
          { createdAt: 'desc' },
        ] as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          centroCusto: true,
          categoria: true,
          subcategoria: true,
        },
      }),
    ]);

    const totals = items.reduce(
      (acc, l) => {
        const val = Number(l.valor);
        const sign = l.isEstorno ? -1 : 1;
        if (l.tipo === 'RECEITA') acc.receitas += sign * val;
        if (l.tipo === 'DESPESA') acc.despesas += sign * val;
        if (l.isEstorno) acc.estornos += val;
        acc.liquido = acc.receitas - acc.despesas;
        return acc;
      },
      { receitas: 0, despesas: 0, estornos: 0, liquido: 0 },
    );

    return NextResponse.json(
      {
        data: items.map(serializeLancamento),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        totals,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (e) {
    console.error('[API lancamentos][GET]', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await safeGetServerSession();
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuario nao autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase())) return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const parsed = lancamentoSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(400, 'DADOS_INVALIDOS', issue.message);
    }

    const body = parsed.data;
    const dataEfetiva = parseDate(body.dataEfetiva);
    const dataPrevista = parseDate(body.dataPrevista);

    let categoriaId: string | null = null;
    let subcategoriaId: string | null = null;
    let centroCustoId: string | null = null;
    try {
      categoriaId = await ensureCategoria(user.contaId, body.tipo, body.categoriaId);
      subcategoriaId = await ensureCategoria(user.contaId, body.tipo, body.subcategoriaId);
      centroCustoId = await ensureCentroCusto(user.contaId, body.tipo, body.centroCustoId);
    } catch (catErr) {
      return err(400, 'DADOS_INVALIDOS', (catErr as Error).message);
    }

    if (body.origem === 'MANUAL' && !centroCustoId) {
      return err(400, 'DADOS_INVALIDOS', 'Centro de custo é obrigatório para lançamentos manuais');
    }

    const created = await prisma.lancamento.create({
      data: {
        contaId: user.contaId,
        tipo: body.tipo,
        origem: body.origem,
        status: body.status,
        valor: body.valor,
        descricao: body.descricao,
        referencia: body.referencia || null,
        centroCustoId,
        categoriaId,
        subcategoriaId,
        formaPagamento: body.formaPagamento || null,
        dataEfetiva: dataEfetiva ?? null,
        dataPrevista: dataPrevista ?? null,
        observacao: body.observacao || null,
        anexoUrl: body.anexoUrl || null,
        externalRef: body.externalRef || null,
        createdById: user.id,
      },
      include: { centroCusto: true, categoria: true, subcategoria: true },
    });

    return NextResponse.json({ data: serializeLancamento(created) }, { status: 201 });
  } catch (e) {
    console.error('[API lancamentos][POST]', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
