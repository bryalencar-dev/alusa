import { useEffect, useMemo, useState } from 'react';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  const { state, update } = ctx;
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState<Option[]>([]);
  const [combos, setCombos] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    if (!contaId) return;
    setLoading(true);
    const controller = new AbortController();

    (async () => {
      try {
        const fetchJson = async (url: string) => {
          const response = await fetch(url, { signal: controller.signal });
          return response.json();
        };

        const [turmasRes, combosRes] = await Promise.all([
          fetchJson(`/api/turmas?contaId=${contaId}&pageSize=200&q=${encodeURIComponent(query)}`),
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
            } satisfies Option;
          }),
        );

        setCombos(
          cItems.map((raw) => {
            const c = raw as Record<string, unknown>;
            return {
              value: String(c.id ?? ''),
              label: String(c.nome ?? 'Combo'),
              descricao: typeof c.descricao === 'string' ? c.descricao : undefined,
            } satisfies Option;
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
  }, [contaId, query]);

  const modo = state.modoTurmas;

  const toggleTurma = (id: string) => {
    if (state.turmaIds.includes(id)) {
      update({ turmaIds: [], turmaLabel: undefined });
    } else {
      const turma = turmas.find((t) => t.value === id);
      update({ turmaIds: [id], comboId: undefined, modoTurmas: 'TURMAS', turmaLabel: turma?.label });
      setQuery('');
    }
  };

  const filteredTurmas = useMemo(() => {
    if (!query.trim()) return turmas.slice(0, 30);
    const q = query.toLowerCase();
    return turmas.filter((t) => t.label.toLowerCase().includes(q)).slice(0, 30);
  }, [turmas, query]);

  const canContinue = useMemo(() => {
    if (modo === 'COMBO') return !!state.comboId;
    return state.turmaIds.length === 1;
  }, [modo, state.comboId, state.turmaIds]);

  return (
    <SectionCard>
      <StepHeader
        title="Turma ou Combo"
        hint="Escolha uma turma individual ou matricule através de um combo para acelerar a jornada."
      />
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => update({ modoTurmas: 'TURMAS', comboId: undefined })}
            className={`h-8 rounded-md border px-3 transition text-[11px] tracking-wide ${
              modo === 'TURMAS'
                ? 'bg-[#4f2298] border-[#4f2298] text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Selecionar turma
          </button>
          <button
            type="button"
            onClick={() => update({ modoTurmas: 'COMBO', turmaIds: [] })}
            className={`h-8 rounded-md border px-3 transition text-[11px] tracking-wide ${
              modo === 'COMBO'
                ? 'bg-[#4f2298] border-[#4f2298] text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Selecionar Combo
          </button>
        </div>

        {modo === 'COMBO' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Selecione o combo</p>
            <div className="relative">
              <input
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Digite para buscar combos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 120)}
              />
              <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              {focused && (
                <div className="absolute z-40 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {combos.length === 0 && !loading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Nenhum combo</div>
                  )}
                  {combos
                    .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 30)
                    .map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        data-selected={c.value === state.comboId || undefined}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          update({ comboId: c.value, turmaIds: [], comboLabel: c.label });
                          setQuery(c.label);
                          setFocused(false);
                        }}
                        className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 data-[selected]:bg-[#4f2298] data-[selected]:text-white data-[selected]:font-medium"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{c.label}</span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            {state.comboId && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#4f2298] bg-[#4f2298]/10 px-3 py-1 text-xs font-medium text-[#4f2298]">
                  {state.comboLabel}
                  <button
                    type="button"
                    onClick={() => update({ comboId: undefined, comboLabel: undefined })}
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[#4f2298] hover:bg-[#4f2298]/20"
                    aria-label="Remover combo"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              </div>
            )}
          </div>
        )}

        {modo === 'TURMAS' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Digite o nome da turma abaixo:</p>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1.5">
                {state.turmaIds.map((id) => {
                  const t = turmas.find((x) => x.value === id);
                  if (!t) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full border border-[#4f2298] bg-[#4f2298]/10 px-3 py-1 text-xs font-medium text-[#4f2298]"
                    >
                      {t.label}
                      <button
                        type="button"
                        onClick={() => toggleTurma(id)}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[#4f2298]/20"
                        aria-label="Remover turma"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 120)}
                  onKeyDown={(e) => {
                    if (!focused) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlight((h) => Math.min(h + 1, filteredTurmas.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlight((h) => Math.max(h - 1, 0));
                    } else if (e.key === 'Enter') {
                      const opt = filteredTurmas[highlight];
                      if (opt) {
                        e.preventDefault();
                        toggleTurma(opt.value);
                        setFocused(false);
                      }
                    } else if (e.key === 'Escape') {
                      setFocused(false);
                    }
                  }}
                  placeholder="Ex.: Ballet, Jazz..."
                  className="flex-1 min-w-[160px] bg-transparent px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              {focused && filteredTurmas.length > 0 && (
                <div className="absolute z-40 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredTurmas.map((t, idx) => {
                    const active = state.turmaIds.includes(t.value);
                    const highlighted = idx === highlight;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        data-selected={active || undefined}
                        data-state={highlighted ? 'active' : undefined}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggleTurma(t.value);
                          setFocused(false);
                        }}
                        className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 data-[selected]:!bg-[#4f2298] data-[selected]:!text-white data-[state=active]:!bg-[#6b35cc] data-[state=active]:!text-white"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium data-[selected]:text-white">{t.label}</span>
                          <span className="text-xs text-gray-500 data-[selected]:text-white/80">
                            {t.horaInicio ?? '--'} - {t.horaFim ?? '--'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {turmas.length === 0 && !loading && (
              <p className="text-sm text-gray-500">Nenhuma turma disponível no momento.</p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div data-step-turmas-can-continue={canContinue} />
      </div>
    </SectionCard>
  );
}
