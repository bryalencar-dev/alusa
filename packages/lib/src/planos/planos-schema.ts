import { PeriodicidadePlano, Status } from '@prisma/client';
import { z } from 'zod';

export const planoStatusEnum = z.nativeEnum(Status);
export const planoPeriodicidadeEnum = z.nativeEnum(PeriodicidadePlano);

function mapDescricao(value: unknown): string | null | undefined {
  if (typeof value === 'undefined') return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseValor(raw: unknown): string {
  if (typeof raw === 'bigint') {
    raw = Number(raw);
  } else if (raw instanceof Object && 'toString' in raw && typeof raw.toString === 'function') {
    raw = raw.toString();
  }

  let numeric: number | null = null;
  if (typeof raw === 'number') {
    numeric = raw;
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) numeric = NaN;
    else if (trimmed.includes(',') && trimmed.includes('.')) {
      const lastComma = trimmed.lastIndexOf(',');
      const inteiro = trimmed.slice(0, lastComma).replace(/\./g, '');
      const decimal = trimmed.slice(lastComma + 1).replace(/[^0-9]/g, '');
      numeric = Number(`${inteiro}.${decimal}`);
    } else if (trimmed.includes(',')) {
      numeric = Number(trimmed.replace(',', '.'));
    } else {
      numeric = Number(trimmed);
    }
  }

  if (numeric === null || Number.isNaN(numeric)) {
    throw new Error('Valor do plano inválido.');
  }

  if (numeric <= 0) {
    throw new Error('Valor do plano deve ser maior que zero.');
  }

  const cents = Math.round(numeric * 100);
  if (!Number.isFinite(cents)) {
    throw new Error('Valor do plano inválido.');
  }

  if (Math.abs(cents) > 999_999_999_999) {
    throw new Error('Valor do plano excede o limite permitido.');
  }

  return (cents / 100).toFixed(2);
}

const planoEditableSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(120, 'Nome deve ter no máximo 120 caracteres')
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, 'Nome é obrigatório'),
  descricao: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => mapDescricao(value)),
  periodicidade: planoPeriodicidadeEnum,
  valor: z.union([z.string(), z.number(), z.bigint()]).transform((value) => parseValor(value)),
  status: planoStatusEnum.default(Status.ATIVO),
});

export const planoCreateSchema = planoEditableSchema.extend({
  contaId: z.string().min(1, 'contaId é obrigatório'),
});

export const planoUpdateSchema = planoEditableSchema
  .partial()
  .extend({
    id: z.string().min(1, 'id é obrigatório'),
    contaId: z.string().min(1, 'contaId é obrigatório'),
    status: planoStatusEnum.optional(),
  })
  .refine(
    (data) =>
      typeof data.nome === 'string' ||
      data.descricao !== undefined ||
      data.periodicidade !== undefined ||
      data.valor !== undefined ||
      data.status !== undefined,
    { message: 'Informe ao menos um campo para atualizar.', path: ['id'] },
  );

export type PlanoCreateInput = z.infer<typeof planoCreateSchema>;
export type PlanoUpdateInput = z.infer<typeof planoUpdateSchema>;

export const planoFilterSchema = z.object({
  contaId: z.string().min(1, 'contaId é obrigatório'),
  status: planoStatusEnum.optional(),
  search: z.string().optional(),
});

export type PlanoFilterInput = z.infer<typeof planoFilterSchema>;

export type PlanoDTO = {
  id: string;
  contaId: string;
  nome: string;
  descricao: string | null;
  periodicidade: PeriodicidadePlano;
  /** Valor em string decimal (ex.: "165.00") exatamente como armazenado */
  valorDecimal: string;
  /** Valor em centavos, útil para cálculos sem imprecisão */
  valorCentavos: number;
  /** Valor em número com 2 casas (mantido para retrocompatibilidade gradual) */
  valor: number;
  /** Valor já formatado em pt-BR (ex.: R$ 165,00) */
  valorFormatado: string;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
};
