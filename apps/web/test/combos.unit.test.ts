import { describe, it, expect } from 'vitest';
import { normalizeCombo } from '@/features/cadastro/combos/services/combos-service';

describe('combos-service normalizeCombo', () => {
  it('normaliza campos obrigatórios e opcionais', () => {
    const combo = normalizeCombo({
      id: '1',
      contaId: 'c1',
      nome: 'Combo Gold',
      descricao: 'Desc',
      valorMensal: 150,
      taxaMatricula: 50,
      categoriaMensal: 'MENSAL',
      categoriaTaxa: 'ADM',
      status: 'ATIVO',
      modoMatricula: 'RESERVADA',
      vigenciaIni: '2025-01-01',
      vigenciaFim: '2025-12-31',
      vagasLimite: 20,
      turmas: [{ id: 't1', nome: 'Turma 1' }],
    });
    expect(combo.nome).toBe('Combo Gold');
    expect(combo.valorMensal).toBe(150);
    expect(combo.turmas).toHaveLength(1);
  });

  it('aplica defaults e coerções', () => {
    const combo = normalizeCombo({
      id: 2,
      contaId: 'c2',
      nome: 'X',
      valorMensal: '99.9',
      taxaMatricula: null,
      turmas: [],
    });
    expect(combo.id).toBe('2');
    expect(combo.valorMensal).toBe(99.9);
    expect(combo.taxaMatricula).toBeNull();
    expect(combo.status).toBe('ATIVO');
  });
});
