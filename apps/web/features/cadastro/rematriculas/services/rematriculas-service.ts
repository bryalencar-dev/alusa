import type { MatriculaStatus } from '@/features/cadastro/matriculas/services/matriculas-service';

export type StatusContrato = 'ATIVO' | 'ENCERRADO';

export interface RematriculaAluno {
  id: string;
  nome: string | null;
  cpf: string | null;
  foto?: string | null;
}

export interface RematriculaPlano {
  id: string;
  nome: string;
}

export interface RematriculaTurma {
  id: string;
  nome: string;
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
}

export interface RematriculaCombo {
  id: string;
  nome: string;
}

export type FormaPagamentoValue = 'BOLETO' | 'PIX' | 'CARTAO_CREDITO' | 'INDEFINIDO';

export interface RematriculaDescontoResumo {
  id: string;
  nome: string;
}

export interface RematriculaFinanceiro {
  formaPagamento: FormaPagamentoValue | null;
  formaPagamentoTaxa: FormaPagamentoValue | null;
  vencimentoDia: number | null;
  taxaMatricula: number | null;
  taxaIsenta: boolean;
  taxaJustificativa: string | null;
  multaPercentual: number | null;
  jurosMensal: number | null;
  descontoAntecipado: number | null;
  prazoDesconto: number | null;
  diasTolerancia: number | null;
  descontos: RematriculaDescontoResumo[];
}

export interface RematriculaElegivelItem {
  id: string;
  status: MatriculaStatus;
  statusContrato: StatusContrato;
  dataInicio: string;
  dataFimContrato: string;
  diasRestantes: number;
  contratoExpirado: boolean;
  podeRenovar: boolean;
  aluno: RematriculaAluno;
  plano: RematriculaPlano;
  turma: RematriculaTurma | null;
  combo: RematriculaCombo | null;
  financeiro: RematriculaFinanceiro;
}

export interface ListRematriculasParams {
  contaId: string;
  diasAntecedencia?: number;
  statusContrato?: StatusContrato;
  referencia?: string;
  search?: string;
  signal?: AbortSignal;
}

export interface ListRematriculasResponse {
  referencia: string;
  ate: string;
  total: number;
  itens: RematriculaElegivelItem[];
}

function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseOptionalNumber(value: unknown): number | null {
  const parsed = parseNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false;
  }
  return fallback;
}

function parseDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseFormaPagamento(value: unknown): FormaPagamentoValue | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toUpperCase();
  if (normalized === 'BOLETO' || normalized === 'PIX' || normalized === 'CARTAO_CREDITO' || normalized === 'INDEFINIDO') {
    return normalized as FormaPagamentoValue;
  }
  return null;
}

function normalizeDescontos(raw: unknown): RematriculaDescontoResumo[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      if (!record.id) return null;
      return {
        id: String(record.id),
        nome: record.nome ? String(record.nome) : 'Desconto',
      };
    })
    .filter((item): item is RematriculaDescontoResumo => Boolean(item));
}

function normalizeFinanceiro(raw: unknown): RematriculaFinanceiro {
  const record = (raw as Record<string, unknown>) || {};
  return {
    formaPagamento: parseFormaPagamento(record.formaPagamento),
    formaPagamentoTaxa: parseFormaPagamento(record.formaPagamentoTaxa),
    vencimentoDia: parseOptionalNumber(record.vencimentoDia),
    taxaMatricula: parseOptionalNumber(record.taxaMatricula),
    taxaIsenta: parseBoolean(record.taxaIsenta, false),
    taxaJustificativa:
      typeof record.taxaJustificativa === 'string' && record.taxaJustificativa.length
        ? record.taxaJustificativa
        : null,
    multaPercentual: parseOptionalNumber(record.multaPercentual),
    jurosMensal: parseOptionalNumber(record.jurosMensal),
    descontoAntecipado: parseOptionalNumber(record.descontoAntecipado),
    prazoDesconto: parseOptionalNumber(record.prazoDesconto),
    diasTolerancia: parseOptionalNumber(record.diasTolerancia),
    descontos: normalizeDescontos(record.descontos),
  };
}

function normalizeAluno(raw: unknown): RematriculaAluno {
  const record = (raw as Record<string, unknown>) || {};
  return {
    id: String(record.id ?? ''),
    nome: (record.nome as string | null) ?? null,
    cpf: (record.cpf as string | null) ?? null,
    foto: (record.foto as string | null) ?? null,
  };
}

function normalizePlano(raw: unknown): RematriculaPlano {
  const record = (raw as Record<string, unknown>) || {};
  return {
    id: String(record.id ?? ''),
    nome: String(record.nome ?? ''),
  };
}

function normalizeTurma(raw: unknown): RematriculaTurma | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  return {
    id: String(record.id ?? ''),
    nome: String(record.nome ?? ''),
    diasSemana: Array.isArray(record.diasSemana)
      ? (record.diasSemana as string[])
      : [],
    horaInicio: String(record.horaInicio ?? ''),
    horaFim: String(record.horaFim ?? ''),
  };
}

function normalizeCombo(raw: unknown): RematriculaCombo | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  return {
    id: String(record.id ?? ''),
    nome: String(record.nome ?? ''),
  };
}

function normalizeItem(raw: unknown): RematriculaElegivelItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Item de rematrícula inválido recebido da API.');
  }

  const record = raw as Record<string, unknown>;
  const dataFimContrato = parseDate(record.dataFimContrato) ?? new Date().toISOString();

  return {
    id: String(record.id ?? ''),
    status: (record.status as MatriculaStatus) ?? 'ATIVA',
    statusContrato: (record.statusContrato as StatusContrato) ?? 'ATIVO',
    dataInicio: parseDate(record.dataInicio) ?? new Date().toISOString(),
    dataFimContrato,
    diasRestantes: parseNumber(record.diasRestantes ?? 0, 0),
    contratoExpirado: parseBoolean(record.contratoExpirado, false),
    podeRenovar: parseBoolean(record.podeRenovar, false),
    aluno: normalizeAluno(record.aluno),
    plano: normalizePlano(record.plano),
    turma: normalizeTurma(record.turma),
    combo: normalizeCombo(record.combo),
    financeiro: normalizeFinanceiro(record.financeiro),
  };
}

export async function listRematriculasElegiveisRequest(
  params: ListRematriculasParams,
): Promise<ListRematriculasResponse> {
  const searchParams = new URLSearchParams({ contaId: params.contaId });
  if (params.search) searchParams.set('q', params.search);
  if (params.diasAntecedencia) searchParams.set('diasAntecedencia', String(params.diasAntecedencia));
  if (params.statusContrato) searchParams.set('statusContrato', params.statusContrato);
  if (params.referencia) searchParams.set('referencia', params.referencia);

  const response = await fetch(`/api/rematriculas?${searchParams.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: params.signal,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ||
        'Não foi possível carregar as rematrículas elegíveis.',
    );
  }

  const data = (json as Partial<ListRematriculasResponse>) || {};
  const itens = Array.isArray(data.itens) ? data.itens.map((item) => normalizeItem(item)) : [];

  return {
    referencia: parseDate(data.referencia) ?? new Date().toISOString(),
    ate: parseDate(data.ate) ?? new Date().toISOString(),
    total: typeof data.total === 'number' ? data.total : itens.length,
    itens,
  };
}

export interface CreateRematriculaInput {
  contaId: string;
  matriculaId: string;
  dataInicio: string;
  dataFimContrato: string;
  planoId?: string;
  turmaId?: string | null;
  comboId?: string | null;
  responsavelFinanceiroId?: string | null;
  formaPagamento?: string;
  formaPagamentoTaxa?: string;
  vencimentoDia?: number;
  taxaMatricula?: number;
  taxaIsenta?: boolean;
  taxaJustificativa?: string;
  pagarTaxaAgora?: boolean;
  gerarCobrancaTaxa?: boolean;
  criarCobranca?: boolean;
  descontos?: Array<{ id: string; cumulativo?: boolean }>;
  multaPercentual?: number;
  jurosMensal?: number;
  diasTolerancia?: number;
  descontoAntecipado?: number;
  prazoDesconto?: number;
}

export interface CreateRematriculaResponse {
  novaMatricula: {
    id: string;
    planoId: string;
    turmaId: string | null;
    status: MatriculaStatus;
    statusContrato: StatusContrato;
    dataInicio: string;
    dataFimContrato: string;
    asaasSubscriptionId: string | null;
  };
  historicoContrato: {
    dataInicioAnterior: string;
    dataFimContratoAnterior: string;
    turmaIdAnterior: string | null;
    planoIdAnterior: string;
  };
  primeiroVencimento: string;
  checkoutLink: {
    id: string;
    token: string;
    expiresAt: string;
    usedAt: string | null;
    channel: string;
  } | null;
  responsavelFinanceiro: RematriculaAluno | null;
}

export async function createRematriculaRequest(
  input: CreateRematriculaInput,
): Promise<CreateRematriculaResponse> {
  const response = await fetch('/api/rematriculas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ||
        'Não foi possível concluir a rematrícula.',
    );
  }

  const payload = json as {
    novaMatricula?: Record<string, unknown>;
    historicoContrato?: Record<string, unknown>;
    primeiroVencimento?: string;
    checkoutLink?: Record<string, unknown> | null;
    responsavelFinanceiro?: Record<string, unknown> | null;
  };

  const novaMatricula = payload.novaMatricula as Record<string, unknown>;
  const historicoContrato = payload.historicoContrato as Record<string, unknown> | undefined;

  return {
    novaMatricula: {
      id: String(novaMatricula.id ?? ''),
      planoId: String(novaMatricula.planoId ?? ''),
      turmaId: (novaMatricula.turmaId as string | null) ?? null,
      status: (novaMatricula.status as MatriculaStatus) ?? 'ATIVA',
      statusContrato: (novaMatricula.statusContrato as StatusContrato) ?? 'ATIVO',
      dataInicio: parseDate(novaMatricula.dataInicio) ?? new Date().toISOString(),
      dataFimContrato: parseDate(novaMatricula.dataFimContrato) ?? new Date().toISOString(),
      asaasSubscriptionId: (novaMatricula.asaasSubscriptionId as string | null) ?? null,
    },
    historicoContrato: historicoContrato
      ? {
          dataInicioAnterior: parseDate(historicoContrato.dataInicioAnterior) ?? '',
          dataFimContratoAnterior: parseDate(historicoContrato.dataFimContratoAnterior) ?? '',
          turmaIdAnterior: (historicoContrato.turmaIdAnterior as string | null) ?? null,
          planoIdAnterior: String(historicoContrato.planoIdAnterior ?? ''),
        }
      : {
          dataInicioAnterior: '',
          dataFimContratoAnterior: '',
          turmaIdAnterior: null,
          planoIdAnterior: '',
        },
    primeiroVencimento:
      parseDate(payload.primeiroVencimento) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    checkoutLink: payload.checkoutLink
      ? {
          id: String(payload.checkoutLink.id ?? ''),
          token: String(payload.checkoutLink.token ?? ''),
          expiresAt: parseDate(payload.checkoutLink.expiresAt) ?? new Date().toISOString(),
          usedAt: parseDate(payload.checkoutLink.usedAt),
          channel: String(payload.checkoutLink.channel ?? ''),
        }
      : null,
    responsavelFinanceiro: payload.responsavelFinanceiro
      ? normalizeAluno(payload.responsavelFinanceiro)
      : null,
  };
}
