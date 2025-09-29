import { z } from 'zod';

const alunoListItemSchema = z.object({
  id: z.string(),
  nome: z.string().default(''),
  email: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  status: z.string().default('ATIVO'),
  foto: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  consentimentoImagem: z.boolean().nullable().optional(),
  dataConsentimentoImagem: z.string().nullable().optional(),
  isentoTaxaMatricula: z.boolean().nullable().optional(),
  bolsaDescontoPercent: z.union([z.string(), z.number()]).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  dataInativacao: z.string().nullable().optional(),
  motivoInativacao: z.string().nullable().optional(),
});

export type AlunoListItem = z.infer<typeof alunoListItemSchema>;

const alunoListResponseSchema = z.union([
  z.object({ items: z.array(alunoListItemSchema).default([]) }),
  z.object({ data: z.array(alunoListItemSchema).default([]) }),
]);

function extractList(data: unknown): AlunoListItem[] {
  const parsed = alunoListResponseSchema.safeParse(data);
  if (!parsed.success) return [];
  const value = parsed.data;
  if ('items' in value) return value.items;
  return value.data;
}

export async function listAlunos({
  contaId,
  signal,
}: {
  contaId: string;
  signal?: AbortSignal;
}): Promise<AlunoListItem[]> {
  const params = new URLSearchParams({ contaId });
  const res = await fetch(`/api/alunos?${params.toString()}`, {
    cache: 'no-store',
    signal,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? 'Falha ao carregar alunos');
  }
  const json = await res.json();
  return extractList(json);
}

export async function deleteAluno({ id, reason }: { id: string; reason?: string }) {
  const search = reason?.trim() ? `?motivo=${encodeURIComponent(reason.trim())}` : '';
  const res = await fetch(`/api/alunos/${id}${search}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message ?? 'Erro ao excluir aluno');
  }
}
