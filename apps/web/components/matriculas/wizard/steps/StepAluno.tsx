import { useEffect, useMemo, useState } from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { WizardContextValue, WizardAluno } from '../types';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface StepAlunoProps {
  ctx: WizardContextValue;
  contaId?: string;
}

export function StepAluno({ ctx, contaId }: StepAlunoProps) {
  const { state, update, goNext } = ctx;
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contaId) return;
    setLoading(true);
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/alunos?contaId=${contaId}`, { signal: controller.signal });
        const json = await res.json();
        const items: unknown[] = json?.items ?? [];
        setOptions(
          items.map((raw) => {
            const a = raw as Record<string, unknown>;
            return {
              value: String(a.id ?? ''),
              label: String(a.nome ?? 'Sem nome'),
              description: typeof a.cpf === 'string' ? a.cpf : undefined,
            };
          }),
        );
      } catch (e) {
        const name = (e as { name?: string } | null)?.name;
        if (name !== 'AbortError') setError('Falha ao carregar alunos');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [contaId]);

  const selectValue = state.aluno?.id ?? '';

  const menorIdade = useMemo(() => {
    if (!state.aluno?.dataNasc) return false;
    const nasc = new Date(state.aluno.dataNasc);
    const hoje = new Date();
    const idade =
      hoje.getFullYear() -
      nasc.getFullYear() -
      (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0);
    return idade < 18;
  }, [state.aluno]);

  const canContinue =
    !!state.aluno && (!menorIdade || !!state.aluno.responsavel) && state.aluno.ativo !== false;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600">Aluno</label>
        <Select
          value={selectValue}
          onValueChange={(id) => {
            const found = options.find((o) => o.value === id);
            if (found) {
              // Para já: faremos uma requisição detalhada para pegar responsável
              (async () => {
                try {
                  const r = await fetch(`/api/alunos/${id}`);
                  const det = await r.json();
                  const aluno: WizardAluno = {
                    id,
                    nome: det?.nome ?? found.label,
                    dataNasc: det?.dataNasc ?? det?.dataNascRaw,
                    responsavel: det?.responsavel
                      ? { id: det.responsavel.id, nome: det.responsavel.nome }
                      : null,
                    ativo: det?.status ? det.status === 'ATIVO' : true,
                  };
                  update({ aluno });
                } catch {
                  update({ aluno: { id, nome: found.label } });
                }
              })();
            }
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      </div>

      {state.aluno && (
        <div className="rounded-md border p-3 bg-gray-50 text-xs space-y-1">
          <p>
            <span className="font-medium">Nome:</span> {state.aluno.nome}
          </p>
          {state.aluno.dataNasc && (
            <p>
              <span className="font-medium">Nascimento:</span>{' '}
              {new Date(state.aluno.dataNasc).toLocaleDateString()}
            </p>
          )}
          {state.aluno.responsavel && (
            <p>
              <span className="font-medium">Responsável:</span> {state.aluno.responsavel.nome}
            </p>
          )}
          {state.aluno.ativo === false && <p className="text-red-600 font-medium">Aluno inativo</p>}
          {!state.aluno.responsavel && menorIdade && (
            <p className="text-red-600 font-medium">Necessário responsável (menor de idade)</p>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="button" disabled={!canContinue} onClick={goNext}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
