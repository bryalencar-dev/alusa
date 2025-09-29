'use client';

import { useEffect, useMemo, useState } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar from '@/components/layout/EntityFiltersBar';
import Pagination from '@/components/layout/Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit3, Trash2 } from '@/components/icons/icons';
import { CustomToast } from '@/components/CustomToast';
import { toast } from 'sonner';
import { useDeleteDialog } from '@/hooks/use-delete-dialog';
import { useEntityListFiltering } from '@/hooks/entity/use-entity-list-filtering';
import useCurrentUser from '@/hooks/use-current-user';
import { PlanosWizardDialog } from '@/components/planos/PlanosWizardDialog';
import { usePlanos, type UsePlanosFilters } from './hooks/use-planos';
import { type PlanoListItem } from './services/planos-service';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';

const PAGE_SIZE = 10;
const periodicidadeLabels: Record<PlanoListItem['periodicidade'], string> = {
  MENSAL: 'Mensal',
  QUINZENAL: 'Quinzenal',
  SEMANAL: 'Semanal',
  TRIMESTRAL: 'Trimestral',
  ANUAL: 'Anual',
};

export function PlanosFeature() {
  const { user, loading: userLoading } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const { items, loading, reload, remove } = usePlanos({ contaId });
  const deleteDialog = useDeleteDialog<PlanoListItem>({
    onDelete: async (plano) => {
      if (!contaId) throw new Error('Conta não encontrada.');
      const updated = await remove({ id: plano.id, contaId });
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Plano inativado"
          description={`O plano ${updated.nome} foi marcado como inativo.`}
          onClose={() => toast.dismiss(t)}
        />
      ));
      reload();
    },
  });

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingPlano, setEditingPlano] = useState<PlanoListItem | null>(null);

  const {
    search,
    setSearch,
    status,
    setStatus,
    sort,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginated,
    total,
  } = useEntityListFiltering<PlanoListItem>({
    items,
    nameAccessor: (plano) => plano.nome,
    statusAccessor: (plano) => (plano.status === 'INATIVO' ? 'INATIVO' : 'ATIVO'),
  });

  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [setPageSize]);

  const columns = useMemo<ColumnDef<PlanoListItem, unknown>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Plano',
        cell: ({ getValue }) => (
          <div className="text-sm font-medium text-slate-900">{getValue<string>()}</div>
        ),
      },
      {
        accessorKey: 'periodicidade',
        header: 'Periodicidade',
        cell: ({ getValue }) => (
          <span className="text-sm text-slate-600">
            {periodicidadeLabels[getValue<PlanoListItem['periodicidade']>()] ?? 'Mensal'}
          </span>
        ),
      },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.valorFormatado}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) =>
          getValue<string>() === 'ATIVO' ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-200">Inativo</Badge>
          ),
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => {
          const plano = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                aria-label="Editar plano"
                onClick={() => {
                  setEditingPlano(plano);
                  setWizardOpen(true);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label="Excluir plano"
                onClick={() => deleteDialog.openDialog(plano)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteDialog],
  );

  const table = useReactTable({
    data: paginated,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const accountMissing = !contaId && !userLoading;

  const handleSearch = () => {
    const filters: UsePlanosFilters = { search, status };
    void reload(filters);
  };

  function handleSaved() {
    void reload({ search, status });
    setWizardOpen(false);
    setEditingPlano(null);
  }

  function handleOpenWizardCreate() {
    setEditingPlano(null);
    setWizardOpen(true);
  }

  return (
    <>
      <TableLayout
        title="Planos"
        subtitle="Gerencie planos de cobrança e recorrência."
        actions={
          <Button
            disabled={!contaId}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
            onClick={handleOpenWizardCreate}
            data-testid="novo-plano"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo plano
          </Button>
        }
        filtersBar={
          <EntityFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            onSearchEnter={handleSearch}
            statusValue={status}
            onStatusChange={(value) => {
              setStatus(value);
              void reload({ search, status: value });
            }}
            sortOrder={sort}
            onSortChange={setSort}
            searchPlaceholder="Buscar por nome ou descrição..."
          />
        }
        footer={<Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} />}
      >
        <div className="overflow-hidden rounded-xl border bg-white">
          {loading || userLoading ? (
            <PlanosSkeleton />
          ) : accountMissing ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Conecte-se a uma conta para visualizar os planos cadastrados.
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">Nenhum plano encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed" data-testid="planos-table">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr
                      key={headerGroup.id}
                      className="text-left text-[11px] font-medium uppercase tracking-wider text-gray-500"
                    >
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-6 py-3">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.original.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                      data-testid={`plano-row-${row.original.id}`}
                      data-plan-name={row.original.nome}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </TableLayout>

      {contaId ? (
        <PlanosWizardDialog
          open={wizardOpen}
          contaId={contaId}
          plano={editingPlano}
          onOpenChange={(open) => {
            if (!open) {
              setWizardOpen(false);
              setEditingPlano(null);
            } else {
              setWizardOpen(true);
            }
          }}
          onSaved={handleSaved}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Inativar plano"
        description={(() => {
          if (!deleteDialog.entity) return 'Tem certeza que deseja inativar este plano?';
          return (
            <span>
              Tem certeza que deseja inativar o plano <strong>{deleteDialog.entity.nome}</strong>?
              Esta ação pode ser revertida ativando-o novamente.
            </span>
          );
        })()}
        confirmLabel={deleteDialog.loading ? 'Inativando...' : 'Inativar'}
        loadingLabel="Inativando..."
        cancelLabel="Cancelar"
        onOpenChange={deleteDialog.onOpenChange}
        onConfirm={async () => {
          try {
            await deleteDialog.confirm();
            void reload({ search, status });
          } catch (error) {
            toast.custom((t) => (
              <CustomToast
                variant="error"
                title="Não foi possível inativar"
                description={(error as Error).message}
                onClose={() => toast.dismiss(t)}
              />
            ));
          }
        }}
      />
    </>
  );
}

function PlanosSkeleton() {
  return (
    <>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-4 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
        </div>
      </div>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-6 py-3">
          <div className="grid grid-cols-12 items-center gap-4">
            <Skeleton className="col-span-4 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
          </div>
        </div>
      ))}
    </>
  );
}
