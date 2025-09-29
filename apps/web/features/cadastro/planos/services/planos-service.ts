export type PlanoStatus = 'ATIVO' | 'INATIVO';
export type PlanoPeriodicidade = 'MENSAL' | 'QUINZENAL' | 'SEMANAL' | 'TRIMESTRAL' | 'ANUAL';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface PlanoListItem {
  id: string;
  contaId: string;
  nome: string;
  descricao: string | null;
  periodicidade: PlanoPeriodicidade;
  valor: number;
  valorCentavos: number;
  valorDecimal: string;
  valorFormatado: string;
  status: PlanoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListPlanosParams {
  contaId: string;
  search?: string;
  status?: PlanoStatus | 'TODOS';
  signal?: AbortSignal;
}

function assertNonEmptyId(id: unknown): asserts id is string {
  const s = typeof id === 'string' ? id.trim() : String(id ?? '').trim();
  if (!s) {
    // Falha rápida e explícita: evita que a UI congele por key duplicada
    throw new Error(
      'Plano sem "id" na resposta da API. Ajuste o endpoint/lib para incluir o campo "id".',
    );
  }
}

function normalizePlano(raw: Record<string, unknown>): PlanoListItem {
  // --- GARANTE ID ---
  assertNonEmptyId(raw.id);
  const id = String(raw.id).trim();

  const valorNumberRaw = typeof raw.valor === 'number' ? raw.valor : Number(raw.valor ?? 0);
  const valorNumber = Number.isFinite(valorNumberRaw) ? valorNumberRaw : 0;

  const valorCentavosRaw =
    typeof raw.valorCentavos === 'number' && Number.isFinite(raw.valorCentavos)
      ? Math.round(raw.valorCentavos)
      : Math.round(valorNumber * 100);

  const valorDecimalRaw =
    typeof raw.valorDecimal === 'string' && raw.valorDecimal.trim().length > 0
      ? raw.valorDecimal.trim()
      : (valorCentavosRaw / 100).toFixed(2);

  const valorFormatadoRaw =
    typeof raw.valorFormatado === 'string' && raw.valorFormatado.trim().length > 0
      ? raw.valorFormatado
      : currencyFormatter.format(valorCentavosRaw / 100);

  return {
    id,
    contaId: String(raw.contaId ?? ''),
    nome: String(raw.nome ?? ''),
    descricao: raw.descricao == null ? null : String(raw.descricao),
    periodicidade: (['MENSAL', 'QUINZENAL', 'SEMANAL', 'TRIMESTRAL', 'ANUAL'] as const).includes(
      raw.periodicidade as PlanoPeriodicidade,
    )
      ? (raw.periodicidade as PlanoPeriodicidade)
      : 'MENSAL',
    valor: valorNumber,
    valorCentavos: valorCentavosRaw,
    valorDecimal: valorDecimalRaw,
    valorFormatado: valorFormatadoRaw,
    status: raw.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  } satisfies PlanoListItem;
}

export async function listPlanos({
  contaId,
  search,
  status,
  signal,
}: ListPlanosParams): Promise<PlanoListItem[]> {
  const params = new URLSearchParams();
  params.set('contaId', contaId);
  if (search && search.trim()) params.set('q', search.trim());
  if (status && status !== 'TODOS') params.set('status', status);

  const response = await fetch(`/api/planos?${params.toString()}`, {
    method: 'GET',
    signal,
    headers: { Accept: 'application/json' },
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (json as { error?: { message?: string } } | null)?.error?.message ??
      'Não foi possível listar os planos.';
    throw new Error(message);
  }

  const data = Array.isArray((json as { data?: unknown })?.data)
    ? ((json as { data?: unknown[] }).data as unknown[])
    : [];

  // mapeia e, caso ocorra ausência de id em algum item, lança erro claro
  return data.map((item) => normalizePlano(item as Record<string, unknown>));
}

export interface CreatePlanoPayload {
  contaId: string;
  nome: string;
  descricao?: string | null;
  periodicidade: PlanoPeriodicidade;
  valor: string | number;
  status?: PlanoStatus;
}

export async function createPlanoRequest(payload: CreatePlanoPayload): Promise<PlanoListItem> {
  const response = await fetch('/api/planos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (json as { error?: { message?: string } } | null)?.error?.message ??
      'Não foi possível criar o plano.';
    throw new Error(message);
  }

  const data = (json as { data?: Record<string, unknown> } | null)?.data;
  if (!data) throw new Error('Resposta inválida ao criar plano.');

  return normalizePlano(data);
}

export interface UpdatePlanoPayload {
  contaId: string;
  nome?: string;
  descricao?: string | null;
  periodicidade?: PlanoPeriodicidade;
  valor?: string | number;
  status?: PlanoStatus;
}

export async function updatePlanoRequest({
  id,
  payload,
}: {
  id: string;
  payload: UpdatePlanoPayload;
}): Promise<PlanoListItem> {
  const response = await fetch('/api/planos', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id, ...payload }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (json as { error?: { message?: string } } | null)?.error?.message ??
      'Não foi possível atualizar o plano.';
    throw new Error(message);
  }

  const data = (json as { data?: Record<string, unknown> } | null)?.data;
  if (!data) throw new Error('Resposta inválida ao atualizar plano.');

  return normalizePlano(data);
}

export async function deletePlanoRequest({
  id,
  contaId,
}: {
  id: string;
  contaId: string;
}): Promise<PlanoListItem> {
  const response = await fetch('/api/planos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id, contaId }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (json as { error?: { message?: string } } | null)?.error?.message ??
      'Não foi possível excluir o plano.';
    throw new Error(message);
  }

  const data = (json as { data?: Record<string, unknown> } | null)?.data;
  if (!data) throw new Error('Resposta inválida ao excluir plano.');

  return normalizePlano(data);
}
