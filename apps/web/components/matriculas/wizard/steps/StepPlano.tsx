import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { WizardContextValue } from '../types';

interface PlanoOption { id: string; nome: string; valor?: number }

interface StepPlanoProps { ctx: WizardContextValue; contaId?: string }

export function StepPlano({ ctx, contaId }: StepPlanoProps) {
  const { state, update, goNext, goBack } = ctx;
  const [planos, setPlanos] = useState<PlanoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (!contaId) return;
    setLoading(true);
    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch(`/api/planos?contaId=${contaId}`, { signal: controller.signal });
        const j = await r.json();
        const data: any[] = j?.data ?? [];
        setPlanos(data.map(p => ({ id: p.id, nome: p.nome ?? 'Plano', valor: p.valor != null ? Number(p.valor) : undefined })));
      } catch(e) {
        if ((e as any).name !== 'AbortError') setError('Falha ao carregar planos');
      } finally { setLoading(false); }
    })();
    return () => controller.abort();
  }, [contaId]);

  const planoSelecionado = planos.find(p => p.id === state.planoId);

  const canContinue = !!planoSelecionado;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-600">Plano</label>
        <Select
          value={state.planoId ?? ''}
          disabled={loading}
          onValueChange={(val) => {
            const found = planos.find(p => p.id === val);
            update({ planoId: val, planoLabel: found?.nome, planoValor: found?.valor });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? 'Carregando...' : 'Selecione'} />
          </SelectTrigger>
          <SelectContent>
            {planos.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}{p.valor != null && ` - R$ ${p.valor}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={goBack}>Voltar</Button>
        <Button type="button" disabled={!canContinue} onClick={goNext}>Próximo</Button>
      </div>
    </div>
  );
}
