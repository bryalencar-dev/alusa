'use client';

import { useFormContext } from 'react-hook-form';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';

interface StepStatusResumoValues {
  nome: string;
  descricao?: string | null;
  periodicidade: 'MENSAL' | 'QUINZENAL' | 'SEMANAL' | 'TRIMESTRAL' | 'ANUAL';
  valor: string | number;
  status: 'ATIVO' | 'INATIVO';
}

const periodicidadeLabels: Record<StepStatusResumoValues['periodicidade'], string> = {
  MENSAL: 'Mensal',
  QUINZENAL: 'Quinzenal',
  SEMANAL: 'Semanal',
  TRIMESTRAL: 'Trimestral',
  ANUAL: 'Anual',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export default function StepStatusResumo() {
  const { watch, setValue } = useFormContext<StepStatusResumoValues>();
  const values = watch();
  const valorNumber = (() => {
    if (typeof values.valor === 'number') return values.valor;
    if (typeof values.valor === 'string') {
      const raw = values.valor.trim();
      if (!raw) return 0;
      if (raw.includes(',')) {
        const sanitized = raw
          .replace(/[R$\s]/gi, '')
          .replace(/\./g, '')
          .replace(',', '.');
        const parsed = Number(sanitized);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      const parsed = Number(raw.replace(/[R$\s]/gi, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  })();

  return (
    <SectionCard>
      <StepHeader title="Status e resumo" hint="Revise as informações antes de salvar." />
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <input
            id="plano-status"
            type="checkbox"
            className="h-4 w-4"
            checked={values.status !== 'INATIVO'}
            onChange={(event) => setValue('status', event.target.checked ? 'ATIVO' : 'INATIVO')}
          />
          <label htmlFor="plano-status" className="text-sm text-slate-700">
            {values.status === 'INATIVO' ? 'Plano inativo' : 'Plano ativo'}
          </label>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-slate-600">Nome</dt>
              <dd>{values.nome || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-600">Descrição</dt>
              <dd>{values.descricao?.trim() || '-'}</dd>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <dt className="font-medium text-slate-600">Periodicidade</dt>
                <dd>{periodicidadeLabels[values.periodicidade] ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Valor</dt>
                <dd>{currencyFormatter.format(Number.isFinite(valorNumber) ? valorNumber : 0)}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </SectionCard>
  );
}
