import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { WizardContextValue } from '../types';

interface SubmitPayload {
  contaId: string;
  alunoId?: string;
  planoId?: string;
  turmaId?: string;
  comboId?: string;
  taxaMatricula?: number;
  dataInicio?: string;
  formaPagamento?: string;
  criarCobranca: boolean;
}

interface StepResumoProps {
  ctx: WizardContextValue;
  onSubmit?: (_payload: SubmitPayload) => Promise<void> | void;
}

export function StepResumo({ ctx, onSubmit }: StepResumoProps) {
  const { state, goBack, reset } = ctx;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turmaId = state.turmaIds[0];

  const payload: SubmitPayload = {
    contaId: state.contaId,
    alunoId: state.aluno?.id,
    planoId: state.planoId,
    turmaId: turmaId,
    comboId: state.comboId,
    taxaMatricula: state.taxaMatricula,
    dataInicio: state.dataInicio,
    formaPagamento: state.formaPagamento,
    criarCobranca: state.criarCobranca,
  };

  const canSubmit =
    !!payload.alunoId &&
    !!payload.planoId &&
    (payload.turmaId || payload.comboId) &&
    !!payload.dataInicio;

  return (
    <div className="space-y-4 text-xs">
      <div className="rounded border p-3 space-y-1 bg-gray-50">
        <p>
          <span className="font-medium">Aluno:</span> {state.aluno?.nome}
        </p>
        <p>
          <span className="font-medium">Plano:</span> {state.planoLabel}
        </p>
        {payload.turmaId && (
          <p>
            <span className="font-medium">Turma:</span> {state.turmaLabel || payload.turmaId}
          </p>
        )}
        {payload.comboId && (
          <p>
            <span className="font-medium">Combo:</span> {state.comboLabel}
          </p>
        )}
        <p>
          <span className="font-medium">Data início:</span> {payload.dataInicio}
        </p>
        <p>
          <span className="font-medium">Forma Pgto:</span> {payload.formaPagamento}
        </p>
        {state.taxaMatricula != null && (
          <p>
            <span className="font-medium">Taxa matrícula:</span> R$ {state.taxaMatricula.toFixed(2)}
          </p>
        )}
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={goBack}>
          Voltar
        </Button>
        <Button
          type="button"
          disabled={!canSubmit || saving}
          onClick={async () => {
            setSaving(true);
            setError(null);
            try {
              if (onSubmit) await onSubmit(payload);
              else {
                const r = await fetch('/api/matriculas', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (!r.ok) throw new Error('Falha ao salvar');
              }
              reset({});
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Salvando...' : 'Confirmar'}
        </Button>
      </div>
    </div>
  );
}
