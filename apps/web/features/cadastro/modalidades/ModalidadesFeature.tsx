'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar, { type SortOrder } from '@/components/layout/EntityFiltersBar';
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
import ModalidadeEditDialog, {
  type ModalidadeEditFormValues,
} from '@/components/modalidades/ModalidadeEditDialog';
import {
  type ModalidadeListItem,
  type UpdateModalidadePayload,
  updateModalidade,
} from './services/modalidades-service';
import { useModalidades, type UseModalidadesFilters } from './hooks/use-modalidades';

const ModalidadeWizardDialog = dynamic(
  () => import('@/components/modalidades/ModalidadeWizardDialog'),
  { ssr: false },
);

const PAGE_SIZE = 10;

interface ModalidadesTableProps {
  modalidades: ModalidadeListItem[];
  accountMissing: boolean;
  onEdit: (_modalidade: ModalidadeListItem) => void;
  onDelete: (_modalidade: ModalidadeListItem) => void;
}

export function ModalidadesFeature() {
  const { user, loading: userLoading } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const { items, loading, reload, remove, setItems } = useModalidades({ contaId });
  const editDialog = useEditDialog<ModalidadeListItem>();
  const deleteDialog = useDeleteDialog<ModalidadeListItem>({
    onDelete: async (modalidade) => {
      if (!contaId) throw new Error('Conta não informada para exclusão.');
      await remove({ id: modalidade.id, contaId });
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
    pageSize,
    setPageSize,
    paginated,
    total,
  } = useEntityListFiltering<ModalidadeListItem>({
    items,
    nameAccessor: (modalidade) => modalidade.nome || '',
    statusAccessor: (modalidade) => (modalidade.status === 'INATIVO' ? 'INATIVO' : 'ATIVO'),
  });

  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [setPageSize]);

  useEffect(() => {
    const handler = () => {
      void reload({ search: searchTerm, status: statusFilter });
    };
    window.addEventListener('modalidades:changed', handler);
    return () => window.removeEventListener('modalidades:changed', handler);
  }, [reload, searchTerm, statusFilter]);

  useEffect(() => {
    setSort(sortOrder);
  }, [sortOrder, setSort]);

  useEffect(() => {
    setSortOrder(sort);
  }, [sort]);

  const handleSearch = () => {
    const filters: UseModalidadesFilters = {
      search: searchTerm,
      status: statusFilter,
    };
    void reload(filters);
  };

  const accountMissing = !contaId && !userLoading;

  return (
    <>
      <TableLayout
        title="Modalidades"
        subtitle="Gerencie cadastros e informações das modalidades."
        actions={
          <Button
            disabled={!contaId}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
            onClick={() => setWizardOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Nova modalidade
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
              void reload({ search: searchTerm, status: value });
            }}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            searchPlaceholder="Buscar por nome ou descrição..."
          />
        }
        footer={<Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} />}
      >
        <div className="bg-white rounded-xl border overflow-hidden">
          {loading || userLoading ? (
            <ModalidadesSkeleton />
          ) : (
            <ModalidadesTable
              modalidades={paginated}
              accountMissing={accountMissing}
              onEdit={(modalidade) => {
                editDialog.openDialog(modalidade);
              }}
              onDelete={(modalidade) => {
                deleteDialog.openDialog(modalidade);
              }}
            />
          )}
        </div>
      </TableLayout>

      {contaId ? (
        <ModalidadeWizardDialog
          open={wizardOpen}
          contaId={contaId}
          onOpenChange={(open) => {
            setWizardOpen(open);
          }}
          onSaved={() => {
            setWizardOpen(false);
            window.dispatchEvent(new CustomEvent('modalidades:changed'));
            void reload({ search: searchTerm, status: statusFilter });
          }}
        />
      ) : null}

      {editDialog.entity ? (
        <ModalidadeEditDialog
          open={editDialog.open}
          modalidade={editDialog.entity}
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
                  description="Não foi possível identificar a conta para atualizar a modalidade."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              return;
            }
            try {
              const payload = buildUpdatePayload(formValues, contaId);
              const updated = await updateModalidade({
                id: current.id,
                payload,
              });
              setItems((prev) =>
                prev.map((modalidade) =>
                  modalidade.id === updated.id ? { ...modalidade, ...updated } : modalidade,
                ),
              );
              toast.custom((t) => (
                <CustomToast
                  variant="success"
                  title="Modalidade atualizada"
                  description="As alterações foram salvas."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              editDialog.closeDialog();
              window.dispatchEvent(new CustomEvent('modalidades:changed'));
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
        title="Excluir modalidade"
        description={(() => {
          if (!deleteDialog.entity) {
            return 'Tem certeza que deseja excluir esta modalidade? Esta ação não pode ser desfeita.';
          }
          const rawName = deleteDialog.entity.nome ?? '';
          const shortName = formatFirstLast(rawName) || rawName || 'esta modalidade';
          return (
            <span>
              Tem certeza que deseja excluir a modalidade <strong>{shortName}</strong>? Esta ação
              não pode ser desfeita.
            </span>
          );
        })()}
        confirmLabel={deleteDialog.loading ? 'Excluindo...' : 'Excluir'}
        loadingLabel="Excluindo..."
        cancelLabel="Cancelar"
        onOpenChange={deleteDialog.onOpenChange}
        onConfirm={async () => {
          try {
            await deleteDialog.confirm();
            toast.custom((t) => (
              <CustomToast
                variant="success"
                title="Modalidade excluída"
                description="A modalidade foi removida."
                onClose={() => toast.dismiss(t)}
              />
            ));
            window.dispatchEvent(new CustomEvent('modalidades:changed'));
            void reload({ search: searchTerm, status: statusFilter });
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
    </>
  );
}

function ModalidadesSkeleton() {
  return (
    <>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-4 h-4" />
          <Skeleton className="col-span-5 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-1 h-4" />
        </div>
      </div>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-6 py-3">
          <div className="grid grid-cols-12 gap-4 items-center">
            <Skeleton className="col-span-4 h-4" />
            <Skeleton className="col-span-5 h-4" />
            <Skeleton className="col-span-2 h-6 w-16 rounded-full" />
            <Skeleton className="col-span-1 h-8 w-8" />
          </div>
        </div>
      ))}
    </>
  );
}

function ModalidadesTable({
  modalidades,
  accountMissing,
  onEdit,
  onDelete,
}: ModalidadesTableProps) {
  if (accountMissing) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        Conecte-se a uma conta para visualizar as modalidades cadastradas.
      </div>
    );
  }

  if (modalidades.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">Nenhuma modalidade encontrada</div>
    );
  }

  return (
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
        {modalidades.map((modalidade) => (
          <div
            key={modalidade.id}
            className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4 text-[13px] text-gray-900 font-normal truncate">
                {modalidade.nome}
              </div>
              <div className="col-span-5 text-[13px] text-gray-700 leading-[20px]">
                <span className="line-clamp-2 block whitespace-pre-wrap">
                  {modalidade.descricao?.trim() || '-'}
                </span>
              </div>
              <div className="col-span-2 flex justify-center">
                {modalidade.status === 'ATIVO' ? (
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
                  aria-label="Editar modalidade"
                  onClick={() => onEdit(modalidade)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label="Excluir modalidade"
                  onClick={() => onDelete(modalidade)}
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

function buildUpdatePayload(
  raw: ModalidadeEditFormValues,
  contaId?: string | null,
): UpdateModalidadePayload {
  if (!contaId) {
    throw new Error('Conta não encontrada para atualizar modalidade.');
  }

  const nome = raw.nome.trim();
  const descricao = raw.descricao.trim();

  const payload: UpdateModalidadePayload = {
    contaId,
    status: raw.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
  };

  if (nome) payload.nome = nome;
  payload.descricao = descricao;

  return payload;
}

export default ModalidadesFeature;
