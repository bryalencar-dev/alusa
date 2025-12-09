'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
// (Busca agora controlada pelo EntityFiltersBar; Input removido)
// Removido select custom inline (usaremos EntityFiltersBar)
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Skeleton manual substituído pelos skeletons do DataTable
import { Plus, Eye, EyeOff } from '@/components/icons/icons';
// Dropdown de ordenação substituído pelo EntityFiltersBar
import AlunoWizardDialog from '@/components/alunos/AlunoWizardDialog';
import { AlunoEditDialog, type EditAluno } from '@/components/alunos/AlunoEditDialog';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import ReasonField from '@/components/shared/ReasonField';
import TableLayout from '@/components/layout/TableLayout';
import Pagination from '@/components/layout/Pagination';
import EntityFiltersBar, {
  type StatusValue,
  type SortOrder as SortOrderEF,
} from '@/components/layout/EntityFiltersBar';
// getStatusBadgeProps substituído pelo componente StatusBadge
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatFirstLast, formatInitials, maskCpf } from '@alusa/lib';
import { useDeleteDialog } from '@/hooks/use-delete-dialog';
import { useEditDialog } from '@/hooks/use-edit-dialog';
import useCurrentUser from '@/hooks/use-current-user';
import { useAlunos } from './hooks/use-alunos';
import { useEntityListFiltering } from '@/hooks/entity/use-entity-list-filtering';
import type { AlunoListItem } from './services/alunos-service';
import toast from 'react-hot-toast';
import { statusColumn, actionsColumn } from '@alusa/ui/datatable/columns';

const PAGE_SIZE = 6;

type SortOrder = 'ASC' | 'DESC';
type StatusFilter = StatusValue;

type BlurPredicate = (_value: string | null | undefined) => boolean;

interface AlunosTableProps {
  alunos: AlunoListItem[];
  shouldBlur: BlurPredicate;
  blurClass: string;
  onEdit: (_aluno: AlunoListItem) => void;
  onDelete: (_aluno: AlunoListItem) => void;
  loading: boolean;
}

// Paginação unificada via componente compartilhado

export function AlunosFeature() {
  const { user, loading: userLoading } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const { items, loading, reload, remove } = useAlunos({ contaId });
  const editDialog = useEditDialog<EditAluno>();
  const deleteDialog = useDeleteDialog<AlunoListItem>({
    onDelete: async (aluno, reason) => {
      await remove({ id: aluno.id, reason });
      try {
        window.dispatchEvent(new CustomEvent('alunos:changed'));
      } catch {
        /* noop */
      }
    },
  });

  const refresh = useCallback(() => {
    void reload();
  }, [reload]);

  const [hideSensitive, setHideSensitive] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC'); // manter para interface com EntityFiltersBar
  // Hook reutilizável para filtragem, busca, status, paginação e ordenação
  const {
    search: searchTerm,
    setSearch: setSearchTerm,
    status: statusFilter,
    setStatus: setStatusFilter,
    sort,
    setSort,
    page,
    setPage,
    setPageSize,
    ordered,
    paginated,
    resetFilters,
  } = useEntityListFiltering({
    items,
    nameAccessor: (a: AlunoListItem) => a.nome ?? '',
    statusAccessor: (a: AlunoListItem) => (a.status as StatusFilter) ?? 'ATIVO',
    searchPredicate: (a: AlunoListItem, term, digits) => {
      const nome = (a.nome || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      const cpfDigits = (a.cpf || '').replace(/\D/g, '');
      const matchNome = nome.includes(term);
      const matchEmail = email.includes(term);
      const matchCpf = Boolean(digits && cpfDigits.includes(digits));
      return matchNome || matchEmail || matchCpf;
    },
    initialSort: 'ASC',
  });
  const [wizardOpen, setWizardOpen] = useState(false);

  // Definir PAGE_SIZE no hook
  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [setPageSize]);

  useEffect(() => {
    const handler = () => {
      refresh();
    };
    window.addEventListener('alunos:changed', handler);
    return () => window.removeEventListener('alunos:changed', handler);
  }, [refresh]);

  // Manter sortOrder sincronizado para compatibilidade existente
  useEffect(() => {
    setSort(sortOrder);
  }, [sortOrder, setSort]);
  useEffect(() => {
    setSortOrder(sort);
  }, [sort]);

  const shouldBlur = (value: string | undefined | null) =>
    Boolean(hideSensitive && value && value !== '-');
  const blurClass = 'inline-block filter blur-[3px] px-1 -mx-1 py-0.5 -my-0.5 leading-[20px]';

  return (
    <TableLayout
      title="Gestão de Alunos"
      subtitle="Gerencie cadastros, status e informações dos alunos."
      actions={
        <>
          <Button
            onClick={() => setWizardOpen(true)}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
            aria-label="Cadastrar aluno"
            data-testid="abrir-wizard-aluno"
            disabled={!contaId}
          >
            <Plus className="h-4 w-4 mr-2 transition-none" />
            Cadastrar aluno
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
        <AlunosTable
          alunos={paginated}
          shouldBlur={shouldBlur}
          blurClass={blurClass}
          onEdit={(aluno) => {
            editDialog.openDialog(mapToEditAluno(aluno));
          }}
          onDelete={(aluno) => {
            deleteDialog.openDialog(aluno);
          }}
          loading={loading || userLoading}
        />
      </div>

      {/* Paginação removida daqui e movida para footer do TableLayout */}
      <AlunoWizardDialog
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) refresh();
        }}
        onFinish={() => {
          resetFilters();
          refresh();
        }}
        contaId={contaId ?? undefined}
      />

      <AlunoEditDialog
        open={editDialog.open}
        onOpenChange={(open) => {
          editDialog.onOpenChange(open);
          if (!open) refresh();
        }}
        aluno={editDialog.entity}
        onSaved={() => {
          editDialog.closeDialog();
          refresh();
        }}
      />

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Excluir aluno"
        description={(() => {
          if (!deleteDialog.entity) {
            return 'Tem certeza que deseja excluir este aluno? Esta ação é permanente.';
          }
          const rawName = deleteDialog.entity.nome ?? '';
          const shortName = formatFirstLast(rawName) || rawName || 'este aluno';
          return (
            <span>
              Tem certeza que deseja excluir <strong>{shortName}</strong>? Esta ação é permanente.
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
            toast.success('Aluno excluído');
            await reload();
          } catch (error) {
            toast.error((error as Error).message || 'Erro ao excluir aluno');
          }
        }}
      >
        <ReasonField
          id="aluno-delete-reason"
          value={deleteDialog.reason}
          onChange={(event) => deleteDialog.setReason(event.target.value)}
        />
      </ConfirmDeleteDialog>
    </TableLayout>
  );
}

function AlunosTable({
  alunos,
  shouldBlur,
  blurClass,
  onEdit,
  onDelete,
  loading,
}: AlunosTableProps) {
  const columns: DataTableColumn<AlunoListItem>[] = [
    {
      id: 'aluno',
      header: 'Aluno',
      width: 'w-1/4', // 25%
      align: 'left',
      noWrap: false,
      skeleton: (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="flex gap-2">
              <div className="h-4 w-12 bg-gray-200 rounded" />
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ),
      render: (aluno) => {
        const initials = formatInitials(aluno.nome ?? '');
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10">
              {aluno.foto ? <AvatarImage src={aluno.foto} alt={aluno.nome ?? ''} /> : null}
              <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div
                className="font-normal text-gray-900 text-[13px] truncate"
                data-testid={`aluno-nome-${aluno.id}`}
              >
                {aluno.nome}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {aluno.isentoTaxaMatricula && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                  >
                    Isento
                  </Badge>
                )}
                {aluno.bolsaDescontoPercent && Number(aluno.bolsaDescontoPercent) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    Bolsa {aluno.bolsaDescontoPercent}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'cpf',
      header: 'CPF',
      width: 'w-1/6', // ~16.66%
      align: 'center',
      render: (aluno) => {
        const cpfMasked = maskCpf(aluno.cpf ?? '');
        return (
          <span
            className={shouldBlur(aluno.cpf) ? blurClass : 'leading-[20px]'}
            title={aluno.cpf ?? undefined}
          >
            {aluno.cpf ? cpfMasked : '-'}
          </span>
        );
      },
      skeleton: <div className="h-4 w-24 bg-gray-200 rounded" />,
    },
    {
      id: 'email',
      header: 'E-mail',
      width: 'w-1/4',
      align: 'left',
      render: (aluno) =>
        shouldBlur(aluno.email) ? (
          <span className={blurClass}>{aluno.email ?? '-'}</span>
        ) : (
          <span
            className="inline-block max-w-full truncate leading-[20px]"
            title={aluno.email ?? ''}
          >
            {aluno.email ?? '-'}
          </span>
        ),
      skeleton: <div className="h-4 w-40 bg-gray-200 rounded" />,
    },
    {
      id: 'telefone',
      header: 'Telefone',
      width: 'w-1/6',
      align: 'center',
      render: (aluno) => (
        <span className={shouldBlur(aluno.telefone) ? blurClass : 'leading-[20px]'}>
          {aluno.telefone || '-'}
        </span>
      ),
      skeleton: <div className="h-4 w-24 bg-gray-200 rounded mx-auto" />,
    },
    statusColumn<AlunoListItem>({
      render: (aluno: AlunoListItem) => (
        <StatusBadge status={aluno.status === 'ATIVO' ? 'ATIVO' : 'INATIVO'} />
      ),
    }),
    actionsColumn<AlunoListItem>({
      onEdit,
      onDelete,
      editButtonAriaLabel: (aluno: AlunoListItem) => `Editar aluno ${aluno.nome ?? ''}`,
      deleteButtonAriaLabel: (aluno: AlunoListItem) => `Excluir aluno ${aluno.nome ?? ''}`,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={alunos}
      rowKey={(a) => a.id}
      loading={loading}
      skeletonRows={5}
      emptyMessage={
        <div className="px-6 py-12 text-center text-gray-500">Nenhum aluno encontrado</div>
      }
      ariaLabel="Tabela de alunos"
    />
  );
}

// (Pagination local removida; usando componente compartilhado.)

function mapToEditAluno(aluno: AlunoListItem): EditAluno {
  const bolsa = aluno.bolsaDescontoPercent;
  let bolsaNumber: number | null = null;
  if (typeof bolsa === 'number') bolsaNumber = bolsa;
  if (typeof bolsa === 'string') {
    const normalized = Number(bolsa.replace(',', '.'));
    bolsaNumber = Number.isFinite(normalized) ? normalized : null;
  }

  return {
    id: aluno.id,
    nome: aluno.nome,
    nomeSocial: null,
    dataNasc: null,
    cpf: aluno.cpf ?? null,
    email: aluno.email ?? null,
    telefone: aluno.telefone ?? null,
    foto: aluno.foto ?? null,
    enderecoCep: null,
    enderecoLogradouro: null,
    enderecoNumero: null,
    enderecoComplemento: null,
    enderecoBairro: null,
    enderecoCidade: null,
    enderecoUf: null,
    observacao: null,
    genero: null,
    modalidadePrincipal: null,
    nivel: null,
    alergias: null,
    restricoesMedicas: null,
    contatoEmergenciaNome: null,
    contatoEmergenciaTelefone: null,
    origemCadastro: null,
    bolsaDescontoPercent: bolsaNumber,
    isentoTaxaMatricula: aluno.isentoTaxaMatricula ?? null,
    consentimentoImagem: aluno.consentimentoImagem ?? null,
    dataConsentimentoImagem: aluno.dataConsentimentoImagem ?? null,
    consentimentoComunicacoes: null,
    tamanhoCamiseta: null,
    tamanhoCalcado: null,
    codigoInterno: null,
    tags: Array.isArray(aluno.tags) ? aluno.tags : null,
    status: aluno.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
    responsavel: null,
  } as EditAluno;
}

export default AlunosFeature;
