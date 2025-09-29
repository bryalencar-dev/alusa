'use client';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SalaWizardValues {
  nome: string;
  descricao?: string;
  capacidade: number;
  status?: string;
}
export default function StepDadosBasicos() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SalaWizardValues>();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-xs text-slate-600">Nome</label>
        <Input
          placeholder="Nome da sala"
          {...register('nome')}
          aria-invalid={!!errors.nome || undefined}
        />
        {errors.nome && <p className="text-xs text-red-600">{String(errors.nome.message)}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-600">Descrição</label>
        <Textarea
          placeholder="Descrição (opcional)"
          {...register('descricao')}
          className="resize-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-600">Capacidade</label>
        <Input
          type="number"
          min={1}
          {...register('capacidade', { valueAsNumber: true })}
          aria-invalid={!!errors.capacidade || undefined}
        />
        {errors.capacidade && <p className="text-xs text-red-600">Capacidade inválida</p>}
      </div>
    </div>
  );
}
