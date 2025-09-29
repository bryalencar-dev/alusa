'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar, {
  type SortOrder as FiltersSortOrder,
  type StatusValue,
} from '@/components/layout/EntityFiltersBar';
import Pagination from '@/components/layout/Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit3, Trash2 } from '@/components/icons/icons';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import { CustomToast } from '@/components/CustomToast';
import { toast } from 'sonner';
import { useEditDialog } from '@/hooks/use-edit-dialog';
import { useDeleteDialog } from '@/hooks/use-delete-dialog';
import { useEntityListFiltering } from '@/hooks/entity/use-entity-list-filtering';
import useCurrentUser from '@/hooks/use-current-user';
import { formatFirstLast } from '@alusa/lib';
import SalaEditDialog, { type SalaEditFormValues } from '@/components/salas/SalaEditDialog';
import { useSalas } from './hooks/use-salas';
import { updateSala, type SalaListItem, type UpdateSalaPayload } from './services/salas-service';

const SalaWizardDrawer = dynamic(() => import('@/components/salas/SalaWizardDrawer'), {
  ssr: false,
});

const PAGE_SIZE = 10;

type SortOrder = 'ASC' | 'DESC';
type StatusFilter = StatusValue;

interface SalasTableProps {
  salas: SalaListItem[];
  accountMissing: boolean;
  onEdit: (_sala: SalaListItem) => void;
  onDelete: (_sala: SalaListItem) => void;
}

export function SalasFeature() {
  const { user, loading: userLoading } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const { items, loading, reload, setItems } = useSalas({ contaId });
  const editDialog = useEditDialog<SalaListItem>();
  const deleteDialog = useDeleteDialog<SalaListItem>({
    onDelete: async (sala) => {
      if (!contaId) throw new Error('Conta não informada para inativação.');
      const updated = await updateSala({ id: sala.id, payload: { contaId, status: 'INATIVO' } });
      setItems((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
    },
  });

  const [wizardOpen, setWizardOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');

  const {
    search: searchTerm,
    setSearch: setSearchTerm,
    status: statusFilter,
    setStatus: setStatusFilter,
    sort,
    setSort,
    page,
    setPage,
    paginated,
    total,
  } = useEntityListFiltering<SalaListItem>({
    items,
    nameAccessor: (sala) => sala.nome ?? '',
    statusAccessor: (sala) => (sala.status === 'INATIVO' ? 'INATIVO' : 'ATIVO'),
    searchPredicate: (sala, term, digits) => {
      const nome = (sala.nome || '').toLowerCase();
      const descricao = (sala.descricao || '').toLowerCase();
      const termMatch = term ? nome.includes(term) || descricao.includes(term) : false;
      const capacidadeMatch = digits ? String(sala.capacidade ?? '').includes(digits) : false;
      return termMatch || capacidadeMatch;
    },
    initialSort: 'ASC',
  });

  useEffect(() => {
    const handler = () => {
      void reload();
    };
    window.addEventListener('salas:changed', handler);
    return () => window.removeEventListener('salas:changed', handler);
  }, [reload]);

  useEffect(() => {
    setSort(sortOrder);
  }, [sortOrder, setSort]);

  useEffect(() => {
    setSortOrder(sort);
  }, [sort]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortOrder, setPage]);

  const accountMissing = !contaId && !userLoading;

  return (
    <TableLayout
      title="Salas"
      subtitle="Gerencie as salas cadastradas."
      actions={
        <Button
          onClick={() => setWizardOpen(true)}
          className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
          disabled={!contaId}
        >
          <Plus className="h-4 w-4 mr-2" /> Nova sala
        </Button>
      }
      filtersBar={
        <EntityFiltersBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchEnter={() => {
            void reload();
          }}
          statusValue={statusFilter as StatusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value as StatusFilter);
          }}
          sortOrder={sortOrder as FiltersSortOrder}
          onSortChange={(order) => setSortOrder(order as SortOrder)}
          searchPlaceholder="Buscar por nome ou descrição..."
        />
      }
      footer={<Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} />}
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading || userLoading ? (
          <SalasSkeleton />
        ) : (
          <SalasTable
            salas={paginated}
            accountMissing={accountMissing}
            onEdit={(sala) => {
              editDialog.openDialog(sala);
            }}
            onDelete={(sala) => {
              deleteDialog.openDialog(sala);
            }}
          />
        )}
      </div>

      {contaId ? (
        <SalaWizardDrawer
          open={wizardOpen}
          contaId={contaId}
          onOpenChange={(open) => {
            setWizardOpen(open);
          }}
          onSaved={() => {
            setWizardOpen(false);
            void reload();
          }}
        />
      ) : null}

      {editDialog.entity ? (
        <SalaEditDialog
          open={editDialog.open}
          sala={editDialog.entity}
          onOpenChange={(open) => {
            if (!open) editDialog.closeDialog();
          }}
          onSubmit={async (formValues) => {
            const current = editDialog.entity;
            if (!current) return;
            if (!contaId) {
              toast.custom((t) => (
                <CustomToast
                  variant="error"
                  title="Conta não encontrada"
                  description="Não foi possível identificar a conta para atualizar a sala."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              return;
            }
            try {
              const payload = buildUpdatePayload(formValues, contaId);
              const updated = await updateSala({ id: current.id, payload });
              setItems((prev) =>
                prev.map((sala) => (sala.id === updated.id ? { ...sala, ...updated } : sala)),
              );
              toast.custom((t) => (
                <CustomToast
                  variant="success"
                  title="Sala atualizada"
                  description="As alterações foram salvas."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              editDialog.closeDialog();
              window.dispatchEvent(new CustomEvent('salas:changed'));
            } catch (error) {
              toast.custom((t) => (
                <CustomToast
                  variant="error"
                  title="Erro ao salvar"
                  description={(error as Error).message}
                  onClose={() => toast.dismiss(t)}
                />
              ));
              throw error;
            }
          }}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Inativar sala"
        description={(() => {
          if (!deleteDialog.entity) {
            return 'Tem certeza que deseja inativar esta sala? Você poderá reativá-la futuramente.';
          }
          const rawName = deleteDialog.entity.nome ?? '';
          const shortName = formatFirstLast(rawName) || rawName || 'esta sala';
          return (
            <span>
              Tem certeza que deseja inativar a sala <strong>{shortName}</strong>? Você poderá
              reativá-la editando o cadastro.
            </span>
          );
        })()}
        onOpenChange={deleteDialog.onOpenChange}
        confirmLabel={deleteDialog.loading ? 'Inativando...' : 'Inativar'}
        loadingLabel="Inativando..."
        cancelLabel="Cancelar"
        onConfirm={async () => {
          try {
            await deleteDialog.confirm();
            toast.custom((t) => (
              <CustomToast
                variant="success"
                title="Sala inativada"
                description="A sala foi marcada como inativa."
                onClose={() => toast.dismiss(t)}
              />
            ));
            window.dispatchEvent(new CustomEvent('salas:changed'));
            void reload();
          } catch (error) {
            toast.custom((t) => (
              <CustomToast
                variant="error"
                title="Erro ao excluir"
                description={(error as Error).message}
                onClose={() => toast.dismiss(t)}
              />
            ));
          }
        }}
      />
    </TableLayout>
  );
}

function SalasSkeleton() {
  return (
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
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-6 py-3">
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
  );
}

function SalasTable({ salas, accountMissing, onEdit, onDelete }: SalasTableProps) {
  if (accountMissing) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        Conecte-se a uma conta para visualizar as salas cadastradas.
      </div>
    );
  }

  if (salas.length === 0) {
    return <div className="px-6 py-12 text-center text-gray-500">Nenhuma sala encontrada</div>;
  }

  return (
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
        {salas.map((sala) => (
          <div key={sala.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-[13px] text-gray-900 font-normal truncate">
                {sala.nome}
              </div>
              <div className="col-span-4 text-[13px] text-gray-700 leading-[20px]">
                <span className="line-clamp-2 block whitespace-pre-wrap">
                  {sala.descricao?.trim() || '-'}
                </span>
              </div>
              <div className="col-span-2 text-center text-[13px] text-gray-700">
                {sala.capacidade}
              </div>
              <div className="col-span-2 flex justify-center">
                {sala.status === 'ATIVO' ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Ativa</Badge>
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
                  onClick={() => onEdit(sala)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label="Inativar sala"
                  onClick={() => onDelete(sala)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function buildUpdatePayload(raw: SalaEditFormValues, contaId: string | null): UpdateSalaPayload {
  if (!contaId) {
    throw new Error('Conta não encontrada para atualizar sala.');
  }

  const nome = raw.nome.trim();
  const capacidadeNumber = Number(raw.capacidade);
  const descricaoValue = raw.descricao.trim();

  const payload: UpdateSalaPayload = {
    contaId,
    status: raw.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
  };

  if (nome) payload.nome = nome;
  if (!Number.isNaN(capacidadeNumber) && capacidadeNumber > 0) {
    payload.capacidade = capacidadeNumber;
  }
  payload.descricao = descricaoValue;

  return payload;
}
