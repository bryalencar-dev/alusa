'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';

export interface StepDadosBasicosValues {
  nome: string;
  descricao?: string | null;
}

export default function StepDadosBasicos() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StepDadosBasicosValues>();

  return (
    <SectionCard>
      <StepHeader title="Dados básicos" hint="Defina como o plano será identificado." />
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="plano-nome">
            Nome do plano
          </label>
          <Input
            id="plano-nome"
            data-testid="plano-nome"
            placeholder="Ex.: Mensal 2x/semana"
            {...register('nome')}
            aria-invalid={errors.nome ? 'true' : undefined}
            aria-describedby={errors.nome ? 'error-plano-nome' : undefined}
          />
          {errors.nome && (
            <p id="error-plano-nome" className="text-xs text-red-600">
              {String(errors.nome.message)}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="plano-descricao">
            Descrição (opcional)
          </label>
          <Textarea
            id="plano-descricao"
            data-testid="plano-descricao"
            rows={4}
            placeholder="Detalhes rápidos sobre o que o plano inclui"
            {...register('descricao')}
          />
          {errors.descricao && (
            <p className="text-xs text-red-600">{String(errors.descricao.message)}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
