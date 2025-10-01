import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { WizardContextValue } from '../types';

interface Option {
  value: string;
  label: string;
  descricao?: string;
  capacidade?: number;
  idadeMin?: number;
  idadeMax?: number;
  horaInicio?: string;
  horaFim?: string;
}

interface StepTurmasComboProps {
  ctx: WizardContextValue;
  contaId?: string;
}

export function StepTurmasCombo({ ctx, contaId }: StepTurmasComboProps) {
  const { state, update, goNext, goBack } = ctx;
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState<Option[]>([]);
  const [combos, setCombos] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contaId) return;
    setLoading(true);
    const controller = new AbortController();
    (async () => {
      try {
        const fetchJson = async (url: string) => {
          const r = await fetch(url, { signal: controller.signal });
          const j = await r.json();
          return j;
        };
        const [turmasRes, combosRes] = await Promise.all([
          fetchJson(`/api/turmas?contaId=${contaId}&pageSize=100`),
          fetchJson(`/api/combos?contaId=${contaId}`),
        ]);
  const tItems: unknown[] = turmasRes?.data ?? [];
  const cItems: unknown[] = combosRes?.data ?? [];
        setTurmas(
          tItems.map((raw) => {
            const t = raw as Record<string, unknown>;
            return {
              value: String(t.id ?? ''),
              label: String(t.nome ?? 'Turma'),
              idadeMin: typeof t.idadeMin === 'number' ? t.idadeMin : undefined,
              idadeMax: typeof t.idadeMax === 'number' ? t.idadeMax : undefined,
              horaInicio: typeof t.horaInicio === 'string' ? t.horaInicio : undefined,
              horaFim: typeof t.horaFim === 'string' ? t.horaFim : undefined,
              capacidade: typeof t.capacidade === 'number' ? t.capacidade : undefined,
            } as Option;
          }),
        );
        setCombos(
          cItems.map((raw) => {
            const c = raw as Record<string, unknown>;
            return {
              value: String(c.id ?? ''),
              label: String(c.nome ?? 'Combo'),
              descricao: typeof c.descricao === 'string' ? c.descricao : undefined,
            } as Option;
          }),
        );
      } catch (e) {
        const name = (e as { name?: string } | null)?.name;
        if (name !== 'AbortError') setError('Falha ao carregar turmas/combos');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [contaId]);

  const modo = state.modoTurmas;

  const toggleTurma = (id: string) => {
    // MVP: permitir somente 1 turma enquanto API suporta uma
    if (state.turmaIds.includes(id)) {
      update({ turmaIds: state.turmaIds.filter((t) => t !== id) });
    } else {
      const turma = turmas.find(t => t.value === id);
      update({ turmaIds: [id], comboId: undefined, modoTurmas: 'TURMAS', turmaLabel: turma?.label });
    }
  };

  const canContinue = useMemo(() => {
    if (modo === 'COMBO') return !!state.comboId;
    return state.turmaIds.length === 1; // restrição atual
  }, [modo, state.comboId, state.turmaIds]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => update({ modoTurmas: 'TURMAS', comboId: undefined })}
          className={modo === 'TURMAS' ? 'font-semibold underline' : 'opacity-70 hover:underline'}
        >
          Selecionar Turma
        </button>
        <span className="text-gray-400">|</span>
        <button
          type="button"
          onClick={() => update({ modoTurmas: 'COMBO', turmaIds: [] })}
          className={modo === 'COMBO' ? 'font-semibold underline' : 'opacity-70 hover:underline'}
        >
          Matricular por Combo
        </button>
      </div>

      {modo === 'COMBO' && (
        <div>
          <label className="text-xs font-medium text-gray-600">Combo</label>
          <Select
            value={state.comboId ?? ''}
            onValueChange={(val) => {
              const combo = combos.find(c => c.value === val);
              update({ comboId: val, turmaIds: [], comboLabel: combo?.label });
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione'} />
            </SelectTrigger>
            <SelectContent>
              {combos.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.comboId && (
            <p className="mt-2 text-[11px] text-gray-500">
              Combo escolhido: {combos.find((c) => c.value === state.comboId)?.label}
            </p>
          )}
        </div>
      )}

      {modo === 'TURMAS' && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Turma</p>
          <div className="space-y-2 max-h-56 overflow-auto border rounded p-2 bg-gray-50">
            {turmas.map((t) => {
              const active = state.turmaIds.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => toggleTurma(t.value)}
                  className={`w-full text-left px-2 py-1 rounded text-xs border transition ${active ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:border-gray-300'}`}
                >
                  <span className="font-medium">{t.label}</span>
                  <span className="block text-[10px] text-gray-500">
                    {t.horaInicio} - {t.horaFim}
                  </span>
                </button>
              );
            })}
            {turmas.length === 0 && !loading && (
              <p className="text-[11px] text-gray-500">Nenhuma turma disponível.</p>
            )}
          </div>
          {state.turmaIds.length > 1 && (
            <p className="text-[11px] text-orange-600 mt-1">
              MVP: seleção limitada a 1 turma (mais turmas em breve).
            </p>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={goBack}>
          Voltar
        </Button>
        <Button type="button" disabled={!canContinue} onClick={goNext}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
