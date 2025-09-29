'use client';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { SectionCard, StepHeader } from '../../alunos/wizard/ui';
import { useLookups } from './lookups-context';

interface WizardValues {
  professoresIds?: string[];
}
export default function StepProfessores() {
  const { setValue, watch } = useFormContext<WizardValues>();
  const selecionados = watch('professoresIds') || [];
  const { professores, loading, reloadProfessores } = useLookups();
  const isLoading = loading.professores;
  useEffect(() => {
    reloadProfessores().catch(() => undefined);
  }, [reloadProfessores]);
  return (
    <SectionCard>
      <StepHeader title="Professores" />
      <div className="space-y-3">
        {isLoading && <div className="text-[11px] text-slate-500">Carregando professores...</div>}
        {!isLoading && (
          <div className="flex flex-wrap gap-2">
            {professores.map((p) => {
              const ativo = selecionados.includes(p.id);
              const disponivel = (p.status || 'ATIVO') === 'ATIVO';
              const parts = (p.nome || '').trim().split(/\s+/).filter(Boolean);
              const displayName =
                parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0] || '';
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => {
                    if (!disponivel) return;
                    const cur = Array.isArray(selecionados) ? selecionados : [];
                    setValue(
                      'professoresIds',
                      ativo ? cur.filter((x) => x !== p.id) : [...cur, p.id],
                    );
                  }}
                  disabled={!disponivel}
                  className={`group inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:ring-offset-1 ${
                    ativo
                      ? 'bg-violet-600 text-white border-violet-700 shadow-sm'
                      : 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-200 hover:border-violet-400'
                  } ${!disponivel ? 'cursor-not-allowed opacity-50 hover:bg-violet-100 hover:border-violet-300' : ''}`}
                >
                  <span className="whitespace-normal leading-tight">{displayName}</span>
                  {!disponivel && (
                    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700 border border-amber-300">
                      Inativo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {!isLoading && professores.length === 0 && (
          <p className="text-xs text-slate-500">
            Nenhum professor encontrado para esta conta. Cadastre um colaborador com cargo
            &quot;PROFESSOR&quot;, salve e em seguida clique em &quot;Atualizar lista&quot; ou
            retorne a esta etapa para ver os nomes disponíveis.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
