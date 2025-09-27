'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronDown, ChevronUp } from '@/components/icons/icons';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import TableLayout from '@/components/layout/TableLayout';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

// Carregamento dinâmico para evitar peso inicial se wizard for grande
const TurmaWizardDialog = dynamic(() => import('@/components/turmas/TurmaWizardDialog'), {
  ssr: false,
});

interface Turma {
  id: string;
  nome: string;
  status: 'ATIVO' | 'INATIVO' | string;
  capacidade: number;
  horaInicio: string;
  horaFim: string;
  diasSemana: string[];
  professoresCount?: number;
  professores?: { id: string; nome: string }[]; // se backend fornecer
}

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [openWizard, setOpenWizard] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const { data: session } = useSession();
  const effectiveContaId =
    (session?.user as { contaId?: string } | undefined)?.contaId || 'conta-default';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('contaId', effectiveContaId);
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      // tentativa de pedir professores se backend suportar
      params.set('include', 'professores');
      const res = await fetch(`/api/turmas?${params.toString()}`);
      const json = await res.json();
      setTurmas(Array.isArray(json.data) ? json.data : []);
    } catch {
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, effectiveContaId]);

  useEffect(() => {
    load();
  }, [load]);

  // Listener para refresh disparado pelo wizard
  useEffect(() => {
    const handler = () => {
      load();
    };
    window.addEventListener('turmas:changed', handler);
    return () => window.removeEventListener('turmas:changed', handler);
  }, [load]);

  // Filtro / ordenação em memória
  const filtered = useMemo(() => {
    return turmas
      .filter((t) => (statusFilter === 'TODOS' ? true : t.status === statusFilter))
      .sort((a, b) => {
        const comp = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
        return sortOrder === 'ASC' ? comp : -comp;
      });
  }, [turmas, statusFilter, sortOrder]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [statusFilter, sortOrder, searchTerm]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return (
    <TableLayout
      title="Turmas"
      subtitle="Gerencie turmas, horários e capacidades."
      actions={
        <>
          <Button
            onClick={() => setOpenWizard(true)}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova turma
          </Button>
          <Button
            variant="outline"
            onClick={() => setSortOrder((o) => (o === 'ASC' ? 'DESC' : 'ASC'))}
            className="h-10 px-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-none flex items-center gap-2"
            aria-label="Alternar ordenação"
            title={sortOrder === 'ASC' ? 'Ordenar Z–A' : 'Ordenar A–Z'}
          >
            {sortOrder === 'ASC' ? (
              <>
                <ChevronDown className="h-4 w-4" /> A–Z
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" /> Z–A
              </>
            )}
          </Button>
          <Select
            value={statusFilter}
            onValueChange={(v: 'TODOS' | 'ATIVO' | 'INATIVO') => setStatusFilter(v)}
          >
            <SelectTrigger className="h-10 w-[150px] bg-white border-gray-300 text-[13px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent align="start" className="text-[13px]">
              <SelectItem value="TODOS">Todos status</SelectItem>
              <SelectItem value="ATIVO">Ativas</SelectItem>
              <SelectItem value="INATIVO">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </>
      }
      filtersBar={
        <div className="relative w-full md:w-[380px] lg:w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') load();
            }}
            className="h-10 pl-10 border border-gray-300 shadow-none"
          />
        </div>
      }
      footer={<Pagination total={filtered.length} pageSize={pageSize} page={page} onChange={setPage} />}
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Turma</div>
          <div className="col-span-3 text-center">Dias</div>
          <div className="col-span-2 text-center">Horário</div>
          <div className="col-span-2 text-center">Professores</div>
          <div className="col-span-1 text-center">Capacidade</div>
          <div className="col-span-1 text-center">Status</div>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Carregando...</div>
          ) : paginated.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">Nenhuma turma encontrada</div>
          ) : (
            paginated.map((t) => {
              const professores = t.professores && t.professores.length > 0 ? t.professores : [];
              return (
                <div key={t.id} className="px-6 py-3 bg-white hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center text-[13px] text-gray-800">
                    <div className="col-span-3 font-medium truncate">{t.nome}</div>
                    <div className="col-span-3 flex flex-wrap gap-1 justify-center">
                      {t.diasSemana.map((d) => (
                        <Badge
                          key={d}
                          className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        >
                          {d}
                        </Badge>
                      ))}
                    </div>
                    <div className="col-span-2 text-center text-gray-600">
                      {t.horaInicio} - {t.horaFim}
                    </div>
                    <div className="col-span-2 flex flex-wrap gap-1 justify-center">
                      {professores.length > 0 ? (
                        <>
                          {professores.slice(0, 3).map((p) => (
                            <Badge
                              key={p.id}
                              className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            >
                              {p.nome.split(' ').slice(0, 2).join(' ')}
                            </Badge>
                          ))}
                          {professores.length > 3 && (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="cursor-help bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                                    +{professores.length - 3}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs p-2 text-[11px]">
                                  <p className="font-medium mb-1 text-violet-700">Professores</p>
                                  <ul className="space-y-0.5 list-disc list-inside text-gray-700">
                                    {professores.map((p) => (
                                      <li key={p.id}>{p.nome}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </>
                      ) : (
                        <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                          {(t.professoresCount ?? 0) + ' prof.'}
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        {t.capacidade}
                      </Badge>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {t.status === 'ATIVO' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200">Inativa</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <TurmaWizardDialog
        open={openWizard}
        onOpenChange={setOpenWizard}
        contaId={effectiveContaId}
        onSaved={() => {
          /* reload handled by event */
        }}
      />
    </TableLayout>
  );
}

interface PaginationProps {
  total: number;
  pageSize: number;
  page: number;
  onChange: (_p: number) => void;
}

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
        <button
          aria-label="Primeira"
          disabled={page === 1}
          onClick={() => onChange(1)}
          className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white"
        >
          «
        </button>
        <button
          aria-label="Anterior"
            disabled={page === 1}
          onClick={() => onChange(Math.max(1, page - 1))}
          className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white"
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={i} className="px-2 text-brand-accent/40">
              …
            </span>
          ) : (
            <button
              key={p}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
              className={
                'h-8 w-8 rounded-md border grid place-items-center transition text-[13px] ' +
                (p === page
                  ? 'bg-brand-accent text-white border-brand-accent'
                  : 'border-brand-accent/30 text-brand-accent bg-white hover:bg-brand-accent hover:text-white')
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          aria-label="Próxima"
          disabled={page === totalPages}
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white"
        >
          ›
        </button>
        <button
          aria-label="Última"
          disabled={page === totalPages}
          onClick={() => onChange(totalPages)}
          className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent disabled:opacity-40 hover:bg-brand-accent hover:text-white"
        >
          »
        </button>
      </div>
    </div>
  );
}
