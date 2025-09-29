import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listPlanos,
  deletePlanoRequest,
  type PlanoListItem,
  type PlanoStatus,
} from '../services/planos-service';

export interface UsePlanosOptions {
  contaId: string | null | undefined;
}

export interface UsePlanosFilters {
  search?: string;
  status?: PlanoStatus | 'TODOS';
}

export function usePlanos({ contaId }: UsePlanosOptions) {
  const [items, setItems] = useState<PlanoListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (filters?: UsePlanosFilters) => {
      if (!contaId) {
        setItems([]);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const data = await listPlanos({
          contaId,
          search: filters?.search,
          status: filters?.status,
          signal: controller.signal,
        });
        setItems(data);
      } catch (err) {
        if ((err as { name?: string }).name !== 'AbortError') {
          setError((err as Error).message);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [contaId],
  );

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const remove = useCallback(
    async ({ id, contaId: contaIdOverride }: { id: string; contaId: string }) => {
      const targetContaId = contaIdOverride ?? (typeof contaId === 'string' ? contaId : undefined);
      if (!targetContaId) throw new Error('Conta não informada para exclusão.');
      const updated = await deletePlanoRequest({ id, contaId: targetContaId });
      setItems((prev) => prev.filter((plano) => plano.id !== updated.id));
      return updated;
    },
    [contaId],
  );

  return {
    items,
    loading,
    error,
    reload: load,
    remove,
    setItems,
  };
}

export type UsePlanosReturn = ReturnType<typeof usePlanos>;
