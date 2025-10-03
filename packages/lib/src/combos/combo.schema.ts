import { z } from 'zod';

export const comboStatusEnum = z.enum(['ATIVO', 'INATIVO']);
export const comboModoMatriculaEnum = z.enum(['RESERVADA', 'SOB_DEMANDA']);

// Normalização de monetários (string/number) -> number com 2 casas
function normalizeMoney(v: unknown): number {
  if (v === null || v === undefined) return Number.NaN;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : Number.NaN;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return Number.NaN;
    const normalized = trimmed.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
  }
  return Number.NaN;
}

const moneySchema = z
  .unknown()
  .transform(normalizeMoney)
  .refine((n) => !Number.isNaN(n), 'Valor inválido')
  .refine((n) => n >= 0, 'Valor deve ser >= 0');

const comboBaseObj = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (typeof v !== 'string') return null;
      const t = v.trim();
      return t.length ? t : null;
    })
    .refine((v) => v === null || v.length <= 400, 'Descrição muito longa'),
  valorMensal: moneySchema,
  taxaMatricula: moneySchema.optional(),
  categoriaMensal: z.string().trim().max(80).optional(),
  categoriaTaxa: z.string().trim().max(80).optional(),
  status: comboStatusEnum.default('ATIVO').optional(),
  modoMatricula: comboModoMatriculaEnum.default('RESERVADA'),
  vigenciaIni: z.coerce.date().optional(),
  vigenciaFim: z.coerce.date().optional(),
  vagasLimite: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? Number(v) : v))
    .refine((v) => v === undefined || Number.isInteger(v), 'vagasLimite deve ser inteiro')
    .refine((v) => v === undefined || v > 0, 'vagasLimite deve ser > 0')
    .optional(),
});

export const comboBaseSchema = comboBaseObj;

function withRanges<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((val: unknown, ctx) => {
    const v = val as { vigenciaIni?: Date; vigenciaFim?: Date };
    if (v.vigenciaFim && v.vigenciaIni && v.vigenciaFim < v.vigenciaIni) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vigenciaFim'],
        message: 'vigência fim deve ser >= início',
      });
    }
  });
}

export const comboCreateSchema = withRanges(
  comboBaseObj.extend({
    contaId: z.string().min(1),
    turmaIds: z.array(z.string().min(1)).default([]).optional(),
  }),
);
export type ComboCreateInput = z.infer<typeof comboCreateSchema>;

export const comboUpdateSchema = withRanges(
  comboBaseObj.partial().extend({
    id: z.string().min(1),
    contaId: z.string().min(1),
    turmaIds: z.array(z.string().min(1)).optional(),
  }),
);
export type ComboUpdateInput = z.infer<typeof comboUpdateSchema>;

export const comboFilterSchema = z.object({
  contaId: z.string().min(1),
  status: comboStatusEnum.optional(),
  search: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional()
    .transform((v) => (v && v.length ? v : undefined)),
});
export type ComboFilterInput = z.infer<typeof comboFilterSchema>;

export interface ComboDTO {
  id: string;
  contaId: string;
  nome: string;
  descricao: string | null;
  valorMensal: number;
  taxaMatricula: number | null;
  categoriaMensal: string | null;
  categoriaTaxa: string | null;
  status: string;
  modoMatricula: string;
  vigenciaIni: Date | null;
  vigenciaFim: Date | null;
  vagasLimite: number | null;
  turmas: { id: string; nome: string }[];
  createdAt: Date;
  updatedAt: Date;
}
