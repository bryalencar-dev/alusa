'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { Plus, Edit3, Trash2 } from '@/components/icons/icons';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import EditEntityDialog from '@/components/dialogs/EditEntityDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import TableLayout from '@/components/layout/TableLayout';
import Pagination from '@/components/layout/Pagination';
import EntityFiltersBar, {
  type StatusValue,
  type SortOrder,
} from '@/components/layout/EntityFiltersBar';

interface Sala {
  id: string;
  nome: string;
  descricao?: string | null;
  capacidade: number;
  status: 'ATIVO' | 'INATIVO' | string;
}
const SalaWizardDrawer = dynamic(() => import('@/components/salas/SalaWizardDrawer'), {
  ssr: false,
});

export default function SalasPage() {
  const { data: session } = useSession();
  const contaId = (session?.user as { contaId?: string } | undefined)?.contaId || 'conta-default';
  const [data, setData] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusValue>('TODOS');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sala | null>(null);
  const [deleting, setDeleting] = useState<Sala | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('contaId', contaId);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/salas?${params.toString()}`);
      const json = await res.json();
      setData(Array.isArray(json.data) ? json.data : []);
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

  const ordered = useMemo(
    () =>
      [...data]
        .filter((s) => (statusFilter === 'TODOS' ? true : s.status === statusFilter))
        .sort((a, b) => {
          const c = a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
          return sortOrder === 'ASC' ? c : -c;
        }),
    [data, statusFilter, sortOrder],
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, sortOrder]);
  const paginated = ordered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <TableLayout
      title="Salas"
      subtitle="Gerencie as salas cadastradas."
      actions={
        <Button
          onClick={() => setOpen(true)}
          className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
        >
          <Plus className="h-4 w-4 mr-2" /> Nova sala
        </Button>
      }
      filtersBar={
        <EntityFiltersBar
          searchValue={q}
          onSearchChange={setQ}
          onSearchEnter={load}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          searchPlaceholder="Buscar por nome..."
        />
      }
      footer={
        <Pagination total={ordered.length} page={page} pageSize={pageSize} onChange={setPage} />
      }
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-4 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-1 h-4" />
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-3 h-4" />
                  <Skeleton className="col-span-4 h-4" />
                  <Skeleton className="col-span-2 h-6 w-16 rounded-full" />
                  <Skeleton className="col-span-2 h-4" />
                  <Skeleton className="col-span-1 h-8 w-8" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">Sala</div>
                <div className="col-span-4">Descrição</div>
                <div className="col-span-2 text-center">Capacidade</div>
                <div className="col-span-2 text-center">Status</div>
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
                      <div className="col-span-4 text-[13px] text-gray-700 leading-[20px]">
                        <span className="line-clamp-2 block whitespace-pre-wrap">
                          {s.descricao?.trim() || '-'}
                        </span>
                      </div>
                      <div className="col-span-2 text-center text-[13px] text-gray-700">
                        {s.capacidade}
                      </div>
                      <div className="col-span-2 flex justify-center">
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
                          onClick={() => setEditing(s)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Excluir sala"
                          onClick={() => setDeleting(s)}
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
      <SalaWizardDrawer open={open} onOpenChange={setOpen} contaId={contaId} onSaved={load} />
      {editing && (
        <EditEntityDialog
          open={!!editing}
          title="Editar sala"
          description="Atualize os dados da sala."
          fields={[
            {
              name: 'nome',
              label: 'Nome',
              initialValue: editing.nome,
              validate: (v) => (!v.trim() ? 'Informe o nome' : null),
            },
            {
              name: 'descricao',
              label: 'Descrição',
              type: 'textarea',
              initialValue: editing.descricao || '',
            },
            {
              name: 'capacidade',
              label: 'Capacidade',
              type: 'number',
              initialValue: editing.capacidade,
              validate: (v) => (Number(v) <= 0 ? 'Informe um número válido' : null),
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              initialValue: editing.status === 'ATIVO' ? 'ATIVO' : 'INATIVO',
              options: [
                { value: 'ATIVO', label: 'Ativa' },
                { value: 'INATIVO', label: 'Inativa' },
              ],
            },
          ]}
          onBuildPayload={(raw) => ({
            contaId,
            nome: String(raw.nome).trim(),
            descricao: String(raw.descricao || '').trim(),
            capacidade: Number(raw.capacidade),
            status: raw.status,
          })}
          onSubmit={async (payload) => {
            try {
              const res = await fetch(`/api/salas/${editing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const j = await res.json();
              if (!res.ok) throw new Error(j?.error?.message || 'Falha ao salvar');
              toast.custom((t) => (
                <CustomToast
                  variant="success"
                  title="Sala atualizada"
                  description="As alterações foram salvas."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              setEditing(null);
              load();
              window.dispatchEvent(new CustomEvent('salas:changed'));
            } catch (e) {
              toast.custom((t) => (
                <CustomToast
                  variant="error"
                  title="Erro ao salvar"
                  description={(e as Error).message}
                  onClose={() => toast.dismiss(t)}
                />
              ));
            }
          }}
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDeleteDialog
          open={!!deleting}
          title="Excluir sala"
          description={`Tem certeza que deseja excluir a sala "${deleting.nome}"? Esta ação não pode ser desfeita.`}
          onConfirm={async () => {
            try {
              const res = await fetch(`/api/salas/${deleting.id}?contaId=${contaId}`, {
                method: 'DELETE',
              });
              if (!res.ok) {
                const j = await res.json().catch(() => null);
                throw new Error(j?.error?.message || 'Falha ao excluir');
              }
              toast.custom((t) => (
                <CustomToast
                  variant="success"
                  title="Sala excluída"
                  description="A sala foi removida."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              setDeleting(null);
              load();
              window.dispatchEvent(new CustomEvent('salas:changed'));
            } catch (e) {
              toast.custom((t) => (
                <CustomToast
                  variant="error"
                  title="Erro ao excluir"
                  description={(e as Error).message}
                  onClose={() => toast.dismiss(t)}
                />
              ));
            }
          }}
          onOpenChange={(o) => {
            if (!o) setDeleting(null);
          }}
        />
      )}
    </TableLayout>
  );
}
