"use client";
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit3, Trash2, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@/components/icons/icons';
import ProfessorEditDialog, { type ProfessorEdit } from '@/components/professores/ProfessorEditDialog';
import ProfessorDeleteDialog from '@/components/professores/ProfessorDeleteDialog';
import ProfessorWizardDialog from '@/components/professores/ProfessorWizardDialog';

type Professor = {
  id: string;
  nome: string;
  email: string | null;
  telefoneCel?: string | null;
  status: 'ATIVO' | 'INATIVO' | string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfessoresList() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Professor[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [editOpen, setEditOpen] = useState(false);
  const [editProf, setEditProf] = useState<ProfessorEdit | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteNome, setDeleteNome] = useState<string | undefined>(undefined);
  const [wizardOpen, setWizardOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ contaId: 'conta-default', page: '1', pageSize: '9999' });
      const res = await fetch(`/api/professores?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      // API atual retorna { data: Professor[] }, manter fallback p/ { items }
      const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : []);
      setItems(arr);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter(p => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nome = (p.nome || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      if (!nome.includes(term) && !email.includes(term)) return false;
    }
    if (statusFilter !== 'TODOS' && p.status !== statusFilter) return false;
    return true;
  });
  const ordered = [...filtered].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-gray-900">Gestão de Professores</h1>
        <p className="text-[13px] text-gray-500">Gerencie cadastros e informações dos professores.</p>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => { setWizardOpen(true); }} className="bg-brand-accent hover:bg-brand-accent/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Professor
            </Button>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <div>
              <Button variant="outline" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtro
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos os status" /></SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="TODOS">Todos os status</SelectItem>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 md:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-4 h-4" />
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-1 h-4" />
                <Skeleton className="col-span-1 h-4" />
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-4 h-4 w-48" />
                  <Skeleton className="col-span-3 h-4 w-56" />
                  <Skeleton className="col-span-3 h-4 w-32" />
                  <Skeleton className="col-span-1 h-6 w-12 rounded-full" />
                  <Skeleton className="col-span-1 h-8 w-8 rounded-md justify-self-end" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Nome</div>
                <div className="col-span-3 text-center">E-mail</div>
                <div className="col-span-3 text-center">Telefone</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>
            <div className="divide-y">
              {ordered.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">Nenhum professor encontrado</div>
              ) : (
                ordered.slice(0, pageSize).map((p) => (
                  <div key={p.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 text-[13px] text-gray-900">{p.nome}</div>
                      <div className="col-span-3 text-[13px] text-gray-700 text-center truncate" title={p.email || ''}>{p.email || '-'}</div>
                      <div className="col-span-3 text-[13px] text-gray-700 text-center">{p.telefoneCel || '-'}</div>
                      <div className="col-span-1 flex justify-center">
                        {p.status === 'ATIVO' ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Inativo</Badge>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50" aria-label="Editar professor" onClick={() => {
                          const status: 'ATIVO' | 'INATIVO' = p.status === 'INATIVO' ? 'INATIVO' : 'ATIVO';
                          setEditProf({ id: p.id, nome: p.nome, email: p.email ?? undefined, telefone: p.telefoneCel ?? undefined, status });
                          setEditOpen(true);
                        }}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" aria-label="Excluir professor" onClick={() => { setDeleteId(p.id); setDeleteNome(p.nome); setDeleteOpen(true); }}>
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

      {ordered.length > 0 && (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-sm">
            <button aria-label="Primeira página" className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent hover:bg-brand-accent hover:text-white hover:border-brand-accent" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></button>
            <button aria-label="Página anterior" className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent hover:bg-brand-accent hover:text-white hover:border-brand-accent" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-2 text-brand-accent/70">Página {page}</span>
            <button aria-label="Próxima página" className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent hover:bg-brand-accent hover:text-white hover:border-brand-accent" onClick={() => setPage(p => p + 1)} disabled={ordered.length <= page * pageSize}><ChevronRight className="h-4 w-4" /></button>
            <button aria-label="Última página" className="h-8 w-8 rounded-md border grid place-items-center border-brand-accent/30 bg-white text-brand-accent hover:bg-brand-accent hover:text-white hover:border-brand-accent" onClick={() => setPage(Math.ceil(ordered.length / pageSize))} disabled={ordered.length <= page * pageSize}><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <ProfessorEditDialog open={editOpen} onOpenChange={setEditOpen} mode={editProf?.id ? 'edit' : 'create'} professor={editProf} onSaved={() => load()} />
      <ProfessorDeleteDialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteId(null); setDeleteNome(undefined); } setDeleteOpen(o); }} professorId={deleteId} professorNome={deleteNome} onDeleted={() => load()} />
      <ProfessorWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} contaId="conta-default" onSaved={() => load()} />
    </div>
  );
}
