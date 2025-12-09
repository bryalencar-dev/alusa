export type MatriculaStatus =
  | 'PENDENTE_TAXA'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'ATIVA'
  | 'PAUSADA'
  | 'RECUSADA'
  | 'CANCELADA';
export type MatriculaCobrancaStatus =
  | 'PENDENTE'
  | 'PROCESSANDO'
  | 'PAGO'
  | 'ATRASADO'
  | 'CANCELADO'
  | 'ESTORNADO';
export type MatriculaFormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';
export type MatriculaTaxaStatus = 'PENDENTE' | 'PAGO' | 'EXPIRADO' | 'ISENTO';
export type MatriculaTipoCobranca =
  | 'TAXA_MATRICULA'
  | 'MENSALIDADE'
  | 'EXTRA'
  | 'AVULSA'
  | 'PARCELADA'
  | 'RECORRENTE';

function isMatriculaStatus(value: unknown): value is MatriculaStatus {
  return (
    typeof value === 'string' &&
    [
      'PENDENTE_TAXA',
      'AGUARDANDO_CONFIRMACAO',
      'ATIVA',
      'PAUSADA',
      'RECUSADA',
      'CANCELADA',
    ].includes(value)
  );
}

function isMatriculaCobrancaStatus(value: unknown): value is MatriculaCobrancaStatus {
  return (
    typeof value === 'string' &&
    ['PENDENTE', 'PROCESSANDO', 'PAGO', 'ATRASADO', 'CANCELADO', 'ESTORNADO'].includes(value)
  );
}

function isMatriculaTaxaStatus(value: unknown): value is MatriculaTaxaStatus {
  return typeof value === 'string' && ['PENDENTE', 'PAGO', 'EXPIRADO', 'ISENTO'].includes(value);
}

const parseNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
};

const parseIsoDate = (value: unknown): string | null => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export type MatriculaStatusAsaasAction = 'SUSPEND' | 'ACTIVATE' | 'DELETE' | 'LOCAL_ONLY' | 'NONE';

export interface PaymentSyncDetail {
  cobrancaId: string;
  asaasPaymentId: string | null;
  novoStatus: MatriculaCobrancaStatus;
  source: 'ASAAS' | 'LOCAL';
}

export interface PaymentSyncInfo {
  totalFromAsaas: number;
  matched: number;
  updated: number;
  warnings: string[];
  expectedWebhooks: string[];
  details: PaymentSyncDetail[];
}

export interface MatriculaStatusSyncData {
  matriculaId: string;
  status: MatriculaStatus;
  previousStatus: MatriculaStatus;
  asaasAction: MatriculaStatusAsaasAction;
  cobrancasAtualizadas: number;
  nextDueDate: string | null;
  paymentSync: PaymentSyncInfo;
}

export interface MatriculaStatusSyncResponse {
  success: boolean;
  message: string;
  data: MatriculaStatusSyncData;
}

export interface ResendCobrancaData {
  cobrancaId: string;
  matriculaId: string;
  status: MatriculaCobrancaStatus;
  previousStatus: MatriculaCobrancaStatus;
  newTaxaStatus: MatriculaTaxaStatus | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixQrCodeUrl: string | null;
  pixCopyPaste: string | null;
}

export interface ResendCobrancaResponse {
  success: boolean;
  message: string;
  data: ResendCobrancaData;
}

export interface MatriculaListItem {
  id: string;
  status: MatriculaStatus;
  dataInicio: string;
  dataFim: string | null;
  taxaMatricula: number;
  taxaStatus: MatriculaTaxaStatus;
  taxaIsenta: boolean;
  vencimentoDia: number;
  aluno: {
    id: string;
    nome: string | null;
    cpf: string | null;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
  } | null;
  responsavelFinanceiro: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  } | null;
  turma: {
    id: string;
    nome: string;
    diasSemana: string[];
    horaInicio: string;
    horaFim: string;
  } | null;
  combo: {
    id: string;
    nome: string;
  } | null;
  cobrancas: Array<{
    id: string;
    valor: number;
    status: MatriculaCobrancaStatus;
    formaPagamento: MatriculaFormaPagamento;
    tipo: MatriculaTipoCobranca;
    vencimento: string;
    descricao: string | null;
    asaasPaymentId: string | null;
    asaasId: string | null;
    createdAt: string;
    competenciaInicio: string;
    competenciaFim: string;
    dataPagamento: string | null;
  }>;
}

export interface ListMatriculasParams {
  contaId: string;
  status?: MatriculaStatus | MatriculaStatus[];
  search?: string;
  turmaId?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

interface ListMatriculasResponse {
  data: MatriculaListItem[];
  total: number;
  page: number;
  pageSize: number;
}

function normalizeStatusArray(status?: MatriculaStatus | MatriculaStatus[]) {
  if (!status) return [];
  if (Array.isArray(status)) return status;
  return [status];
}

function normalizeMatricula(raw: unknown): MatriculaListItem {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Matrícula inválida recebida da API.');
  }
  const r = raw as Record<string, unknown>;
  const toIso = (value: unknown, fallback?: string | null) => {
    if (!value) return fallback ?? null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return fallback ?? null;
    return date.toISOString();
  };
  const toNumber = (value: unknown, defaultValue = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return defaultValue;
  };
  const toBoolean = (value: unknown, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
      if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false;
    }
    return fallback;
  };
  return {
    id: String(r.id),
    status: (r.status as MatriculaStatus) ?? 'PENDENTE_TAXA',
    dataInicio: toIso(r.dataInicio) ?? new Date().toISOString(),
    dataFim: toIso(r.dataFim, null),
    taxaMatricula: toNumber(r.taxaMatricula ?? 0, 0),
    taxaStatus: (r.taxaStatus as MatriculaTaxaStatus) ?? 'PENDENTE',
    taxaIsenta: toBoolean(r.taxaIsenta, false),
    vencimentoDia: Number((r.vencimentoDia as number | string | undefined) ?? 5),
    aluno: {
      id: String((r.aluno as { id: unknown }).id ?? ''),
      nome: ((r.aluno as { nome?: unknown })?.nome as string | null) ?? null,
      cpf: ((r.aluno as { cpf?: unknown })?.cpf as string | null) ?? null,
    },
    plano: r.plano
      ? {
          id: String((r.plano as { id: unknown }).id ?? ''),
          nome: ((r.plano as { nome?: unknown })?.nome as string | null) ?? '',
          valor: toNumber(
            ((r.plano as { valor?: unknown })?.valor as number | string | undefined) ?? 0,
          ),
        }
      : null,
    responsavelFinanceiro: r.responsavelFinanceiro
      ? {
          id: String((r.responsavelFinanceiro as Record<string, unknown>).id ?? ''),
          nome: String((r.responsavelFinanceiro as Record<string, unknown>).nome ?? ''),
          email: (r.responsavelFinanceiro as Record<string, unknown>).email as string | null,
          telefone: (r.responsavelFinanceiro as Record<string, unknown>).telefone as string | null,
        }
      : null,
    turma: r.turma
      ? {
          id: String((r.turma as Record<string, unknown>).id ?? ''),
          nome: String((r.turma as Record<string, unknown>).nome ?? ''),
          diasSemana: Array.isArray((r.turma as Record<string, unknown>).diasSemana)
            ? ((r.turma as Record<string, unknown>).diasSemana as string[])
            : [],
          horaInicio: String((r.turma as Record<string, unknown>).horaInicio ?? ''),
          horaFim: String((r.turma as Record<string, unknown>).horaFim ?? ''),
        }
      : null,
    combo: r.combo
      ? {
          id: String((r.combo as Record<string, unknown>).id ?? ''),
          nome: String((r.combo as Record<string, unknown>).nome ?? ''),
        }
      : null,
    cobrancas: Array.isArray(r.cobrancas)
      ? (r.cobrancas as unknown[]).map((c) => {
          const cobranca = c as Record<string, unknown>;
          return {
            id: String(cobranca.id ?? ''),
            valor: toNumber(cobranca.valor ?? 0, 0),
            status: (cobranca.status as MatriculaCobrancaStatus) ?? 'PENDENTE',
            formaPagamento: (cobranca.formaPagamento as MatriculaFormaPagamento) ?? 'BOLETO',
            vencimento: toIso(cobranca.vencimento) ?? new Date().toISOString(),
            tipo: (cobranca.tipo as MatriculaTipoCobranca) ?? 'MENSALIDADE',
            descricao: (cobranca.descricao as string | null) ?? null,
            asaasPaymentId: (cobranca.asaasPaymentId as string | null) ?? null,
            asaasId: (cobranca.asaasId as string | null) ?? null,
            createdAt: toIso(cobranca.createdAt) ?? new Date().toISOString(),
            competenciaInicio: toIso(cobranca.competenciaInicio) ?? new Date().toISOString(),
            competenciaFim: toIso(cobranca.competenciaFim) ?? new Date().toISOString(),
            dataPagamento: toIso(cobranca.dataPagamento) ?? null,
          };
        })
      : [],
  };
}

export async function listMatriculasRequest(
  params: ListMatriculasParams,
): Promise<ListMatriculasResponse> {
  const usp = new URLSearchParams({ contaId: params.contaId });
  const statuses = normalizeStatusArray(params.status);
  if (statuses.length) {
    usp.set('status', statuses.join(','));
  }
  if (params.search) {
    usp.set('q', params.search);
  }
  if (params.turmaId) {
    usp.set('turmaId', params.turmaId);
  }
  if (params.page) usp.set('page', String(params.page));
  if (params.pageSize) usp.set('pageSize', String(params.pageSize));

  const res = await fetch(`/api/matriculas?${usp.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: params.signal,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ||
        'Falha ao carregar matrículas.',
    );
  }
  // A API atual retorna { matriculas, total, page, perPage } mas mantemos compatibilidade caso venha { data, pageSize }
  const payload =
    (json as {
      matriculas?: unknown;
      data?: unknown;
      total?: number;
      page?: number;
      perPage?: number;
      pageSize?: number;
    }) || {};
  const rawList = (Array.isArray(payload.matriculas) ? payload.matriculas : payload.data) as
    | unknown[]
    | undefined;
  const items = Array.isArray(rawList) ? rawList.map((item) => normalizeMatricula(item)) : [];
  return {
    data: items,
    total: Number(payload.total ?? items.length),
    page: Number(payload.page ?? 1),
    pageSize: Number(payload.perPage ?? payload.pageSize ?? (items.length || 20)),
  };
}

export interface CreateMatriculaInput {
  contaId: string;
  alunoId: string;
  planoId: string;
  turmaId?: string;
  comboId?: string | null;
  dataInicio?: string;
  vencimento?: string | null;
  vencimentoDia?: number;
  responsavelFinanceiroId?: string | null;
  taxaMatricula?: number;
  taxaIsenta?: boolean;
  formaPagamento?: MatriculaFormaPagamento;
  criarCobranca?: boolean;
  descontos?: Array<{ id: string; cumulativo?: boolean }>;
}

export interface MatriculaCobrancaPayload {
  id: string;
  tipo: MatriculaTipoCobranca;
  competenciaInicio: string;
  competenciaFim: string;
  valor: number;
  vencimento: string;
  formaPagamento: MatriculaFormaPagamento;
  status: MatriculaCobrancaStatus;
  asaasId: string | null;
  asaasPaymentId: string | null;
  descricao: string | null;
  createdAt: string;
  dataPagamento: string | null;
}

export interface MatriculaCreatedPayload {
  matricula: {
    id: string;
    alunoId: string;
    responsavelFinanceiroId: string | null;
    planoId: string;
    turmaId: string | null;
    comboId: string | null;
    status: MatriculaStatus;
    dataInicio: string;
    taxaMatricula: number;
    taxaStatus: MatriculaTaxaStatus;
    taxaIsenta: boolean;
    vencimentoDia: number;
    asaasId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  cobrancas: {
    taxa: MatriculaCobrancaPayload | null;
    mensalidade: MatriculaCobrancaPayload | null;
  };
  preco: {
    plano: number;
    planoLiquido: number;
    taxa: number;
    descontosAplicados: number[];
    total: number;
  };
  checkoutLink: {
    id: string;
    token: string;
    expiresAt: string;
    usedAt: string | null;
    channel: string;
  } | null;
  responsavelFinanceiro: MatriculaListItem['responsavelFinanceiro'];
  primeiroVencimento: string;
}

export async function createMatriculaRequest(
  input: CreateMatriculaInput,
): Promise<MatriculaCreatedPayload> {
  const res = await fetch('/api/matriculas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ||
        'Não foi possível criar a matrícula.',
    );
  }
  const payload = json as MatriculaCreatedPayload;
  payload.matricula.dataInicio = new Date(payload.matricula.dataInicio).toISOString();
  payload.matricula.createdAt = new Date(payload.matricula.createdAt).toISOString();
  payload.matricula.updatedAt = new Date(payload.matricula.updatedAt).toISOString();
  const normalizeCobranca = (
    cobranca: MatriculaCobrancaPayload | null,
  ): MatriculaCobrancaPayload | null => {
    if (!cobranca) return null;
    return {
      ...cobranca,
      competenciaInicio: new Date(cobranca.competenciaInicio).toISOString(),
      competenciaFim: new Date(cobranca.competenciaFim).toISOString(),
      vencimento: new Date(cobranca.vencimento).toISOString(),
      createdAt: new Date(cobranca.createdAt).toISOString(),
      dataPagamento: cobranca.dataPagamento
        ? new Date(cobranca.dataPagamento).toISOString()
        : null,
    };
  };
  payload.cobrancas.taxa = normalizeCobranca(payload.cobrancas.taxa);
  payload.cobrancas.mensalidade = normalizeCobranca(payload.cobrancas.mensalidade);
  if (payload.checkoutLink) {
    payload.checkoutLink.expiresAt = new Date(payload.checkoutLink.expiresAt).toISOString();
    payload.checkoutLink.usedAt = payload.checkoutLink.usedAt
      ? new Date(payload.checkoutLink.usedAt).toISOString()
      : null;
  }
  payload.primeiroVencimento = new Date(payload.primeiroVencimento).toISOString();
  return payload;
}

export async function atualizarStatusMatriculaRequest(input: {
  id: string;
  contaId: string;
  status: MatriculaStatus;
  dataFim?: string | null;
}) {
  const res = await fetch(`/api/matriculas/${input.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      contaId: input.contaId,
      status: input.status,
      dataFim: input.dataFim ?? undefined,
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ||
        'Não foi possível atualizar a matrícula.',
    );
  }
  return json as {
    data: MatriculaCreatedPayload['matricula'];
  };
}

export async function cancelarMatriculaRequest(input: { id: string; contaId: string }) {
  const usp = new URLSearchParams({ contaId: input.contaId });
  const res = await fetch(`/api/matriculas/${input.id}?${usp.toString()}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(
      (json as { error?: { message?: string } } | null)?.error?.message ||
        'Não foi possível cancelar a matrícula.',
    );
  }
}

/**
 * Atualiza status da matrícula com sincronização Asaas
 */
export async function updateMatriculaStatusRequest(input: {
  id: string;
  status: 'ATIVA' | 'PAUSADA' | 'CANCELADA';
}): Promise<MatriculaStatusSyncResponse> {
  const res = await fetch(`/api/matriculas/${input.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ status: input.status }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      (json as { error?: string } | null)?.error || 'Não foi possível atualizar o status.',
    );
  }

  const payload = (json as {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  }) ?? { success: true };

  const data = payload.data ?? {};

  const paymentSyncRaw = data.paymentSync as Record<string, unknown> | undefined;
  const detailsRaw = Array.isArray(paymentSyncRaw?.details)
    ? (paymentSyncRaw?.details as Record<string, unknown>[])
    : [];

  const paymentSync: PaymentSyncInfo = {
    totalFromAsaas: parseNumber(paymentSyncRaw?.totalFromAsaas, 0),
    matched: parseNumber(paymentSyncRaw?.matched, 0),
    updated: parseNumber(paymentSyncRaw?.updated, 0),
    warnings: parseStringArray(paymentSyncRaw?.warnings),
    expectedWebhooks: parseStringArray(paymentSyncRaw?.expectedWebhooks),
    details: detailsRaw.map((detail) => ({
      cobrancaId: String(detail.cobrancaId ?? ''),
      asaasPaymentId: detail.asaasPaymentId ? String(detail.asaasPaymentId) : null,
      novoStatus: isMatriculaCobrancaStatus(detail.novoStatus) ? detail.novoStatus : 'PENDENTE',
      source: detail.source === 'ASAAS' ? 'ASAAS' : 'LOCAL',
    })),
  };

  const normalizedData: MatriculaStatusSyncData = {
    matriculaId: String(data.matriculaId ?? input.id),
    status: isMatriculaStatus(data.status) ? data.status : input.status,
    previousStatus: isMatriculaStatus(data.previousStatus) ? data.previousStatus : input.status,
    asaasAction: (['SUSPEND', 'ACTIVATE', 'DELETE', 'LOCAL_ONLY', 'NONE'] as const).includes(
      data.asaasAction as MatriculaStatusAsaasAction,
    )
      ? (data.asaasAction as MatriculaStatusAsaasAction)
      : 'NONE',
    cobrancasAtualizadas: parseNumber(data.cobrancasAtualizadas, 0),
    nextDueDate: parseIsoDate(data.nextDueDate),
    paymentSync,
  };

  return {
    success: payload.success !== false,
    message: payload.message ?? 'Status atualizado com sucesso.',
    data: normalizedData,
  };
}

/**
 * Reenvia cobrança via Asaas
 */
export async function resendCobrancaRequest(cobrancaId: string): Promise<ResendCobrancaResponse> {
  const res = await fetch(`/api/cobrancas/${cobrancaId}/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      (json as { error?: string } | null)?.error || 'Não foi possível reenviar a cobrança.',
    );
  }

  const payload = (json as {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  }) ?? { success: true };

  const data = payload.data ?? {};

  const normalized: ResendCobrancaData = {
    cobrancaId: String(data.cobrancaId ?? cobrancaId),
    matriculaId: String(data.matriculaId ?? ''),
    status: isMatriculaCobrancaStatus(data.status) ? data.status : 'PENDENTE',
    previousStatus: isMatriculaCobrancaStatus(data.previousStatus)
      ? data.previousStatus
      : 'PENDENTE',
    newTaxaStatus: isMatriculaTaxaStatus(data.newTaxaStatus) ? data.newTaxaStatus : null,
    invoiceUrl: data.invoiceUrl ? String(data.invoiceUrl) : null,
    bankSlipUrl: data.bankSlipUrl ? String(data.bankSlipUrl) : null,
    pixQrCodeUrl: data.pixQrCodeUrl ? String(data.pixQrCodeUrl) : null,
    pixCopyPaste: data.pixCopyPaste ? String(data.pixCopyPaste) : null,
  };

  return {
    success: payload.success !== false,
    message: payload.message ?? 'Cobrança reenviada com sucesso.',
    data: normalized,
  };
}
