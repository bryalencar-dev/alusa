'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TableLayout from '@/components/layout/TableLayout';
import { table } from '@/components/layout/TableStyles';
import { Plus } from '@/components/icons/icons';
import Pagination from '@/components/layout/Pagination';
import EntityFiltersBar from '@/components/layout/EntityFiltersBar';
import { useSession } from 'next-auth/react';
import { useCombos } from '../hooks/use-combos';
import {
  createComboRequest,
  updateComboRequest,
  deleteComboRequest,
  type ComboListItem,
  type CreateComboInput,
  type UpdateComboInput,
} from '../services/combos-service';
import ComboDialog from './ComboDialog';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import { statusColumn, actionsColumn } from '@alusa/ui/datatable/columns';
import { formatPlanoValorBRL } from '@/features/cadastro/planos/services/planos-service';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import { useDeleteDialog } from '@/hooks/use-delete-dialog';

export function CombosFeature() {
  const { data: session } = useSession();
  const contaId = session?.user?.contaId || null;
  const { items, loading, reload } = useCombos({ contaId: contaId || '', search: undefined });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<ComboListItem | null>(null);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const [sort, setSort] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const accountMissing = !contaId;
  const deleteDialog = useDeleteDialog<ComboListItem>({
    onDelete: async (combo) => {
      const targetContaId = contaId ?? combo.contaId;
      if (!targetContaId) throw new Error('Conta não informada para excluir combo.');
      await deleteComboRequest({ id: combo.id, contaId: targetContaId });
      await reload();
    },
  });

  const handleSearch = useCallback(() => {
    void reload({
      status: statusFilter === 'TODOS' ? undefined : statusFilter,
      search: searchTerm,
    });
  }, [reload, statusFilter, searchTerm]);

  useEffect(() => {
    void reload({
      status: statusFilter === 'TODOS' ? undefined : statusFilter,
      search: searchTerm,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let base = items;
    if (searchTerm.trim())
      base = base.filter((c) => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== 'TODOS') base = base.filter((c) => c.status === statusFilter);
    const dir = sort === 'ASC' ? 1 : -1;
    return [...base].sort((a, b) => a.nome.localeCompare(b.nome) * dir);
  }, [items, searchTerm, statusFilter, sort]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const total = filtered.length;

  const openCreate = () => {
    setEditing(null);
    setDialogMode('create');
    setDialogOpen(true);
  };
  const openEdit = (combo: ComboListItem) => {
    setEditing(combo);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  async function handleSubmit(data: CreateComboInput | UpdateComboInput) {
    if (!contaId) return;
    try {
      if ('id' in data) await updateComboRequest(data);
      else await createComboRequest(data);
      await reload();
      setDialogOpen(false);
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title={dialogMode === 'edit' ? 'Combo atualizado' : 'Combo criado'}
          description={dialogMode === 'edit' ? 'Alterações salvas.' : 'Registro criado.'}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } catch (e) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro"
          description={(e as Error).message}
          onClose={() => toast.dismiss(t)}
        />
      ));
    }
  }

  const columns: DataTableColumn<ComboListItem>[] = [
    {
      id: 'nome',
      header: 'Nome',
      width: 'w-1/3',
      align: 'left',
      render: (c) => (
        <div className={table.primaryText} title={c.nome}>
          <span className="font-medium text-gray-900 whitespace-normal break-words">{c.nome}</span>
        </div>
      ),
      skeleton: <div className="h-4 w-40 bg-gray-200 rounded" />,
    },
    {
      id: 'valorMensal',
      header: 'Valor Mensal',
      width: 'w-32',
      align: 'right',
      render: (c) => (
        <span className="font-medium text-gray-900 whitespace-nowrap">
          {formatPlanoValorBRL(c.valorMensal)}
        </span>
      ),
      skeleton: <div className="h-4 w-16 bg-gray-200 rounded ml-auto" />,
    },
    {
      id: 'qtd',
      header: 'Qtd Turmas',
      width: 'w-24',
      align: 'center',
      render: (c) => c.turmas.length,
      skeleton: <div className="h-4 w-6 bg-gray-200 rounded mx-auto" />,
    },
    statusColumn<ComboListItem>({ activeLabel: 'Ativo', inactiveLabel: 'Inativo' }),
    actionsColumn<ComboListItem>({
      onEdit: (c) => openEdit(c),
      onDelete: (c) => deleteDialog.openDialog(c),
      editButtonAriaLabel: (c) => `Editar combo ${c.nome}`,
      deleteButtonAriaLabel: (c) => `Excluir combo ${c.nome}`,
    }),
  ];

  const tableContent = accountMissing ? (
    <div className="bg-white rounded-xl border px-6 py-12 text-center text-gray-500">
      Conecte-se a uma conta para visualizar os combos cadastrados.
    </div>
  ) : (
    <div className={table.container} data-testid="combos-table">
      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        rowKey={(c) => c.id}
        skeletonRows={5}
        emptyMessage={
          <div className="px-6 py-12 text-center text-gray-500">Nenhum combo encontrado.</div>
        }
        ariaLabel="Tabela de combos"
      />
    </div>
  );

  return (
    <>
      <TableLayout
        title="Combos"
        subtitle="Agrupe turmas com regras e valores personalizados."
        actions={
          <Button
            onClick={openCreate}
            disabled={!contaId}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo combo
          </Button>
        }
        filtersBar={
          <EntityFiltersBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            onSearchEnter={handleSearch}
            statusValue={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              void reload({ status: value === 'TODOS' ? undefined : value, search: searchTerm });
            }}
            sortOrder={sort}
            onSortChange={(o) => setSort(o)}
            searchPlaceholder="Buscar por nome..."
          />
        }
        footer={<Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} />}
      >
        {tableContent}
      </TableLayout>
      {contaId && (
        <ComboDialog
          open={dialogOpen}
          mode={dialogMode}
          contaId={contaId}
          combo={editing}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
        />
      )}
      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Excluir combo"
        description={(() => {
          const nome = deleteDialog.entity?.nome ?? 'este combo';
          return (
            <span>
              Tem certeza que deseja excluir o combo <strong>{nome}</strong>? Esta ação é permanente
              e removerá definitivamente o registro.
            </span>
          );
        })()}
        confirmLabel={deleteDialog.loading ? 'Excluindo...' : 'Excluir'}
        cancelLabel="Cancelar"
        loadingLabel="Excluindo..."
        onOpenChange={deleteDialog.onOpenChange}
        onConfirm={async () => {
          try {
            await deleteDialog.confirm();
            toast.custom((t) => (
              <CustomToast
                variant="success"
                title="Combo excluído"
                description="O combo foi removido."
                onClose={() => toast.dismiss(t)}
              />
            ));
          } catch (err) {
            toast.custom((t) => (
              <CustomToast
                variant="error"
                title="Erro ao excluir"
                description={(err as Error).message}
                onClose={() => toast.dismiss(t)}
              />
            ));
          }
        }}
      />
    </>
  );
}

export default CombosFeature;
