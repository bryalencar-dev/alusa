'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { SectionCard, StepHeader } from '../../alunos/wizard/ui';

interface WizardValues {
  idadeMin?: number;
  idadeMax?: number;
  observacao?: string;
}

export default function StepRestricoes() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <SectionCard>
      <StepHeader title="Restrições & Observações" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Idade Mínima</label>
          <Input type="number" {...register('idadeMin', { valueAsNumber: true })} />
          {errors.idadeMin && <p className="text-xs text-red-600">Inválida</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Idade Máxima</label>
          <Input type="number" {...register('idadeMax', { valueAsNumber: true })} />
          {errors.idadeMax && <p className="text-xs text-red-600">Inválida</p>}
        </div>
        <div className="space-y-1 md:col-span-3">
          <label className="text-xs text-slate-600">Observação</label>
          <textarea
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm"
            {...register('observacao')}
          />
        </div>
      </div>
    </SectionCard>
  );
}
