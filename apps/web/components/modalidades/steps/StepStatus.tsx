'use client';
import { useFormContext } from 'react-hook-form';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';

interface WizardValues {
  status?: string;
}

export default function StepStatus() {
  const { watch, setValue } = useFormContext<WizardValues>();
  const status = watch('status') || 'ATIVO';
  return (
    <SectionCard>
      <StepHeader title="Status" />
      <div className="flex items-center gap-3">
        <input
          id="status"
          type="checkbox"
          className="h-4 w-4"
          checked={status === 'ATIVO'}
          onChange={(e) => setValue('status', e.target.checked ? 'ATIVO' : 'INATIVO')}
        />
        <label htmlFor="status" className="text-sm text-slate-700">
          {status === 'ATIVO' ? 'Ativa' : 'Inativa'}
        </label>
      </div>
    </SectionCard>
  );
}
