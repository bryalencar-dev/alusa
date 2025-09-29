'use client';
import { useFormContext } from 'react-hook-form';

interface SalaWizardValues {
  nome: string;
  descricao?: string;
  capacidade: number;
  status?: 'ATIVO' | 'INATIVO';
}
export default function StepResumo() {
  const { watch } = useFormContext<SalaWizardValues>();
  const values = watch();
  return (
    <div className="space-y-4 text-sm">
      <h3 className="text-sm font-medium text-slate-700">Confirme os dados</h3>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <span className="text-xs text-slate-500">Nome</span>
          <div className="mt-0.5 text-slate-800">{values.nome || '-'}</div>
        </div>
        <div>
          <span className="text-xs text-slate-500">Descrição</span>
          <div className="mt-0.5 text-slate-800 whitespace-pre-wrap">
            {values.descricao?.trim() || '-'}
          </div>
        </div>
        <div>
          <span className="text-xs text-slate-500">Capacidade</span>
          <div className="mt-0.5 text-slate-800">{values.capacidade}</div>
        </div>
        <div>
          <span className="text-xs text-slate-500">Status</span>
          <div className="mt-0.5 text-slate-800">{values.status}</div>
        </div>
      </div>
    </div>
  );
}
