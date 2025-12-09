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
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data efetiva obrigatoria', path: ['dataEfetiva'] });
    }
    if (isPrevisto && !val.dataPrevista) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Data prevista obrigatoria', path: ['dataPrevista'] });
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
    select: { id: true },
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
  return {
    id: l.id,
    tipo: l.tipo,
    origem: l.origem,
    status: l.status,
    valor: Number(l.valor),
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

async function ensureAuth(req: NextRequest) {
  const session = await safeGetServerSession();
  const user = (session as { user?: SessUser } | null)?.user;
  if (!user?.id || !user?.contaId) return { error: err(401, 'NAO_AUTENTICADO', 'Usuario nao autenticado') };
  if (!user.role || !allowedRoles.has(user.role.toUpperCase()))
    return { error: err(403, 'SEM_PERMISSAO', 'Acesso negado') };
  return { user };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await ensureAuth(_);
    if ('error' in auth) return auth.error;
    const user = auth.user!;

    const lancamento = await prisma.lancamento.findFirst({
      where: { id: params.id, contaId: user.contaId },
      include: { categoria: true, subcategoria: true, parent: true, centroCusto: true },
    });
    if (!lancamento) return err(404, 'NAO_ENCONTRADO', 'Lancamento nao encontrado');
    return NextResponse.json({ data: serializeLancamento(lancamento) });
  } catch (e) {
    console.error('[API lancamentos][GET id]', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await ensureAuth(req);
    if ('error' in auth) return auth.error;
    const user = auth.user!;
    const parsed = lancamentoSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(400, 'DADOS_INVALIDOS', issue.message);
    }
    const body = parsed.data;

    const current = await prisma.lancamento.findFirst({
      where: { id: params.id, contaId: user.contaId },
      include: { categoria: true, subcategoria: true, centroCusto: true },
    });
    if (!current) return err(404, 'NAO_ENCONTRADO', 'Lancamento nao encontrado');
    if (current.isEstorno) return err(400, 'BLOQUEADO', 'Nao e possivel editar um estorno');
    if (current.parentId) return err(400, 'BLOQUEADO', 'Lancamento vinculado a estorno nao pode ser alterado');
    if (body.tipo !== current.tipo) return err(400, 'BLOQUEADO', 'Nao e permitido alterar o tipo');
    if (body.status === 'ESTORNADO') return err(400, 'USE_ESTORNO', 'Use a acao de estorno dedicada');

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
    if (current.origem === 'MANUAL' && !centroCustoId) {
      return err(400, 'DADOS_INVALIDOS', 'Centro de custo é obrigatório para lançamentos manuais');
    }
    const dataEfetiva = parseDate(body.dataEfetiva);
    const dataPrevista = parseDate(body.dataPrevista);

    const updated = await prisma.lancamento.update({
      where: { id: params.id },
      data: {
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
      },
      include: { categoria: true, subcategoria: true, centroCusto: true },
    });

    return NextResponse.json({ data: serializeLancamento(updated) });
  } catch (e) {
    console.error('[API lancamentos][PUT]', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await ensureAuth(req);
    if ('error' in auth) return auth.error;
    const user = auth.user!;

    const lanc = await prisma.lancamento.findFirst({
      where: { id: params.id, contaId: user.contaId },
      select: { origem: true, isEstorno: true },
    });
    if (!lanc) return err(404, 'NAO_ENCONTRADO', 'Lancamento nao encontrado');
    if (lanc.isEstorno) return err(400, 'BLOQUEADO', 'Nao e possivel excluir um estorno');
    if (lanc.origem !== 'MANUAL') return err(400, 'BLOQUEADO', 'Lancamento automatico nao pode ser apagado');

    const dependentes = await prisma.lancamento.count({ where: { parentId: params.id } });
    if (dependentes > 0) return err(400, 'BLOQUEADO', 'Existe estorno vinculado; nao e possivel remover');

    await prisma.lancamento.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API lancamentos][DELETE]', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
