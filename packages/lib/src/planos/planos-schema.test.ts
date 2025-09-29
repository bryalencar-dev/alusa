import { describe, expect, it } from 'vitest';
import { PeriodicidadePlano, Status } from '@prisma/client';
import { planoCreateSchema, planoUpdateSchema } from './planos-schema';

describe('planos-schema', () => {
  it('normaliza campos obrigatórios ao criar', () => {
    const payload = {
      contaId: 'conta-123',
      nome: '  Plano Mensal  ',
      descricao: '   ',
      periodicidade: PeriodicidadePlano.MENSAL,
      valor: '189,90',
    } as const;

    const parsed = planoCreateSchema.parse(payload);

    expect(parsed).toEqual({
      contaId: 'conta-123',
      nome: 'Plano Mensal',
      descricao: null,
      periodicidade: PeriodicidadePlano.MENSAL,
      valor: '189.90',
      status: Status.ATIVO,
    });
  });

  it('permite atualizar campos parciais e normaliza descrição vazia', () => {
    const parsed = planoUpdateSchema.parse({
      id: 'plano-1',
      contaId: 'conta-1',
      descricao: '   Novo texto   ',
      valor: 250,
    });

    expect(parsed).toEqual({
      id: 'plano-1',
      contaId: 'conta-1',
      descricao: 'Novo texto',
      valor: '250.00',
    });
  });

  it('rejeita atualização sem campos modificáveis', () => {
    expect(() =>
      planoUpdateSchema.parse({
        id: 'any',
        contaId: 'conta',
      }),
    ).toThrowError(/Informe ao menos um campo para atualizar/);
  });
});
