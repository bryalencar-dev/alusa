'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Search, Edit3, Trash2, ChevronUp, ChevronDown } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TableLayout from '@/components/layout/TableLayout';
import Pagination from '@/components/layout/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

interface Modalidade {
  id: string;
  nome: string;
  descricao?: string | null;
  status: 'ATIVO' | 'INATIVO' | string;
  createdAt: string;
}

const ModalidadeWizardDialog = dynamic(
  () => import('@/components/modalidades/ModalidadeWizardDialog'),
  { ssr: false },
);

export default function ModalidadesPage() {
  const [data, setData] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: session } = useSession();
  const contaId = (session?.user as { contaId?: string } | undefined)?.contaId; // pode ser undefined até sessão carregar

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (contaId) params.set('contaId', contaId); // se não tiver ainda, backend fará fallback
      const res = await fetch(`/api/modalidades?${params.toString()}`);
      const json = await res.json();
      setData(json.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [q, contaId]);

  // Carrega inicialmente e quando contaId ficar disponível
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener('modalidades:changed', h);
    return () => window.removeEventListener('modalidades:changed', h);
  }, [load]);

  const ordered = useMemo(() => {
    return [...data]
      .filter((m) => (statusFilter === 'TODOS' ? true : m.status === statusFilter))
      .sort((a, b) => {
        const comp = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        return sortOrder === 'ASC' ? comp : -comp;
      });
  }, [data, statusFilter, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [q, sortOrder]);

  const paginated = ordered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <TableLayout
      title="Modalidades"
      subtitle="Gerencie as modalidades disponíveis."
      actions={<>
        <Button
          onClick={() => setOpen(true)}
          className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
        >
          <Plus className="h-4 w-4 mr-2 transition-none" /> Nova modalidade
        </Button>
        <Button
          variant="outline"
          onClick={() => setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))}
          className="h-10 px-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-none flex items-center gap-2"
          aria-label="Alternar ordenação"
          title={sortOrder === 'ASC' ? 'Ordenar Z–A' : 'Ordenar A–Z'}
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
                <Skeleton className="col-span-4 h-4" />
                <Skeleton className="col-span-5 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-1 h-4" />
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-4 h-4 w-full" />
                  <Skeleton className="col-span-5 h-4 w-full" />
                  <Skeleton className="col-span-2 h-6 w-16 rounded-full" />
                  <Skeleton className="col-span-1 h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Modalidade</div>
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>
            <div className="divide-y">
              {paginated.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  Nenhuma modalidade encontrada
                </div>
              ) : (
                paginated.map((m) => (
                  <div key={m.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 text-[13px] text-gray-900 font-normal truncate">
                        {m.nome}
                      </div>
                      <div className="col-span-5 text-[13px] text-gray-700 leading-[20px]">
                        <span className="line-clamp-2 block max-w-full whitespace-pre-wrap">
                          {m.descricao?.trim() || '-'}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {m.status === 'ATIVO' ? (
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
                          aria-label="Editar modalidade"
                          onClick={() => setOpen(true)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Inativar modalidade"
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

      <ModalidadeWizardDialog
        open={open}
        onOpenChange={setOpen}
        contaId={contaId || 'conta-default'}
        onSaved={() => {
          load();
        }}
      />
    </TableLayout>
  );
}
