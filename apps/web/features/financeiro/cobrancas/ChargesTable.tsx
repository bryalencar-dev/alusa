'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface ChargeRow {
  id: string;
  tipo: string;
  status: string;
  valor: number;
  vencimento: string;
  aluno: { id: string; nome: string };
  matriculaId: string;
  asaasPaymentId?: string | null;
  atrasado?: boolean;
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
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [tipoFilters, setTipoFilters] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inicializa filtros da URL
  useEffect(() => {
    const s = searchParams?.getAll('status') || [];
    const t = searchParams?.getAll('tipo') || [];
    const q = searchParams?.get('q') || '';
    if (s.length) setStatusFilters(s);
    if (t.length) setTipoFilters(t);
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        statusFilters.forEach((s) => params.append('status', s));
        tipoFilters.forEach((t) => params.append('tipo', t));
        // Sync URL (shallow)
        const url = `/financeiro/cobrancas?${params.toString()}`;
        router.replace(url);
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
  }, [page, pageSize, debounced, statusFilters, tipoFilters, router]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggle(list: string[], value: string, setter: (_v: string[]) => void) {
    if (list.includes(value)) setter(list.filter((x) => x !== value));
    else setter([...list, value]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          placeholder="Buscar aluno ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-72"
        />
        <div className="flex gap-2 items-center text-xs">
          <span className="text-gray-500">Status:</span>
          {['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'].map((s) => (
            <button
              key={s}
              onClick={() => toggle(statusFilters, s, setStatusFilters)}
              className={
                'px-2 py-1 rounded border text-xs ' +
                (statusFilters.includes(s)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50')
              }
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center text-xs">
          <span className="text-gray-500">Tipo:</span>
          {['MENSALIDADE', 'TAXA_MATRICULA', 'EXTRA', 'AVULSA'].map((t) => (
            <button
              key={t}
              onClick={() => toggle(tipoFilters, t, setTipoFilters)}
              className={
                'px-2 py-1 rounded border text-xs ' +
                (tipoFilters.includes(t)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white hover:bg-gray-50')
              }
            >
              {t}
            </button>
          ))}
        </div>
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
              <th className="px-3 py-2 text-left font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Nenhuma cobrança encontrada.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
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
                    <span className={r.atrasado ? 'text-red-600 font-medium' : ''}>
                      {new Date(r.vencimento).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {r.asaasPaymentId ? (
                      <span className="text-green-600">{r.asaasPaymentId.slice(0, 10)}…</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <div className="flex gap-2">
                      <a
                        href={`/matriculas/${r.matriculaId}`}
                        className="underline text-blue-600 hover:text-blue-800"
                      >
                        Ver Matrícula
                      </a>
                      {r.asaasPaymentId && (
                        <a
                          href={`https://www.asaas.com/pay/${r.asaasPaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-indigo-600 hover:text-indigo-800"
                        >
                          Segunda Via
                        </a>
                      )}
                    </div>
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
