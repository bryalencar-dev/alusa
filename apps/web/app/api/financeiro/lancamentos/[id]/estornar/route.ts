import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import { safeGetServerSession } from '@/lib/safe-server-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SessUser = { id?: string; contaId?: string; role?: string };
const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

const estornoSchema = z.object({
  dataEstorno: z.string().optional(),
  motivo: z.string().max(500).optional(),
});

function err(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { 'cache-control': 'no-store' } });
}

function parseDate(input?: string) {
  if (!input) return new Date();
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await safeGetServerSession();
    const user = (session as { user?: SessUser } | null)?.user;
    if (!user?.id || !user?.contaId) return err(401, 'NAO_AUTENTICADO', 'Usuario nao autenticado');
    if (!user.role || !allowedRoles.has(user.role.toUpperCase())) return err(403, 'SEM_PERMISSAO', 'Acesso negado');

    const parsed = estornoSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return err(400, 'DADOS_INVALIDOS', issue.message);
    }

    const lancamento = await prisma.lancamento.findFirst({
      where: { id: params.id, contaId: user.contaId },
      include: { categoria: true, subcategoria: true, centroCusto: true },
    });
    if (!lancamento) return err(404, 'NAO_ENCONTRADO', 'Lancamento nao encontrado');
    if (lancamento.isEstorno) return err(400, 'BLOQUEADO', 'Nao e possivel estornar um estorno');
    if (lancamento.status === 'ESTORNADO') return err(400, 'BLOQUEADO', 'Lancamento ja estornado');

    const podeEstornar =
      (lancamento.tipo === 'RECEITA' && lancamento.status === 'RECEBIDO') ||
      (lancamento.tipo === 'DESPESA' && lancamento.status === 'PAGO');
    if (!podeEstornar) return err(400, 'BLOQUEADO', 'Somente recebidos/pagos podem ser estornados');

    const dataEstorno = parseDate(parsed.data.dataEstorno);
    const motivoEstorno = parsed.data.motivo?.trim() || null;

    const ajuste = await prisma.$transaction(async (tx) => {
      await tx.lancamento.update({
        where: { id: lancamento.id },
        data: { status: 'ESTORNADO', dataEstorno, motivoEstorno },
      });

      const novo = await tx.lancamento.create({
        data: {
          contaId: user.contaId,
          tipo: lancamento.tipo,
          origem: lancamento.origem,
          status: 'ESTORNADO',
          valor: lancamento.valor,
          descricao: `Estorno de ${lancamento.descricao}`,
          referencia: lancamento.referencia,
          centroCustoId: lancamento.centroCustoId,
          categoriaId: lancamento.categoriaId,
          subcategoriaId: lancamento.subcategoriaId,
          formaPagamento: lancamento.formaPagamento,
          dataEfetiva: dataEstorno,
          dataPrevista: null,
          isEstorno: true,
          parentId: lancamento.id,
          dataEstorno,
          motivoEstorno,
          observacao: lancamento.observacao,
          anexoUrl: lancamento.anexoUrl,
          externalRef: lancamento.externalRef,
          createdById: user.id,
        },
        include: { categoria: true, subcategoria: true, centroCusto: true },
      });

      return novo;
    });

    return NextResponse.json({
      data: {
        id: ajuste.id,
        tipo: ajuste.tipo,
        origem: ajuste.origem,
        status: ajuste.status,
        valor: Number(ajuste.valor),
        descricao: ajuste.descricao,
        referencia: ajuste.referencia,
        centroCustoId: ajuste.centroCustoId,
        centroCustoNome: ajuste.centroCusto?.nome ?? null,
        categoriaId: ajuste.categoriaId,
        categoriaNome: ajuste.categoria?.nome ?? null,
        subcategoriaId: ajuste.subcategoriaId,
        subcategoriaNome: ajuste.subcategoria?.nome ?? null,
        formaPagamento: ajuste.formaPagamento,
        dataEfetiva: ajuste.dataEfetiva?.toISOString() ?? null,
        dataPrevista: ajuste.dataPrevista?.toISOString() ?? null,
        isEstorno: ajuste.isEstorno,
        parentId: ajuste.parentId,
        dataEstorno: ajuste.dataEstorno?.toISOString() ?? null,
        motivoEstorno: ajuste.motivoEstorno ?? null,
        observacao: ajuste.observacao ?? null,
        anexoUrl: ajuste.anexoUrl ?? null,
        externalRef: ajuste.externalRef ?? null,
        createdById: ajuste.createdById ?? null,
        createdAt: ajuste.createdAt?.toISOString() ?? null,
        updatedAt: ajuste.updatedAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    console.error('[API lancamentos][ESTORNAR]', e);
    return err(500, 'ERRO_INTERNO', (e as Error).message);
  }
}
