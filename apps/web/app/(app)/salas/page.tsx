'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Search, Edit3, Trash2, ChevronDown, ChevronUp } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TableLayout from '@/components/layout/TableLayout';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Sala {
  id: string;
  nome: string;
  descricao?: string | null;
  capacidade: number;
  status: 'ATIVO' | 'INATIVO' | string;
  createdAt: string;
}

const SalaWizardDrawer = dynamic(() => import('@/components/salas/SalaWizardDrawer'), {
  ssr: false,
});

export default function SalasPage() {
  const [data, setData] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [open, setOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const contaId = (session?.user as { contaId?: string } | undefined)?.contaId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (contaId) params.set('contaId', contaId);
      const res = await fetch(`/api/salas?${params.toString()}`);
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [q, contaId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener('salas:changed', h);
    return () => window.removeEventListener('salas:changed', h);
  }, [load]);

  const ordered = useMemo(() => {
    return [...data]
      .filter((s) => (statusFilter === 'TODOS' ? true : s.status === statusFilter))
      .sort((a, b) => {
        const comp = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        return sortOrder === 'ASC' ? comp : -comp;
      });
  }, [data, statusFilter, sortOrder]);

  // Reset page on filters
  useEffect(() => { setPage(1); }, [q, statusFilter, sortOrder]);
  const paginated = useMemo(() => ordered.slice((page - 1) * pageSize, page * pageSize), [ordered, page, pageSize]);

  return (
    <TableLayout
      title="Salas"
      subtitle="Gerencie as salas físicas de aula."
      actions={<>
        <Button
          onClick={() => setOpen(true)}
          className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
        >
          <Plus className="h-4 w-4 mr-2 transition-none" /> Nova sala
        </Button>
        <Button
          variant="outline"
          onClick={() => setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))}
          className="h-10 px-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-none flex items-center gap-2"
          aria-label="Alternar ordenação"
        >
          {sortOrder === 'ASC' ? (<><ChevronDown className="h-4 w-4" /> A–Z</>) : (<><ChevronUp className="h-4 w-4" /> Z–A</>)}
        </Button>
        <Select value={statusFilter} onValueChange={(v: 'TODOS' | 'ATIVO' | 'INATIVO') => setStatusFilter(v)}>
          <SelectTrigger className="h-10 w-[150px] bg-white border-gray-300 text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent align="start" className="text-[13px]">
            <SelectItem value="TODOS">Todos status</SelectItem>
            <SelectItem value="ATIVO">Ativas</SelectItem>
            <SelectItem value="INATIVO">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </>}
      filtersBar={<div className="relative w-full md:w-[380px] lg:w-[420px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-none" />
        <Input
          placeholder="Buscar por nome..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
          className="h-10 pl-10 border border-gray-300 shadow-none placeholder:text-gray-400"
        />
      </div>}
      footer={<Pagination total={ordered.length} page={page} pageSize={pageSize} onChange={setPage} />}
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-5 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-1 h-4" />
                <Skeleton className="col-span-1 h-4" />
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-3 h-4" />
                  <Skeleton className="col-span-5 h-4" />
                  <Skeleton className="col-span-2 h-4" />
                  <Skeleton className="col-span-1 h-6 w-16" />
                  <Skeleton className="col-span-1 h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Sala</div>
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-center">Capacidade</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>
            <div className="divide-y">
              {paginated.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">Nenhuma sala encontrada</div>
              ) : (
                paginated.map((s) => (
                  <div key={s.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3 text-[13px] text-gray-900 font-normal truncate">
                        {s.nome}
                      </div>
                      <div className="col-span-5 text-[13px] text-gray-700 leading-[20px]">
                        <span className="line-clamp-2 block max-w-full whitespace-pre-wrap">
                          {s.descricao?.trim() || '-'}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center text-[13px] text-gray-800">
                        <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                          {s.capacidade}
                        </Badge>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {s.status === 'ATIVO' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Inativa</Badge>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          aria-label="Editar sala"
                          onClick={() => setOpen(true)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Inativar sala"
                          onClick={() => {
                            /* TODO: implementar diálogo de inativação */
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <SalaWizardDrawer
        open={open}
        onOpenChange={setOpen}
        contaId={contaId || 'conta-default'}
        onSaved={() => load()}
      />
    </TableLayout>
  );
}

interface PaginationProps { total: number; pageSize: number; page: number; onChange: (_p: number) => void; }
function Pagination({ total, pageSize, page, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) setTimeout(() => onChange(totalPages), 0);
  if (total === 0) return null;
  const pages: (number | '…')[] = [];
  const siblings = 1;
  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);
  pages.push(1);
  if (left > 2) pages.push('…');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push('…');
  if (totalPages > 1) pages.push(totalPages);
  return (
    <div className="flex justify-center pt-4">
      <div className="flex items-center gap-2 text-sm">
        <button aria-label="Primeira" disabled={page === 1} onClick={() => onChange(1)} className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white">«</button>
        <button aria-label="Anterior" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))} className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white">‹</button>
        {pages.map((p, i) => p === '…' ? <span key={i} className="px-2 text-brand-accent/40">…</span> : <button key={p} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)} className={'h-8 w-8 rounded-md border grid place-items-center transition text-[13px] ' + (p === page ? 'bg-brand-accent text-white border-brand-accent' : 'border-brand-accent/30 text-brand-accent bg-white hover:bg-brand-accent hover:text-white')}>{p}</button>)}
        <button aria-label="Próxima" disabled={page === totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))} className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white">›</button>
        <button aria-label="Última" disabled={page === totalPages} onClick={() => onChange(totalPages)} className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white">»</button>
      </div>
    </div>
  );
}
