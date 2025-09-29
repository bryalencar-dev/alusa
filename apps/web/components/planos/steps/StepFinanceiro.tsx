'use client';

import { Controller, useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';

const PERIODICIDADE_OPTIONS = [
  { label: 'Mensal', value: 'MENSAL' },
  { label: 'Quinzenal', value: 'QUINZENAL' },
  { label: 'Semanal', value: 'SEMANAL' },
  { label: 'Trimestral', value: 'TRIMESTRAL' },
  { label: 'Anual', value: 'ANUAL' },
];

export interface StepFinanceiroValues {
  periodicidade: 'MENSAL' | 'QUINZENAL' | 'SEMANAL' | 'TRIMESTRAL' | 'ANUAL';
  valor: string | number;
}

export default function StepFinanceiro() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<StepFinanceiroValues>();

  return (
    <SectionCard>
      <StepHeader title="Financeiro" hint="Defina a recorrência e o valor do plano." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="plano-periodicidade">
            Periodicidade
          </label>
          <Controller
            control={control}
            name="periodicidade"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  id="plano-periodicidade"
                  data-testid="plano-periodicidade-trigger"
                  className="h-10"
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      data-testid={`plano-periodicidade-option-${option.value}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.periodicidade && (
            <p className="text-xs text-red-600">{String(errors.periodicidade.message)}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="plano-valor">
            Valor (R$)
          </label>
          <Input
            id="plano-valor"
            data-testid="plano-valor"
            inputMode="decimal"
            placeholder="0,00"
            {...register('valor')}
          />
          {errors.valor && <p className="text-xs text-red-600">{String(errors.valor.message)}</p>}
        </div>
      </div>
    </SectionCard>
  );
}
