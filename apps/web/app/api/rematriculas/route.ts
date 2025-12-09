import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  criarRematricula,
  listarRematriculasElegiveis,
  type RematriculaElegivelItem,
} from '@alusa/lib';
import { FormaPagamento, StatusContrato } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

type SessionUser = {
  id?: string;
  role?: string;
  contaId?: string;
};

async function resolveAuthContext(explicit?: string | null) {
  const session = await getServerSession(authOptions).catch(() => null);
  const user = (session as { user?: SessionUser } | null)?.user ?? null;
  const sessionContaId = user?.contaId?.trim() || null;
  const requested = explicit?.trim() || null;
  if (requested && sessionContaId && requested !== sessionContaId) {
    return { contaId: null, mismatch: true, sessionContaId, session, user };
  }
  return {
    contaId: requested || sessionContaId,
    mismatch: false,
    sessionContaId,
    session,
    user,
  };
}

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO', 'RECEPCAO']);

function parseNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const n = Number(value.replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseInteger(value: unknown) {
  const parsed = parseNumber(value);
  return parsed !== undefined ? Math.trunc(parsed) : undefined;
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false;
  }
  return undefined;
}

type DescontoPayload = { id: string; cumulativo?: boolean };

function normalizeDescontoEntry(entry: unknown): DescontoPayload | null {
  if (!entry || typeof entry !== 'object') return null;
  const raw = entry as { id?: unknown; cumulativo?: unknown };
  if (raw.id === undefined || raw.id === null) return null;
  const normalizedId =
    typeof raw.id === 'string' ? raw.id.trim() : String(raw.id).trim();
  if (!normalizedId) return null;

  const payload: DescontoPayload = { id: normalizedId };
  if (typeof raw.cumulativo === 'boolean') {
    payload.cumulativo = raw.cumulativo;
  } else if (typeof raw.cumulativo !== 'undefined') {
    payload.cumulativo = Boolean(raw.cumulativo);
  }

  return payload;
}

function toDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.trim().length) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return undefined;
}

function normalizarFormaPagamento(raw: unknown): FormaPagamento | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const normalized = raw.trim().toUpperCase();
  const mapping: Record<string, FormaPagamento> = {
    CARTAO: FormaPagamento.CARTAO_CREDITO,
    CARTAO_CREDITO: FormaPagamento.CARTAO_CREDITO,
    PIX: FormaPagamento.PIX,
    BOLETO: FormaPagamento.BOLETO,
    DINHEIRO: FormaPagamento.INDEFINIDO,
    INDEFINIDO: FormaPagamento.INDEFINIDO,
  };
  const mapped = mapping[normalized];
  return mapped && Object.values(FormaPagamento).includes(mapped) ? mapped : undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const auth = await resolveAuthContext(url.searchParams.get('contaId'));

    if (auth.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!auth.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }
    if (!auth.user?.id || !auth.user.role || !allowedRoles.has(auth.user.role.toUpperCase())) {
      return jsonError(403, 'PERMISSAO_NEGADA', 'Usuário não tem permissão para consultar rematrículas.');
    }

    const dias = Number(url.searchParams.get('diasAntecedencia') ?? '60');
    const referenciaParam = url.searchParams.get('referencia');
    const statusContratoParam = url.searchParams.get('statusContrato');
    const statusContratoValue = statusContratoParam &&
      Object.values(StatusContrato).includes(statusContratoParam as StatusContrato)
      ? (statusContratoParam as StatusContrato)
      : undefined;

    const result = await listarRematriculasElegiveis({
      contaId: auth.contaId,
      diasAntecedencia: Number.isFinite(dias) ? dias : 60,
      referencia: referenciaParam ? toDate(referenciaParam) : undefined,
      statusContrato: statusContratoValue,
      search: url.searchParams.get('q') ?? url.searchParams.get('search') ?? undefined,
    });

    const itens = result.itens.map((item: RematriculaElegivelItem) => ({
      id: item.id,
      status: item.status,
      statusContrato: item.statusContrato,
      dataInicio: item.dataInicio.toISOString(),
      dataFimContrato: item.dataFimContrato.toISOString(),
      diasRestantes: item.diasRestantes,
      contratoExpirado: item.contratoExpirado,
      podeRenovar: item.podeRenovar,
      aluno: item.aluno,
      plano: item.plano,
      turma: item.turma,
      combo: item.combo,
      financeiro: item.financeiro,
    }));

    return NextResponse.json(
      {
        referencia: result.referencia.toISOString(),
        ate: result.ate.toISOString(),
        total: result.total,
        itens,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[API Rematrículas] Erro ao listar:', error);
    return jsonError(500, 'ERRO_LISTAR_REMATRICULAS', (error as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'PAYLOAD_INVALIDO', 'Payload inválido');
    }

    const auth = await resolveAuthContext((body as { contaId?: string }).contaId ?? null);

    if (auth.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!auth.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }
    if (!auth.user?.id || !auth.user.role || !allowedRoles.has(auth.user.role.toUpperCase())) {
      return jsonError(403, 'PERMISSAO_NEGADA', 'Usuário não tem permissão para rematricular.');
    }

    const formaPagamento = normalizarFormaPagamento((body as { formaPagamento?: unknown }).formaPagamento);
    const formaPagamentoTaxa = normalizarFormaPagamento((body as { formaPagamentoTaxa?: unknown }).formaPagamentoTaxa);

    const matriculaId = (body as { matriculaId?: string }).matriculaId;
    if (!matriculaId) {
      return jsonError(400, 'MATRICULA_OBRIGATORIA', 'matriculaId é obrigatório.');
    }

    const dataInicioValue =
      toDate((body as { dataInicio?: unknown }).dataInicio) ?? new Date();
    const dataFimContratoValue = toDate((body as { dataFimContrato?: unknown }).dataFimContrato);
    if (!dataFimContratoValue) {
      return jsonError(400, 'DATA_FIM_CONTRATO_OBRIGATORIA', 'dataFimContrato é obrigatório.');
    }

    const descontosRaw = (body as { descontos?: unknown }).descontos;
    const descontos = Array.isArray(descontosRaw)
      ? descontosRaw
          .map((item) => normalizeDescontoEntry(item))
          .filter((item): item is DescontoPayload => item !== null)
      : undefined;

    const payload = {
      contaId: auth.contaId,
      matriculaId,
      createdById: auth.user.id,
      dataInicio: dataInicioValue,
      dataFimContrato: dataFimContratoValue,
      planoId: (body as { planoId?: string }).planoId,
      turmaId: (body as { turmaId?: string | null }).turmaId,
      comboId: (body as { comboId?: string | null }).comboId,
      responsavelFinanceiroId: (body as { responsavelFinanceiroId?: string | null }).responsavelFinanceiroId,
      formaPagamento,
      formaPagamentoTaxa,
      vencimentoDia: parseInteger((body as { vencimentoDia?: unknown }).vencimentoDia),
      taxaMatricula: parseNumber((body as { taxaMatricula?: unknown }).taxaMatricula),
      taxaIsenta: parseBoolean((body as { taxaIsenta?: unknown }).taxaIsenta),
      taxaJustificativa: (body as { taxaJustificativa?: string }).taxaJustificativa,
      pagarTaxaAgora: parseBoolean((body as { pagarTaxaAgora?: unknown }).pagarTaxaAgora),
      gerarCobrancaTaxa: parseBoolean((body as { gerarCobrancaTaxa?: unknown }).gerarCobrancaTaxa),
      criarCobranca: parseBoolean((body as { criarCobranca?: unknown }).criarCobranca),
      descontos,
      multaPercentual: parseNumber((body as { multaPercentual?: unknown }).multaPercentual),
      jurosMensal: parseNumber((body as { jurosMensal?: unknown }).jurosMensal),
      diasTolerancia: parseInteger((body as { diasTolerancia?: unknown }).diasTolerancia),
      descontoAntecipado: parseNumber((body as { descontoAntecipado?: unknown }).descontoAntecipado),
      prazoDesconto: parseInteger((body as { prazoDesconto?: unknown }).prazoDesconto),
    };

    const result = await criarRematricula(payload);
    
    // Resposta simplificada: matrícula renovada (não cria nova, apenas atualiza)
    const matriculaRenovada = result.matriculaRenovada;

    return NextResponse.json(
      {
        // Manter compatibilidade com frontend existente
        novaMatricula: {
          id: matriculaRenovada.id,
          planoId: matriculaRenovada.planoId,
          turmaId: matriculaRenovada.turmaId,
          status: matriculaRenovada.status,
          statusContrato: matriculaRenovada.statusContrato,
          dataInicio: matriculaRenovada.dataInicio.toISOString(),
          dataFimContrato: matriculaRenovada.dataFimContrato.toISOString(),
          asaasSubscriptionId: matriculaRenovada.asaasSubscriptionId,
        },
        historicoContrato: {
          dataInicioAnterior: result.historicoContrato.dataInicioAnterior.toISOString(),
          dataFimContratoAnterior: result.historicoContrato.dataFimContratoAnterior.toISOString(),
          turmaIdAnterior: result.historicoContrato.turmaIdAnterior,
          planoIdAnterior: result.historicoContrato.planoIdAnterior,
        },
        // Campos para compatibilidade (vazios/nulos por simplicidade)
        cobrancas: { taxa: null, mensalidade: null },
        preco: { taxa: 0, planoLiquido: 0, totalDescontos: 0 },
        checkoutLink: null,
        checkoutToken: null,
        responsavelFinanceiro: null,
        primeiroVencimento: matriculaRenovada.dataInicio.toISOString(),
      },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[API Rematrículas] Erro ao criar:', error);
    if ((error as { name?: string }).name === 'ZodError') {
      const zodError = error as { issues?: Array<{ path: string[]; message: string }> };
      const issues = zodError.issues || [];
      const firstIssue = issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Erro de validação';
      return jsonError(422, 'ERRO_VALIDACAO', message, { issues });
    }
    return jsonError(500, 'ERRO_CRIAR_REMATRICULA', (error as Error).message);
  }
}
