import { z } from 'zod';

const professorListItemSchema = z.object({
  id: z.string(),
  nome: z.string().default(''),
  email: z.string().nullable().optional(),
  telefoneCel: z.string().nullable().optional(),
  status: z.string().default('ATIVO'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ProfessorListItem = z.infer<typeof professorListItemSchema>;

export interface ListProfessoresParams {
  contaId: string;
  signal?: AbortSignal;
  search?: string;
  status?: 'ATIVO' | 'INATIVO' | 'TODOS';
}

export interface UpdateProfessorPayload {
  contaId: string;
  nome?: string;
  email?: string | null;
  telefoneCel?: string | null;
  status?: 'ATIVO' | 'INATIVO';
}

export async function listProfessores({
  contaId,
  search,
  status,
  signal,
}: ListProfessoresParams): Promise<ProfessorListItem[]> {
  const params = new URLSearchParams({ contaId, pageSize: '200' });
  if (search && search.trim()) params.set('q', search.trim());
  if (status && status !== 'TODOS') params.set('status', status);

  const res = await fetch(`/api/professores?${params.toString()}`, {
    cache: 'no-store',
    signal,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? 'Falha ao carregar professores');
  }

  const json = await res.json().catch(() => ({}));
  const dataArray = Array.isArray(json?.data)
    ? (json.data as unknown[])
    : Array.isArray(json?.items)
      ? (json.items as unknown[])
      : [];

  const parsed = z.array(professorListItemSchema).safeParse(dataArray);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
}

export async function updateProfessor({
  id,
  payload,
}: {
  id: string;
  payload: UpdateProfessorPayload;
}): Promise<ProfessorListItem> {
  const res = await fetch(`/api/professores/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? 'Falha ao atualizar professor');
  }

  const json = await res.json().catch(() => ({}));
  const parsed = professorListItemSchema.safeParse(json?.data ?? json);
  if (!parsed.success) {
    throw new Error('Resposta inválida ao atualizar professor');
  }

  return parsed.data;
}

export async function deleteProfessor({ id, contaId }: { id: string; contaId: string }) {
  if (!contaId) {
    throw new Error('Conta não informada para exclusão de professor.');
  }
  const qs = `?contaId=${encodeURIComponent(contaId)}`;
  const res = await fetch(`/api/professores/${id}${qs}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? 'Erro ao excluir professor');
  }
}
