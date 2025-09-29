'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// Input/Select removidos em favor de EntityFiltersBar
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, Edit3, Eye, EyeOff } from '@/components/icons/icons';
// Dropdown de ordenação incorporado no EntityFiltersBar
import ColaboradorWizardDialog from '@/components/colaboradores/ColaboradorWizardDialog';
import ColaboradorEditDialog, {
  type ColaboradorEdit,
} from '@/components/colaboradores/ColaboradorEditDialog';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import ReasonField from '@/components/shared/ReasonField';
import TableLayout from '@/components/layout/TableLayout';
import Pagination from '@/components/layout/Pagination';
import EntityFiltersBar, {
  type StatusValue,
  type SortOrder as SortOrderEF,
} from '@/components/layout/EntityFiltersBar';
import { useDeleteDialog } from '@/hooks/use-delete-dialog';
import { useEditDialog } from '@/hooks/use-edit-dialog';
import { useColaboradores } from './hooks/use-colaboradores';
import { useEntityListFiltering } from '@/hooks/entity/use-entity-list-filtering';
import type { ColaboradorListItem } from './services/colaboradores-service';
import { getStatusBadgeProps } from '@/lib/status';
import { formatFirstLast, formatInitials, maskCpf } from '@alusa/lib';
import toast from 'react-hot-toast';
import useCurrentUser from '@/hooks/use-current-user';

const PAGE_SIZE = 10;

type SortOrder = 'ASC' | 'DESC';
type StatusFilter = StatusValue;

const cargoLabels: Record<string, string> = {
  PROFESSOR: 'Professor',
  RECEPCAO: 'Recepção',
  FINANCEIRO: 'Financeiro',
  ADMINISTRATIVO: 'Administrativo',
  OUTRO: 'Outro',
};

function formatCargo(cargo: string) {
  return cargoLabels[cargo] ?? cargo;
}

export function ColaboradoresFeature() {
  const { user, loading: userLoading } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const { items, loading, reload, remove } = useColaboradores({ contaId });
  const editDialog = useEditDialog<ColaboradorEdit>();
  const deleteDialog = useDeleteDialog<ColaboradorListItem>({
    onDelete: async (colaborador, reason) => {
      await remove({ id: colaborador.id, reason });
      try {
        window.dispatchEvent(new CustomEvent('colaboradores:changed'));
      } catch {
        /* noop */
      }
    },
  });

  const [hideSensitive, setHideSensitive] = useState(false);
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
    ordered,
    paginated,
    resetFilters,
  } = useEntityListFiltering<ColaboradorListItem>({
    items,
    nameAccessor: (c) => c.nome ?? '',
    statusAccessor: (c) => (c.status as StatusFilter) ?? 'ATIVO',
    searchPredicate: (c, term, digits) => {
      const nome = (c.nome || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const cpfDigits = (c.cpf || '').replace(/\D/g, '');
      const matchNome = nome.includes(term);
      const matchEmail = email.includes(term);
      const matchCpf = Boolean(digits && cpfDigits.includes(digits));
      return matchNome || matchEmail || matchCpf;
    },
    initialSort: 'ASC',
  });
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      void reload();
    };
    window.addEventListener('colaboradores:changed', handler);
    return () => window.removeEventListener('colaboradores:changed', handler);
  }, [reload]);

  // Sincroniza sort local (para compatibilidade com EntityFiltersBar) com hook
  useEffect(() => {
    setSort(sortOrder);
  }, [sortOrder, setSort]);
  useEffect(() => {
    setSortOrder(sort);
  }, [sort]);

  const shouldBlur = (value: string | null | undefined) =>
    Boolean(hideSensitive && value && value !== '-');
  const blurClass = 'inline-block filter blur-[3px] px-1 -mx-1 py-0.5 -my-0.5 leading-[20px]';

  return (
    <TableLayout
      title="Gestão de Colaboradores"
      subtitle="Gerencie cadastros, status e informações dos colaboradores."
      actions={
        <>
          <Button
            onClick={() => setWizardOpen(true)}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
            aria-label="Cadastrar colaborador"
            disabled={!contaId}
          >
            <Plus className="h-4 w-4 mr-2 transition-none" />
            Novo colaborador
          </Button>
          <Button
            variant="outline"
            onClick={() => setHideSensitive((v) => !v)}
            className="h-10 px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-none [&_svg]:transition-none"
            title={
              hideSensitive ? 'Mostrar CPF, e-mail e telefone' : 'Ocultar CPF, e-mail e telefone'
            }
            aria-pressed={hideSensitive}
          >
            {hideSensitive ? (
              <>
                <Eye className="h-4 w-4 mr-2 transition-none" />
                Mostrar dados
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2 transition-none" />
                Ocultar dados
              </>
            )}
          </Button>
        </>
      }
      filtersBar={
        <EntityFiltersBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          statusValue={statusFilter}
          onStatusChange={(v) => setStatusFilter(v as StatusFilter)}
          sortOrder={sortOrder as SortOrderEF}
          onSortChange={(o) => setSortOrder(o as SortOrder)}
          searchPlaceholder="Buscar por nome..."
        />
      }
      footer={
        <Pagination total={ordered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      }
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading || userLoading ? (
          <TableSkeleton />
        ) : (
          <ColaboradoresTable
            colaboradores={paginated}
            shouldBlur={shouldBlur}
            blurClass={blurClass}
            onEdit={(colaborador) => {
              editDialog.openDialog(mapToColaboradorEdit(colaborador));
            }}
            onDelete={(colaborador) => {
              deleteDialog.openDialog(colaborador);
            }}
          />
        )}
      </div>

      {/* Paginação movida para footer do TableLayout */}
      <ColaboradorWizardDialog
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) void reload();
        }}
        onFinish={() => {
          resetFilters();
          void reload();
        }}
        contaId={contaId ?? undefined}
      />

      <ColaboradorEditDialog
        open={editDialog.open}
        onOpenChange={(open) => {
          editDialog.onOpenChange(open);
          if (!open) void reload();
        }}
        mode={editDialog.entity ? 'edit' : 'create'}
        colaborador={editDialog.entity}
        contaId={contaId ?? undefined}
        onSaved={() => {
          editDialog.closeDialog();
          void reload();
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Excluir colaborador"
        description={(() => {
          if (!deleteDialog.entity) {
            return 'Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.';
          }
          const rawName = deleteDialog.entity.nome ?? '';
          const shortName = formatFirstLast(rawName) || rawName || 'este colaborador';
          return (
            <span>
              Tem certeza que deseja excluir o colaborador <strong>{shortName}</strong>? Esta ação
              não pode ser desfeita.
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
            toast.success('Colaborador excluído');
            await reload();
          } catch (error) {
            toast.error((error as Error).message || 'Erro ao excluir colaborador');
          }
        }}
      >
        <ReasonField
          id="colaborador-delete-reason"
          value={deleteDialog.reason}
          onChange={(event) => deleteDialog.setReason(event.target.value)}
        />
      </ConfirmDeleteDialog>
    </TableLayout>
  );
}

function TableSkeleton() {
  return (
    <>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-3 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-1 h-4" />
          <Skeleton className="col-span-1 h-4" />
        </div>
      </div>
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-6 py-3">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
            <Skeleton className="col-span-2 h-4 w-28" />
            <Skeleton className="col-span-2 h-4 w-56" />
            <Skeleton className="col-span-2 h-4 w-32" />
            <Skeleton className="col-span-1 h-4 w-20" />
            <Skeleton className="col-span-1 h-6 w-12 rounded-full" />
            <Skeleton className="col-span-1 h-8 w-8 rounded-md justify-self-end" />
          </div>
        </div>
      ))}
    </>
  );
}

function ColaboradoresTable({
  colaboradores,
  shouldBlur,
  blurClass,
  onEdit,
  onDelete,
}: {
  colaboradores: ColaboradorListItem[];
  shouldBlur: (_value: string | null | undefined) => boolean;
  blurClass: string;
  onEdit: (_colaborador: ColaboradorListItem) => void;
  onDelete: (_colaborador: ColaboradorListItem) => void;
}) {
  if (colaboradores.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">Nenhum colaborador encontrado</div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Colaborador</div>
          <div className="col-span-2 text-center">CPF</div>
          <div className="col-span-2 text-center">E-mail</div>
          <div className="col-span-2 text-center">Telefone</div>
          <div className="col-span-1 text-center">Função</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">Ações</div>
        </div>
      </div>
      <div className="divide-y">
        {colaboradores.map((colaborador) => {
          const initials = formatInitials(colaborador.nome ?? '');
          const status = getStatusBadgeProps(colaborador.status);
          const cpfMasked = maskCpf(colaborador.cpf ?? '');

          return (
            <div
              key={colaborador.id}
              className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {colaborador.foto ? (
                      <AvatarImage
                        src={colaborador.foto}
                        alt={colaborador.nome ?? ''}
                        draggable={false}
                        onError={(event) => {
                          const el = event.currentTarget as HTMLImageElement;
                          el.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div
                      className="font-normal text-gray-900 text-[13px] truncate"
                      data-testid={`colaborador-nome-${colaborador.id}`}
                    >
                      {colaborador.nome}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {colaborador.especialidade && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {colaborador.especialidade}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-[13px] text-gray-700 text-center">
                  <span className={shouldBlur(colaborador.cpf) ? blurClass : 'leading-[20px]'}>
                    {colaborador.cpf ? cpfMasked : '-'}
                  </span>
                </div>
                <div
                  className="col-span-2 text-[13px] text-gray-700 text-center"
                  title={colaborador.email ?? ''}
                >
                  {shouldBlur(colaborador.email) ? (
                    <span className={blurClass}>{colaborador.email ?? '-'}</span>
                  ) : (
                    <span className="inline-block max-w-full truncate leading-[20px]">
                      {colaborador.email ?? '-'}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-[13px] text-gray-700 text-center">
                  <span
                    className={shouldBlur(colaborador.telefone1) ? blurClass : 'leading-[20px]'}
                  >
                    {colaborador.telefone1 || '-'}
                  </span>
                </div>
                <div className="col-span-1 text-center">
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {formatCargo(colaborador.cargo)}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Badge variant="outline" className={`text-xs ${status.className}`}>
                    {status.label}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    aria-label="Editar colaborador"
                    onClick={() => onEdit(colaborador)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Excluir colaborador"
                    onClick={() => onDelete(colaborador)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// (Pagination e IconButton locais removidos; usando componente compartilhado.)

function mapToColaboradorEdit(colaborador: ColaboradorListItem): ColaboradorEdit {
  return {
    id: colaborador.id,
    nome: colaborador.nome ?? '',
    nomeSocial: null,
    foto: colaborador.foto ?? null,
    dataNasc: null,
    genero: null,
    cpf: colaborador.cpf ?? null,
    rg: null,
    orgaoEmissor: null,
    dataEmissao: null,
    email: colaborador.email ?? null,
    telefone1: colaborador.telefone1 ?? null,
    contatoEmergenciaTelefone: null,
    enderecoCep: null,
    enderecoLogradouro: null,
    enderecoNumero: null,
    enderecoComplemento: null,
    enderecoBairro: null,
    enderecoCidade: null,
    enderecoUf: null,
    cargo: (colaborador.cargo as ColaboradorEdit['cargo']) ?? 'OUTRO',
    especialidade: colaborador.especialidade ?? null,
    status: colaborador.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
    dataAdmissao: null,
    dataDesligamento: null,
    observacoes: null,
    salario: null,
    temAcesso: null,
    roleUsuario: '',
  };
}

export default ColaboradoresFeature;
