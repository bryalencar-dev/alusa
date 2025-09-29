'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TableLayout from '@/components/layout/TableLayout';
import { table } from '@/components/layout/TableStyles';
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import EntityFiltersBar, {
  type SortOrder as FiltersSortOrder,
  type StatusValue,
} from '@/components/layout/EntityFiltersBar';
import Pagination from '@/components/layout/Pagination';
import { Button } from '@/components/ui/button';
// Skeleton manual removido; DataTable fornece skeleton por coluna
import { Plus } from '@/components/icons/icons';
import { statusColumn, actionsColumn } from '@alusa/ui/datatable/columns';
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
  loading: boolean;
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
      <div className={table.container}>
        <SalasTable
          salas={paginated}
          accountMissing={accountMissing}
          onEdit={(sala) => {
            editDialog.openDialog(sala);
          }}
          onDelete={(sala) => {
            deleteDialog.openDialog(sala);
          }}
          loading={loading || userLoading}
        />
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

function SalasTable({ salas, accountMissing, onEdit, onDelete, loading }: SalasTableProps) {
  if (accountMissing) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        Conecte-se a uma conta para visualizar as salas cadastradas.
      </div>
    );
  }

  const columns: DataTableColumn<SalaListItem>[] = [
    {
      id: 'nome',
      header: 'Sala',
      width: 'w-1/4',
      align: 'left',
      render: (s) => (
        <div className="text-[13px] text-gray-900 font-normal truncate" title={s.nome}>
          {s.nome}
        </div>
      ),
      skeleton: <div className="h-4 w-40 bg-gray-200 rounded" />,
    },
    {
      id: 'descricao',
      header: 'Descrição',
      width: 'w-1/4',
      align: 'left',
      render: (s) => (
        <div className="w-full min-w-0">
          <span className="block truncate" title={s.descricao ?? ''}>
            {s.descricao?.trim() || '-'}
          </span>
        </div>
      ),
      skeleton: <div className="h-4 w-full bg-gray-200 rounded" />,
    },
    {
      id: 'capacidade',
      header: 'Capacidade',
      width: 'w-1/6',
      align: 'center',
      render: (s) => <span className="text-gray-700">{s.capacidade}</span>,
      skeleton: <div className="h-4 w-10 bg-gray-200 rounded mx-auto" />,
    },
    statusColumn<SalaListItem>({
      activeLabel: 'Ativa',
      inactiveLabel: 'Inativa',
      getStatus: (sala: SalaListItem) => sala.status,
    }),
    actionsColumn<SalaListItem>({
      onEdit,
      onDelete,
      editButtonAriaLabel: (sala: SalaListItem) => `Editar sala ${sala.nome}`,
      deleteButtonAriaLabel: (sala: SalaListItem) => `Inativar sala ${sala.nome}`,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={salas}
      rowKey={(s) => s.id}
      loading={loading}
      skeletonRows={5}
      emptyMessage={
        <div className="px-6 py-12 text-center text-gray-500">Nenhuma sala encontrada</div>
      }
      ariaLabel="Tabela de salas"
    />
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
