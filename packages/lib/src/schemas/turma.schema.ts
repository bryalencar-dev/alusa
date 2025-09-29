import { z } from 'zod';

// Dias curtos incluindo domingo
export const diasEnum = z.enum(['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']);

export const turmaSchema = z
  .object({
    nome: z.string().min(3),
    modalidadeId: z.string().cuid(),
    salaId: z.string().cuid(),
    diasSemana: z.array(diasEnum).min(1),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
    horaFim: z.string().regex(/^\d{2}:\d{2}$/),
    idadeMin: z.number().int().optional(),
    idadeMax: z.number().int().optional(),
    capacidade: z.number().int().positive(),
    status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
    observacao: z.string().optional(),
    professoresIds: z.array(z.string().cuid()).optional(),
  })
  .refine((data) => data.horaInicio < data.horaFim, {
    message: 'Hora de início deve ser antes da hora de fim',
    path: ['horaInicio'],
  })
  .refine((data) => !data.idadeMin || !data.idadeMax || data.idadeMin <= data.idadeMax, {
    message: 'Idade mínima não pode ser maior que idade máxima',
    path: ['idadeMin'],
  });

export type TurmaCreateInput = z.infer<typeof turmaSchema> & { contaId: string };
export type TurmaUpdateInput = Partial<z.infer<typeof turmaSchema>> & {
  id: string;
  contaId: string;
};
