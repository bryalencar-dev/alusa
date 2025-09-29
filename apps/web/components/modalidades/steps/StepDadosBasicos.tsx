'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';

interface WizardValues {
  nome: string;
  descricao?: string;
}

export default function StepDadosBasicos() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();
  return (
    <SectionCard>
      <StepHeader title="Dados Básicos" />
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-600" htmlFor="nome">
            Nome
          </label>
          <Input
            id="nome"
            placeholder="Nome da modalidade"
            {...register('nome')}
            aria-invalid={!!errors.nome || undefined}
            aria-describedby={errors.nome ? 'err-nome' : undefined}
          />
          {errors.nome && (
            <p id="err-nome" className="text-xs text-red-600">
              {String(errors.nome.message)}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600" htmlFor="descricao">
            Descrição
          </label>
          <Textarea
            id="descricao"
            rows={4}
            placeholder="Descrição (opcional)"
            {...register('descricao')}
          />
        </div>
      </div>
    </SectionCard>
  );
}
