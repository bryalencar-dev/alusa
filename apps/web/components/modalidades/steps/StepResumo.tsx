'use client';
import { useFormContext } from 'react-hook-form';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';

interface WizardValues {
  nome: string;
  descricao?: string;
  status?: string;
}

export default function StepResumo() {
  const { getValues } = useFormContext<WizardValues>();
  const v = getValues();
  return (
    <SectionCard>
      <StepHeader title="Resumo" />
      <div className="space-y-3 text-sm">
        <div>
          <strong>Nome:</strong> {v.nome}
        </div>
        <div>
          <strong>Descrição:</strong> {v.descricao || '-'}
        </div>
        <div>
          <strong>Status:</strong> {v.status === 'INATIVO' ? 'Inativa' : 'Ativa'}
        </div>
      </div>
    </SectionCard>
  );
}
