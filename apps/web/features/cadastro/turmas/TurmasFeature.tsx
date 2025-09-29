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
import TurmaEditDialog, { type TurmaEditFormValues } from '@/components/turmas/TurmaEditDialog';
import {
  type TurmaListItem,
  type UpdateTurmaPayload,
  updateTurma,
} from './services/turmas-service';
import { useTurmas, type UseTurmasFilters } from './hooks/use-turmas';

const TurmaWizardDialog = dynamic(() => import('@/components/turmas/TurmaWizardDialog'), {
  ssr: false,
});

const PAGE_SIZE = 10;

interface TurmasTableProps {
  turmas: TurmaListItem[];
  accountMissing: boolean;
  onEdit: (_turma: TurmaListItem) => void;
  onDelete: (_turma: TurmaListItem) => void;
}

export function TurmasFeature() {
  const { user, loading: userLoading } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const { items, loading, reload, remove, setItems } = useTurmas({ contaId });
  const editDialog = useEditDialog<TurmaListItem>();
  const deleteDialog = useDeleteDialog<TurmaListItem>({
    onDelete: async (turma) => {
      if (!contaId) throw new Error('Conta não informada para exclusão.');
      await remove({ id: turma.id, contaId });
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
  } = useEntityListFiltering<TurmaListItem>({
    items,
    nameAccessor: (turma) => turma.nome || '',
    statusAccessor: (turma) => (turma.status === 'INATIVO' ? 'INATIVO' : 'ATIVO'),
    searchPredicate: (turma, term, digits) => {
      if (!term && !digits) return true;
      const nome = (turma.nome || '').toLowerCase();
      const descricao = (turma.descricao || '').toLowerCase();
      const professoresNomes = turma.professores.map((prof) => prof.nome.toLowerCase()).join(' ');
      const capacidadeValue = String(turma.capacidade ?? '');
      return (
        (!!term &&
          (nome.includes(term) || descricao.includes(term) || professoresNomes.includes(term))) ||
        (!!digits && capacidadeValue.includes(digits))
      );
    },
  });

  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [setPageSize]);

  useEffect(() => {
    const handler = () => {
      void reload({ search: searchTerm, status: statusFilter });
    };
    window.addEventListener('turmas:changed', handler);
    return () => window.removeEventListener('turmas:changed', handler);
  }, [reload, searchTerm, statusFilter]);

  useEffect(() => {
    setSort(sortOrder);
  }, [sortOrder, setSort]);

  useEffect(() => {
    setSortOrder(sort);
  }, [sort]);

  const handleSearch = () => {
    const filters: UseTurmasFilters = {
      search: searchTerm,
      status: statusFilter,
    };
    void reload(filters);
  };

  const accountMissing = !contaId && !userLoading;

  return (
    <>
      <TableLayout
        title="Turmas"
        subtitle="Gerencie turmas, horários e capacidades."
        actions={
          <Button
            disabled={!contaId}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
            onClick={() => setWizardOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Nova turma
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
            searchPlaceholder="Buscar por nome..."
          />
        }
        footer={<Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} />}
      >
        <div className="bg-white rounded-xl border overflow-hidden">
          {loading || userLoading ? (
            <TurmasSkeleton />
          ) : (
            <TurmasTable
              turmas={paginated}
              accountMissing={accountMissing}
              onEdit={(turma) => {
                editDialog.openDialog(turma);
              }}
              onDelete={(turma) => {
                deleteDialog.openDialog(turma);
              }}
            />
          )}
        </div>
      </TableLayout>

      {contaId ? (
        <TurmaWizardDialog
          open={wizardOpen}
          contaId={contaId}
          onOpenChange={(open) => {
            setWizardOpen(open);
          }}
          onSaved={() => {
            setWizardOpen(false);
            window.dispatchEvent(new CustomEvent('turmas:changed'));
            void reload({ search: searchTerm, status: statusFilter });
          }}
        />
      ) : null}

      {editDialog.entity ? (
        <TurmaEditDialog
          open={editDialog.open}
          turma={editDialog.entity}
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
                  description="Não foi possível identificar a conta para atualizar a turma."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              return;
            }
            try {
              const payload = buildUpdatePayload(formValues, contaId, current);
              const updated = await updateTurma({
                id: current.id,
                payload,
              });
              setItems((prev) =>
                prev.map((turma) => (turma.id === updated.id ? { ...turma, ...updated } : turma)),
              );
              toast.custom((t) => (
                <CustomToast
                  variant="success"
                  title="Turma atualizada"
                  description="Alterações salvas."
                  onClose={() => toast.dismiss(t)}
                />
              ));
              editDialog.closeDialog();
              window.dispatchEvent(new CustomEvent('turmas:changed'));
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
        title="Excluir turma"
        description={(() => {
          if (!deleteDialog.entity) {
            return 'Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.';
          }
          const rawName = deleteDialog.entity.nome ?? '';
          const shortName = formatFirstLast(rawName) || rawName || 'esta turma';
          return (
            <span>
              Tem certeza que deseja excluir a turma <strong>{shortName}</strong>? Esta ação não
              pode ser desfeita.
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
                title="Turma excluída"
                description="A turma foi removida."
                onClose={() => toast.dismiss(t)}
              />
            ));
            window.dispatchEvent(new CustomEvent('turmas:changed'));
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

function TurmasSkeleton() {
  return (
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
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-6 py-3">
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
  );
}

function TurmasTable({ turmas, accountMissing, onEdit, onDelete }: TurmasTableProps) {
  if (accountMissing) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        Conecte-se a uma conta para visualizar as turmas cadastradas.
      </div>
    );
  }

  if (turmas.length === 0) {
    return <div className="px-6 py-12 text-center text-gray-500">Nenhuma turma encontrada</div>;
  }

  return (
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
        {turmas.map((turma) => (
          <div key={turma.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 text-[13px] text-gray-900 font-medium truncate">
                {turma.nome}
              </div>
              <div className="col-span-3 flex flex-wrap gap-1 justify-center">
                {turma.diasSemana.length > 0 ? (
                  turma.diasSemana.map((dia) => (
                    <Badge
                      key={dia}
                      className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    >
                      {dia}
                    </Badge>
                  ))
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                    Sem dias
                  </Badge>
                )}
              </div>
              <div className="col-span-2 text-center text-[13px] text-gray-600">
                {turma.horaInicio} - {turma.horaFim}
              </div>
              <div className="col-span-2 flex flex-wrap gap-1 justify-center">
                {turma.professores.length > 0 ? (
                  <>
                    {turma.professores.slice(0, 3).map((professor) => (
                      <Badge
                        key={professor.id}
                        className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        title={professor.nome}
                      >
                        {professor.nome.split(' ').slice(0, 2).join(' ')}
                      </Badge>
                    ))}
                    {turma.professores.length > 3 && (
                      <Badge className="bg-violet-100 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                        +{turma.professores.length - 3}
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {turma.professoresCount > 0
                      ? `${turma.professoresCount} prof.`
                      : 'Sem professor'}
                  </Badge>
                )}
              </div>
              <div className="col-span-1 flex justify-center">
                <Badge className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  {turma.capacidade}
                </Badge>
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  aria-label="Editar turma"
                  onClick={() => onEdit(turma)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label="Excluir turma"
                  onClick={() => onDelete(turma)}
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
  raw: TurmaEditFormValues,
  contaId: string | null | undefined,
  current: TurmaListItem,
): UpdateTurmaPayload {
  const nome = String(raw.nome ?? '').trim();
  const capacidadeRaw = Number(raw.capacidade);
  const horaInicio = String(raw.horaInicio ?? '').trim();
  const horaFim = String(raw.horaFim ?? '').trim();
  const statusRaw = String(raw.status ?? 'ATIVO');

  if (!contaId) {
    throw new Error('Conta não encontrada para atualizar turma.');
  }
  if (!current.modalidadeId) {
    throw new Error('Modalidade da turma não encontrada para atualização.');
  }
  if (!current.salaId) {
    throw new Error('Sala da turma não encontrada para atualização.');
  }

  const capacidade =
    Number.isFinite(capacidadeRaw) && capacidadeRaw > 0 ? capacidadeRaw : current.capacidade;
  const horaInicioValue = horaInicio || current.horaInicio;
  const horaFimValue = horaFim || current.horaFim;
  const diasSemanaList = Array.isArray(current.diasSemana)
    ? current.diasSemana.map((dia) => String(dia))
    : [];

  if (diasSemanaList.length === 0) {
    throw new Error('Dias da semana da turma não encontrados para atualização.');
  }

  const payload: UpdateTurmaPayload = {
    contaId,
    nome: nome || current.nome,
    status: statusRaw === 'INATIVO' ? 'INATIVO' : 'ATIVO',
    capacidade,
    horaInicio: horaInicioValue,
    horaFim: horaFimValue,
    modalidadeId: current.modalidadeId,
    salaId: current.salaId,
    diasSemana: diasSemanaList,
  };

  return payload;
}

export default TurmasFeature;
