import { useEffect, useMemo, useState } from 'react';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { WizardContextValue } from '../types';
import {
  validarFaixaEtaria,
  validarCapacidadeTurma,
  formatarHorario,
  formatarDiasSemana,
} from '@/lib/validations/turma-plano.schema';

interface Option {
  value: string;
  label: string;
  descricao?: string;
  capacidade?: number;
  idadeMin?: number;
  idadeMax?: number;
  horaInicio?: string;
  horaFim?: string;
  diasSemana?: string[];
  vagasOcupadas?: number;
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
      update({
        turmaIds: [id],
        comboId: undefined,
        modoTurmas: 'TURMAS',
        turmaLabel: turma?.label,
      });
      setQuery('');
    }
  };

  // Validar turma selecionada
  const turmaValidacao = useMemo(() => {
    if (!state.turmaIds[0] || !state.aluno?.dataNasc) return null;

    const turma = turmas.find((t) => t.value === state.turmaIds[0]);
    if (!turma) return null;

    // Validar faixa etária
    const faixaEtaria = validarFaixaEtaria(state.aluno.dataNasc, turma.idadeMin, turma.idadeMax);

    // Validar capacidade
    let capacidade = null;
    if (turma.capacidade !== undefined) {
      capacidade = validarCapacidadeTurma(turma.capacidade, turma.vagasOcupadas ?? 0);
    }

    return {
      faixaEtaria,
      capacidade,
      turma,
    };
  }, [state.turmaIds, state.aluno, turmas]);

  const filteredTurmas = useMemo(() => {
    if (!query.trim()) return turmas.slice(0, 30);
    const q = query.toLowerCase();
    return turmas.filter((t) => t.label.toLowerCase().includes(q)).slice(0, 30);
  }, [turmas, query]);

  const canContinue = useMemo(() => {
    if (modo === 'COMBO') return !!state.comboId;

    // Modo turmas: precisa ter turma selecionada E passar nas validações
    if (state.turmaIds.length !== 1) return false;

    // Se não há validação (aluno sem data nasc), permite
    if (!turmaValidacao) return true;

    // Bloqueia se faixa etária inválida
    if (!turmaValidacao.faixaEtaria.valido) return false;

    // Bloqueia se sem capacidade
    if (turmaValidacao.capacidade && !turmaValidacao.capacidade.valido) return false;

    return true;
  }, [modo, state.comboId, state.turmaIds, turmaValidacao]);

  return (
    <SectionCard>
      <StepHeader
        title="Turma ou Combo"
        hint="Escolha uma turma individual ou matricule através de um combo para acelerar a jornada."
      />
      <div className="space-y-6">
        <div
          className="inline-flex gap-1 rounded-md border border-gray-200 bg-white p-1"
          role="tablist"
          aria-label="Alternar tipo de matrícula"
        >
          <button
            role="tab"
            aria-selected={modo === 'TURMAS'}
            className={`rounded-md px-4 h-9 text-sm transition-colors ${
              modo === 'TURMAS' ? 'bg-violet-600 text-white' : 'hover:bg-violet-50 text-gray-900'
            }`}
            onClick={() => update({ modoTurmas: 'TURMAS', comboId: undefined })}
          >
            Selecionar turma
          </button>
          <button
            role="tab"
            aria-selected={modo === 'COMBO'}
            className={`rounded-md px-4 h-9 text-sm transition-colors ${
              modo === 'COMBO' ? 'bg-violet-600 text-white' : 'hover:bg-violet-50 text-gray-900'
            }`}
            onClick={() => update({ modoTurmas: 'COMBO', turmaIds: [] })}
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
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setFocused(false);
                  }
                }}
              />
              <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              {focused && combos.length > 0 && (
                <div className="absolute z-40 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {combos
                    .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 30)
                    .map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          update({ comboId: c.value, turmaIds: [], comboLabel: c.label });
                          setQuery('');
                          setFocused(false);
                        }}
                        className="w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{c.label}</span>
                          {c.descricao && (
                            <span className="text-xs text-gray-500">{c.descricao}</span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            {state.comboId && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-600 bg-violet-600/10 px-3 py-1 text-xs font-medium text-violet-600">
                  {state.comboLabel}
                  <button
                    type="button"
                    onClick={() => update({ comboId: undefined, comboLabel: undefined })}
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-violet-600 hover:bg-violet-600/20"
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
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Digite o nome da turma abaixo:</p>
            <div className="relative">
              <input
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Ex.: Ballet, Jazz..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setFocused(false);
                  }
                }}
              />
              <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              {focused && filteredTurmas.length > 0 && (
                <div className="absolute z-40 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {filteredTurmas.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleTurma(t.value);
                        setQuery('');
                        setFocused(false);
                      }}
                      className="w-full cursor-pointer px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{t.label}</span>
                        <span className="text-xs text-gray-500">
                          {t.horaInicio ?? '--'} - {t.horaFim ?? '--'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {state.turmaIds.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {state.turmaIds.map((id) => {
                    const t = turmas.find((x) => x.value === id);
                    if (!t) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full border border-violet-600 bg-violet-600/10 px-3 py-1 text-xs font-medium text-violet-600"
                      >
                        {t.label}
                        <button
                          type="button"
                          onClick={() => toggleTurma(id)}
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-violet-600 hover:bg-violet-600/20"
                          aria-label="Remover turma"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Validações */}
                {turmaValidacao && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                          {turmaValidacao.turma.label}
                        </p>

                        {/* Horário e dias */}
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            {formatarHorario(turmaValidacao.turma.horaInicio)} -{' '}
                            {formatarHorario(turmaValidacao.turma.horaFim)}
                          </span>
                          {turmaValidacao.turma.diasSemana &&
                            turmaValidacao.turma.diasSemana.length > 0 && (
                              <span>{formatarDiasSemana(turmaValidacao.turma.diasSemana)}</span>
                            )}
                        </div>

                        {/* Validação faixa etária */}
                        {!turmaValidacao.faixaEtaria.valido && (
                          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            {turmaValidacao.faixaEtaria.mensagem}
                          </div>
                        )}

                        {/* Validação capacidade */}
                        {turmaValidacao.capacidade && !turmaValidacao.capacidade.valido && (
                          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            {turmaValidacao.capacidade.mensagem}
                          </div>
                        )}

                        {/* Aviso de poucas vagas */}
                        {turmaValidacao.capacidade &&
                          turmaValidacao.capacidade.valido &&
                          turmaValidacao.capacidade.mensagem && (
                            <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              {turmaValidacao.capacidade.mensagem}
                            </div>
                          )}

                        {/* Sucesso */}
                        {turmaValidacao.faixaEtaria.valido &&
                          (!turmaValidacao.capacidade || turmaValidacao.capacidade.valido) &&
                          !turmaValidacao.capacidade?.mensagem && (
                            <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Turma compatível com o aluno
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
