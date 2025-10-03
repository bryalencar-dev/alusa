"use client";
import { useEffect, useState } from 'react';

interface ChargeRow {
  id: string;
  tipo: string;
  status: string;
  valor: number;
  vencimento: string;
  aluno: { id: string; nome: string };
  matriculaId: string;
  asaasPaymentId?: string | null;
}

interface ApiResponse {
  data: ChargeRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ChargesTable() {
  const [rows, setRows] = useState<ChargeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (debounced) params.set('q', debounced);
        const res = await fetch(`/api/financeiro/cobrancas?${params.toString()}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const json: ApiResponse = await res.json();
        if (cancelled) return;
        setRows(json.data);
        setTotal(json.total);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, debounced]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          placeholder="Buscar aluno ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-72"
        />
        <div className="text-xs text-gray-500">{total} registros</div>
      </div>
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Aluno</th>
              <th className="px-3 py-2 text-left font-medium">Tipo</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Valor</th>
              <th className="px-3 py-2 text-left font-medium">Vencimento</th>
              <th className="px-3 py-2 text-left font-medium">Pagamento Asaas</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Nenhuma cobrança encontrada.
                </td>
              </tr>
            )}
            {!loading && !error &&
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{r.aluno.nome}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.tipo}</td>
                  <td className="px-3 py-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.vencimento).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {r.asaasPaymentId ? (
                      <span className="text-green-600">{r.asaasPaymentId.slice(0, 10)}…</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="px-3 py-1 rounded border disabled:opacity-40"
        >
          Anterior
        </button>
        <span>
          Página {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
          className="px-3 py-1 rounded border disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}