import { useEffect, useMemo, useState } from 'react';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import type { WizardContextValue } from '../types';

interface PlanoOption {
  id: string;
  nome: string;
  valor?: number;
}

interface StepPlanoProps {
  ctx: WizardContextValue;
  contaId?: string;
}

export function StepPlano({ ctx, contaId }: StepPlanoProps) {
  const { state, update } = ctx;
  const [planos, setPlanos] = useState<PlanoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contaId) return;
    setLoading(true);
    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch(`/api/planos?contaId=${contaId}`, { signal: controller.signal });
        const j = await r.json();
        const data: unknown[] = j?.data ?? [];
        setPlanos(
          data.map((raw) => {
            const p = raw as Record<string, unknown>;
            return {
              id: String(p.id ?? ''),
              nome: String(p.nome ?? 'Plano'),
              valor: typeof p.valor === 'number' ? p.valor : undefined,
            } as PlanoOption;
          }),
        );
      } catch (e) {
        const name = (e as { name?: string } | null)?.name;
        if (name !== 'AbortError') setError('Falha ao carregar planos');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [contaId]);

  const formatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    [],
  );
  const planoSelecionado = planos.find((p) => p.id === state.planoId);
  const canContinue = !!planoSelecionado;

  return (
    <SectionCard>
      <StepHeader
        title="Plano"
        hint="Selecione o plano que melhor se encaixa na rotina do aluno."
      />
      <div className="space-y-6">
        {loading && <p className="text-sm text-gray-500">Carregando planos...</p>}
        {!loading && planos.length === 0 && (
          <p className="text-sm text-gray-500">Nenhum plano cadastrado para esta conta.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {planos.map((p) => {
            const active = state.planoId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => update({ planoId: p.id, planoLabel: p.nome, planoValor: p.valor })}
                className={`flex h-full flex-col justify-between rounded-xl border p-4 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 ${
                  active
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'
                }`}
              >
                <div className="space-y-2">
                  <p className="text-base font-semibold text-gray-900">{p.nome}</p>
                  {p.valor != null && (
                    <p className="text-xl font-semibold text-violet-700">
                      {formatter.format(p.valor)}
                      <span className="ml-1 text-sm font-medium text-gray-500">/ mês</span>
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Ideal para alunos que precisam de acompanhamento contínuo.
                </p>
                {active && (
                  <span className="mt-4 inline-flex w-max items-center gap-2 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
                    Selecionado
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div data-step-plano-can-continue={canContinue} />
      </div>
    </SectionCard>
  );
}
