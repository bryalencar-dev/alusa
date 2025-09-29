'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
// (Busca agora controlada pelo EntityFiltersBar; Input removido)
// Removido select custom inline (usaremos EntityFiltersBar)
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, Edit3, Eye, EyeOff } from '@/components/icons/icons';
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
import { getStatusBadgeProps } from '@/lib/status';
import { formatFirstLast, formatInitials, maskCpf } from '@alusa/lib';
import { useDeleteDialog } from '@/hooks/use-delete-dialog';
import { useEditDialog } from '@/hooks/use-edit-dialog';
import useCurrentUser from '@/hooks/use-current-user';
import { useAlunos } from './hooks/use-alunos';
import { useEntityListFiltering } from '@/hooks/entity/use-entity-list-filtering';
import type { AlunoListItem } from './services/alunos-service';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

type SortOrder = 'ASC' | 'DESC';
type StatusFilter = StatusValue;

type BlurPredicate = (_value: string | null | undefined) => boolean;

interface AlunosTableProps {
  alunos: AlunoListItem[];
  shouldBlur: BlurPredicate;
  blurClass: string;
  onEdit: (_aluno: AlunoListItem) => void;
  onDelete: (_aluno: AlunoListItem) => void;
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
        {loading || userLoading ? (
          <TableSkeleton />
        ) : (
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
          />
        )}
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

function TableSkeleton() {
  return (
    <>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-12 gap-4">
          <Skeleton className="col-span-3 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-3 h-4" />
          <Skeleton className="col-span-2 h-4" />
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
            <Skeleton className="col-span-3 h-4 w-56" />
            <Skeleton className="col-span-2 h-4 w-32" />
            <Skeleton className="col-span-1 h-6 w-12 rounded-full" />
            <Skeleton className="col-span-1 h-8 w-8 rounded-md justify-self-end" />
          </div>
        </div>
      ))}
    </>
  );
}

function AlunosTable({ alunos, shouldBlur, blurClass, onEdit, onDelete }: AlunosTableProps) {
  if (alunos.length === 0) {
    return <div className="px-6 py-12 text-center text-gray-500">Nenhum aluno encontrado</div>;
  }

  return (
    <>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Aluno</div>
          <div className="col-span-2 text-center">CPF</div>
          <div className="col-span-3 text-center">E-mail</div>
          <div className="col-span-2 text-center">Telefone</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-center">Ações</div>
        </div>
      </div>
      <div className="divide-y">
        {alunos.map((aluno) => {
          const initials = formatInitials(aluno.nome ?? '');
          const status = getStatusBadgeProps(aluno.status ?? 'ATIVO');
          const cpfMasked = maskCpf(aluno.cpf ?? '');

          return (
            <div key={aluno.id} className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3 flex items-center gap-3">
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
                <div className="col-span-2 text-[13px] text-gray-700 text-center">
                  <span className={shouldBlur(aluno.cpf) ? blurClass : 'leading-[20px]'}>
                    {aluno.cpf ? cpfMasked : '-'}
                  </span>
                </div>
                <div
                  className="col-span-3 text-[13px] text-gray-700 text-center"
                  title={aluno.email ?? ''}
                >
                  {shouldBlur(aluno.email) ? (
                    <span className={blurClass}>{aluno.email ?? '-'}</span>
                  ) : (
                    <span className="inline-block max-w-full truncate leading-[20px]">
                      {aluno.email ?? '-'}
                    </span>
                  )}
                </div>
                <div className="col-span-2 text-[13px] text-gray-700 text-center">
                  <span className={shouldBlur(aluno.telefone) ? blurClass : 'leading-[20px]'}>
                    {aluno.telefone || '-'}
                  </span>
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
                    aria-label="Editar aluno"
                    onClick={() => onEdit(aluno)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Excluir aluno"
                    onClick={() => onDelete(aluno)}
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
