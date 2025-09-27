'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit3, Trash2 } from '@/components/icons/icons';
import EntityFiltersBar, {
  type StatusValue,
  type SortOrder,
} from '@/components/layout/EntityFiltersBar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EditEntityDialog from '@/components/dialogs/EditEntityDialog';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import TableLayout from '@/components/layout/TableLayout';
import Pagination from '@/components/layout/Pagination';
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
  professores?: { id: string; nome: string }[];
  descricao?: string | null;
}

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusValue>('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
  const [openWizard, setOpenWizard] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Turma | null>(null);
  const [deleting, setDeleting] = useState<Turma | null>(null);
  const pageSize = 10;
  const { data: session } = useSession();
  const effectiveContaId =
    (session?.user as { contaId?: string } | undefined)?.contaId || 'conta-default';

  const load = useCallback(async () => {
    if (!effectiveContaId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('contaId', effectiveContaId);
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
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

  useEffect(() => { load(); }, [load]);

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
        </>
      }
      filtersBar={
        <EntityFiltersBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchEnter={load}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          searchPlaceholder="Buscar por nome..."
        />
      }
      footer={
        <Pagination total={filtered.length} pageSize={pageSize} page={page} onChange={setPage} />
      }
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-1 h-4" />
                <Skeleton className="col-span-1 h-4" />
              </div>
            </div>
            {[...Array(5)].map((_,i)=>(
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-3 h-4" />
                  <Skeleton className="col-span-3 h-4" />
                  <Skeleton className="col-span-2 h-4" />
                  <Skeleton className="col-span-2 h-4" />
                  <Skeleton className="col-span-1 h-6 w-12 rounded-full" />
                  <Skeleton className="col-span-1 h-8 w-8" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Turma</div>
                <div className="col-span-3 text-center">Dias</div>
                <div className="col-span-2 text-center">Horário</div>
                <div className="col-span-2 text-center">Professores</div>
                <div className="col-span-1 text-center">Capacidade</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>
            <div className="divide-y">
              {paginated.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">Nenhuma turma encontrada</div>
              ) : (
                paginated.map(t => {
                  const professores = t.professores && t.professores.length > 0 ? t.professores : [];
                  return (
                    <div key={t.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 text-[13px] text-gray-900 font-medium truncate">{t.nome}</div>
                        <div className="col-span-3 flex flex-wrap gap-1 justify-center">
                          {t.diasSemana.map(d => (
                            <Badge key={d} className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">{d}</Badge>
                          ))}
                        </div>
                        <div className="col-span-2 text-center text-[13px] text-gray-600">{t.horaInicio} - {t.horaFim}</div>
                        <div className="col-span-2 flex flex-wrap gap-1 justify-center">
                          {professores.length > 0 ? (
                            <>
                              {professores.slice(0,3).map(p => (
                                <Badge key={p.id} className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">{p.nome.split(' ').slice(0,2).join(' ')}</Badge>
                              ))}
                              {professores.length > 3 && (
                                <Badge className="bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">+{professores.length - 3}</Badge>
                              )}
                            </>
                          ) : (
                            <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">{(t.professoresCount ?? 0) + ' prof.'}</Badge>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">{t.capacidade}</Badge>
                        </div>
                        <div className="col-span-1 flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50" aria-label="Editar turma" onClick={() => setEditing(t)}><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" aria-label="Excluir turma" onClick={() => setDeleting(t)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
      <TurmaWizardDialog
        open={openWizard}
        onOpenChange={setOpenWizard}
        contaId={effectiveContaId}
        onSaved={() => {
          /* reload handled by event */
        }}
      />
      {editing && (
        <EditEntityDialog
          open={!!editing}
          title="Editar turma"
          description="Atualize os dados básicos da turma."
          fields={[
            { name: 'nome', label: 'Nome', initialValue: editing.nome, validate: v => !v.trim() ? 'Informe o nome' : null },
            { name: 'capacidade', label: 'Capacidade', type: 'number', initialValue: editing.capacidade, validate: v => Number(v) <= 0 ? 'Valor inválido' : null },
            { name: 'horaInicio', label: 'Hora início', initialValue: editing.horaInicio, validate: v => !v ? 'Informe' : null },
            { name: 'horaFim', label: 'Hora fim', initialValue: editing.horaFim, validate: v => !v ? 'Informe' : null },
            { name: 'status', label: 'Status', type: 'select', initialValue: editing.status === 'ATIVO' ? 'ATIVO' : 'INATIVO', options: [ { value: 'ATIVO', label: 'Ativa' }, { value: 'INATIVO', label: 'Inativa' } ] },
          ]}
          onBuildPayload={(raw) => ({
            contaId: effectiveContaId,
            nome: String(raw.nome).trim(),
            capacidade: Number(raw.capacidade),
            horaInicio: String(raw.horaInicio),
            horaFim: String(raw.horaFim),
            status: raw.status,
          })}
          onSubmit={async (payload) => {
            try {
              const res = await fetch(`/api/turmas/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              const j = await res.json().catch(()=>null);
              if (!res.ok) throw new Error(j?.error?.message || 'Falha ao salvar');
              toast.custom(t => <CustomToast variant="success" title="Turma atualizada" description="Alterações salvas." onClose={() => toast.dismiss(t)} />);
              setEditing(null); load(); window.dispatchEvent(new CustomEvent('turmas:changed'));
            } catch (e) {
              toast.custom(t => <CustomToast variant="error" title="Erro ao salvar" description={(e as Error).message} onClose={() => toast.dismiss(t)} />);
            }
          }}
          onOpenChange={(o) => { if (!o) setEditing(null); }}
        />
      )}
      {deleting && (
        <ConfirmDeleteDialog
          open={!!deleting}
            title="Excluir turma"
            description={`Tem certeza que deseja excluir a turma "${deleting.nome}"? Esta ação não pode ser desfeita.`}
            onConfirm={async () => {
              try {
                const res = await fetch(`/api/turmas/${deleting.id}?contaId=${effectiveContaId}`, { method: 'DELETE' });
                if (!res.ok) {
                  const j = await res.json().catch(()=>null);
                  throw new Error(j?.error?.message || 'Falha ao excluir');
                }
                toast.custom(t => <CustomToast variant="success" title="Turma excluída" description="A turma foi removida." onClose={() => toast.dismiss(t)} />);
                setDeleting(null); load(); window.dispatchEvent(new CustomEvent('turmas:changed'));
              } catch (e) {
                toast.custom(t => <CustomToast variant="error" title="Erro ao excluir" description={(e as Error).message} onClose={() => toast.dismiss(t)} />);
              }
            }}
            onOpenChange={(o) => { if (!o) setDeleting(null); }}
        />
      )}
    </TableLayout>
  );
}

// Página padronizada: usa dialogs reutilizáveis, skeletons e layout unificado.
