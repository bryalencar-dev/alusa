'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { StatusFinanceiroBadge } from '@/components/matriculas/StatusFinanceiroBadge';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar, {
  type StatusValue,
  type SortOrder as SortOrderEF,
} from '@/components/layout/EntityFiltersBar';
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import Pagination from '@/components/layout/Pagination';
import StatusBadge from '@/components/shared/StatusBadge';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import { maskCpf } from '@alusa/lib';
import useCurrentUser from '@/hooks/use-current-user';
import { useMatriculas } from './hooks/use-matriculas';
import type {
  MatriculaListItem as BaseMatriculaListItem,
  MatriculaStatus,
} from './services/matriculas-service';
import { StatusFinanceiro } from '@prisma/client';

interface MatriculaListItem extends BaseMatriculaListItem {
  statusFinanceiro?: StatusFinanceiro;
}
import MatriculaWizardDialog from '@/components/matriculas/MatriculaWizardDialog';
import type { MatriculaCreatedPayload } from './services/matriculas-service';
import toast from 'react-hot-toast';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MatriculasFeature() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null; // já normalizado pelo hook

  console.log('[MatriculasFeature] Renderizando com:', {
    userId: user?.id,
    contaId,
    userRole: user?.role,
  });

  const [search, setSearch] = useState('');
  const [statusValue, setStatusValue] = useState<StatusValue>('TODOS');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<MatriculaListItem | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrderEF>('DESC');

  const statusFilter = useMemo(() => {
    if (statusValue === 'ATIVO') return 'ATIVA' as MatriculaStatus;
    if (statusValue === 'INATIVO') return ['CANCELADA', 'CONCLUIDA'] as MatriculaStatus[];
    return undefined;
  }, [statusValue]);

  const { items, loading, page, pageSize, total, setPage, reload, cancel } = useMatriculas({
    contaId,
    search: search || undefined,
    status: statusFilter,
  });

  const columns: DataTableColumn<MatriculaListItem>[] = useMemo(
    () => [
      // 1. Aluno
      {
        id: 'aluno',
        header: 'Aluno',
        align: 'left',
        width: 'w-[18%]',
        render: (m) => (
          <span className="font-medium text-gray-900 truncate max-w-[180px] block">
            {m.aluno.nome || '—'}
          </span>
        ),
      },
      // 2. CPF
      {
        id: 'cpf',
        header: 'CPF',
        align: 'left',
        width: 'w-[12%]',
        render: (m) => (
          <span className="text-gray-700 text-sm">{m.aluno.cpf ? maskCpf(m.aluno.cpf) : '—'}</span>
        ),
      },
      // 3. Turma / Combo
      {
        id: 'turma-combo',
        header: 'Turma/Combo',
        align: 'left',
        width: 'w-[18%]',
        render: (m) => (
          <span className="text-gray-700 text-sm truncate max-w-[180px] block">
            {m.combo?.nome || m.turma?.nome || '—'}
          </span>
        ),
      },
      // 4. Plano
      {
        id: 'plano',
        header: 'Plano',
        align: 'left',
        width: 'w-[18%]',
        render: (m) => (
          <div className="flex flex-col leading-tight">
            <span className="text-gray-800 text-sm font-medium truncate max-w-[180px]">
              {m.plano.nome}
            </span>
            <span className="text-xs text-gray-500">{currency.format(m.plano.valor)}</span>
          </div>
        ),
      },
      // 5. Situação Financeira
      {
        id: 'financeiro',
        header: 'Situação Financeira',
        align: 'center',
        width: 'w-[14%]',
        render: (m) =>
          m.statusFinanceiro ? (
            <StatusFinanceiroBadge status={m.statusFinanceiro} />
          ) : (
            <span className="text-xs text-gray-500">—</span>
          ),
      },
      // 6. Status
      {
        id: 'status',
        header: 'Status',
        align: 'center',
        width: 'w-[10%]',
        render: (m) => <StatusBadge status={m.status} />,
      },
      // 7. Ações
      {
        id: 'acoes',
        header: 'Ações',
        align: 'right',
        width: 'w-[10%]',
        render: (m) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ações">
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => console.log('ver detalhes', m.id)}>
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={m.status !== 'ATIVA'}
                onClick={() => setCancelTarget(m)}
                className="text-red-600 focus:text-red-700"
              >
                Cancelar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => console.log('reenviar cobrança', m.id)}
                disabled={!m.cobrancas.length}
              >
                Reenviar cobrança
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [setCancelTarget],
  );

  // Se não houver contaId, mostrar mensagem
  if (!contaId) {
    console.log('[MatriculasFeature] Aguardando contaId do usuário (ainda null)');
    return (
      <TableLayout
        title="Gestão de Matrículas"
        subtitle="Acompanhe matrículas, cobranças e vínculos de turmas em tempo real."
      >
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500">Carregando informações do usuário...</p>
        </div>
      </TableLayout>
    );
  }

  return (
    <TableLayout
      title="Gestão de Matrículas"
      subtitle="Acompanhe matrículas, cobranças e vínculos de turmas em tempo real."
      actions={
        <Button
          onClick={() => setWizardOpen(true)}
          className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
          aria-label="Cadastrar matrícula"
          disabled={!contaId}
        >
          Nova matrícula
        </Button>
      }
      filtersBar={
        <EntityFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          statusValue={statusValue}
          onStatusChange={(value) => setStatusValue(value)}
          sortOrder={sortOrder}
          onSortChange={(value) => setSortOrder(value)}
          searchPlaceholder="Buscar por aluno, plano ou turma..."
        />
      }
      footer={<Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} />}
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        <DataTable
          data={items}
          columns={columns}
          rowKey={(item) => item.id}
          loading={loading}
          emptyMessage={
            <div className="px-6 py-12 text-center text-gray-500">Nenhuma matrícula encontrada</div>
          }
          skeletonRows={6}
        />
      </div>

      <MatriculaWizardDialog
        open={wizardOpen}
        contaId={contaId ?? undefined}
        onOpenChange={(open: boolean) => {
          console.log('[MatriculasFeature] Dialog estado mudou:', open);
          setWizardOpen(open);
          if (!open) {
            console.log('[MatriculasFeature] Dialog fechado, recarregando listagem...');
            reload();
          }
        }}
        onCreated={(payload: MatriculaCreatedPayload) => {
          console.log('[MatriculasFeature] Matrícula criada callback:', payload.matricula.id);
          toast.success(
            `Matrícula criada com sucesso. Total ${currency.format(payload.preco.total)}`,
          );
          console.log('[MatriculasFeature] Forçando reload da listagem...');
          reload();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancelar matrícula"
        description={
          cancelTarget ? (
            <span>
              Tem certeza que deseja cancelar a matrícula de
              <strong> {cancelTarget.aluno.nome ?? 'Aluno'} </strong>?
            </span>
          ) : (
            'Tem certeza que deseja cancelar esta matrícula?'
          )
        }
        confirmLabel="Cancelar matrícula"
        cancelLabel="Manter ativa"
        loadingLabel="Cancelando..."
        onConfirm={async () => {
          if (!cancelTarget) return;
          try {
            await cancel(cancelTarget.id);
            toast.success('Matrícula cancelada com sucesso.');
          } catch (error) {
            toast.error((error as Error).message || 'Falha ao cancelar matrícula.');
            throw error;
          } finally {
            setCancelTarget(null);
            void reload();
          }
        }}
      />
    </TableLayout>
  );
}
