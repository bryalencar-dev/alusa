'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomScrollArea } from '@/components/ui/custom-scroll-area';
import {
  EyeIcon,
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar, {
  type StatusValue,
  type SortOrder as SortOrderEF,
} from '@/components/layout/EntityFiltersBar';
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import Pagination from '@/components/layout/Pagination';
import { StatusBadge, type StatusType } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import useCurrentUser from '@/hooks/use-current-user';
import { useMatriculas } from './hooks/use-matriculas';
import {
  updateMatriculaStatusRequest,
  resendCobrancaRequest,
  type MatriculaListItem,
  type MatriculaStatus,
  type MatriculaCreatedPayload,
  type MatriculaStatusSyncData,
  type ResendCobrancaData,
  type MatriculaCobrancaStatus,
} from './services/matriculas-service';
import MatriculaWizardDialog from '@/components/matriculas/MatriculaWizardDialog';
import { MatriculaDetalhesDialog } from './components/MatriculaDetalhesDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import { cn } from '@/lib/cn';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const COBRANCA_BLOCKING_STATUSES: MatriculaCobrancaStatus[] = [
  'PENDENTE',
  'PROCESSANDO',
  'ATRASADO',
  'PAGO',
];

interface MatriculasFeatureProps {
  initialTurmaId?: string;
}

export default function MatriculasFeature({ initialTurmaId }: MatriculasFeatureProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const [search, setSearch] = useState('');
  const [statusValue, setStatusValue] = useState<StatusValue>('TODOS');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<MatriculaListItem | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<MatriculaListItem | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrderEF>('DESC');
  const [actionLoading, setActionLoading] = useState(false);
  const [taxaDialogOpen, setTaxaDialogOpen] = useState(false);
  const [selectedTaxaMatricula, setSelectedTaxaMatricula] = useState<MatriculaListItem | null>(
    null,
  );
  const [taxaResendResult, setTaxaResendResult] = useState<ResendCobrancaData | null>(null);
  const [copyingPix, setCopyingPix] = useState(false);
  const [loadingTaxaLinks, setLoadingTaxaLinks] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MatriculaListItem | null>(null);

  const statusFilter = useMemo(() => {
    if (statusValue === 'ATIVO') return 'ATIVA' as MatriculaStatus;
    if (statusValue === 'INATIVO') return ['CANCELADA', 'CONCLUIDA'] as MatriculaStatus[];
    return undefined;
  }, [statusValue]);

    const { items, loading, page, pageSize, total, setPage, reload } = useMatriculas({
    contaId,
    status: statusFilter,
    search,
    turmaId: initialTurmaId,
  });

  const composeStatusToast = useCallback(
    (baseDescription: string, info: MatriculaStatusSyncData, extras: string[] = []) => {
      const expectedMessage = info.paymentSync.expectedWebhooks.length
        ? `Webhooks aguardados: ${info.paymentSync.expectedWebhooks.join(', ')}.`
        : 'Nenhum webhook pendente; acompanhe pelo painel financeiro.';
      const warningMessage = info.paymentSync.warnings[0] ?? '';
      return [baseDescription, ...extras, warningMessage, expectedMessage]
        .filter((part) => part && part.trim().length > 0)
        .join(' ');
    },
    [],
  );

  const handleCopyPix = useCallback(async (pixValue: string) => {
    if (!pixValue) return;
    try {
      setCopyingPix(true);
      await navigator.clipboard.writeText(pixValue);
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="PIX copiado"
          description="Código copiado para a área de transferência."
          onClose={() => toast.dismiss(t)}
        />
      ));
    } catch (error) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao copiar PIX"
          description={(error as Error).message || 'Não foi possível copiar o código copia e cola no momento.'}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } finally {
      setCopyingPix(false);
    }
  }, []);

  // Carrega os links automaticamente quando abre o modal com taxa pendente
  useEffect(() => {
    const loadTaxaLinks = async () => {
      if (!taxaDialogOpen || !selectedTaxaMatricula || taxaResendResult || loadingTaxaLinks) {
        return;
      }

      const taxaCobranca = selectedTaxaMatricula.cobrancas.find((c) => c.tipo === 'TAXA_MATRICULA');
      if (!taxaCobranca) return;

      const statusPendentes = ['PENDENTE', 'PROCESSANDO', 'ATRASADO'];
      if (!statusPendentes.includes(taxaCobranca.status)) return;

      try {
        setLoadingTaxaLinks(true);
        const response = await resendCobrancaRequest(taxaCobranca.id);
        setTaxaResendResult(response.data);
      } catch (error) {
        console.error('[TAXA_LINKS] Erro ao carregar links:', error);
      } finally {
        setLoadingTaxaLinks(false);
      }
    };

    void loadTaxaLinks();
  }, [taxaDialogOpen, selectedTaxaMatricula, taxaResendResult, loadingTaxaLinks]);

  const formatTaxaStatus = useCallback((status?: MatriculaCobrancaStatus | null) => {
    if (!status) return '—';
    return status
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  /**
   * Handlers para ações de matrícula
   */
  const handlePausarMatricula = useCallback(
    async (matricula: MatriculaListItem) => {
      if (actionLoading) return;

      try {
        setActionLoading(true);
        const response = await updateMatriculaStatusRequest({
          id: matricula.id,
          status: 'PAUSADA',
        });
        const description = composeStatusToast('Matrícula pausada com sucesso.', response.data);
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Matrícula pausada"
            description={description}
            onClose={() => toast.dismiss(t)}
          />
        ));
        await reload();
      } catch (error) {
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Erro ao pausar"
            description={(error as Error).message || 'Não foi possível pausar a matrícula.'}
            onClose={() => toast.dismiss(t)}
          />
        ));
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, composeStatusToast, reload],
  );

  const handleRetomarMatricula = useCallback(
    async (matricula: MatriculaListItem) => {
      if (actionLoading) return;

      try {
        setActionLoading(true);
        const response = await updateMatriculaStatusRequest({ id: matricula.id, status: 'ATIVA' });
        const nextDueDateMessage = response.data.nextDueDate
          ? `Próximo vencimento estimado em ${dateFormatter.format(new Date(response.data.nextDueDate))}.`
          : '';
        const description = composeStatusToast(
          'A assinatura foi reativada no Asaas.',
          response.data,
          nextDueDateMessage ? [nextDueDateMessage] : [],
        );
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Matrícula retomada"
            description={description}
            onClose={() => toast.dismiss(t)}
          />
        ));
        await reload();
      } catch (error) {
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Erro ao retomar"
            description={(error as Error).message || 'Não foi possível retomar a matrícula.'}
            onClose={() => toast.dismiss(t)}
          />
        ));
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading, composeStatusToast, reload],
  );

  const handleCancelarMatricula = useCallback(
    async (matricula: MatriculaListItem) => {
      if (actionLoading) return;

      try {
        setActionLoading(true);
        const response = await updateMatriculaStatusRequest({
          id: matricula.id,
          status: 'CANCELADA',
        });
        const description = composeStatusToast(
          'A assinatura foi cancelada e os webhooks do Asaas atualizarão as cobranças automaticamente.',
          response.data,
        );
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Matrícula cancelada"
            description={description}
            onClose={() => toast.dismiss(t)}
          />
        ));
        await reload();
      } catch (error) {
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Erro ao cancelar"
            description={(error as Error).message || 'Não foi possível cancelar a matrícula.'}
            onClose={() => toast.dismiss(t)}
          />
        ));
      } finally {
        setActionLoading(false);
        setCancelTarget(null);
      }
    },
    [actionLoading, composeStatusToast, reload],
  );


  const handleDeletarMatricula = useCallback(
    async (matricula: MatriculaListItem) => {
      if (actionLoading) {
        console.log('[DELETE] Ação já em andamento, ignorando...');
        return;
      }

      console.log('[DELETE] Iniciando exclusão:', {
        matriculaId: matricula.id,
        alunoNome: matricula.aluno.nome,
        totalCobrancas: matricula.cobrancas.length,
        contaId,
      });

      try {
        setActionLoading(true);
        const url = `/api/matriculas/${matricula.id}?contaId=${contaId}`;
        console.log('[DELETE] Chamando API:', url);

        const response = await fetch(url, {
          method: 'DELETE',
        });

        console.log('[DELETE] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[DELETE] Erro da API:', errorData);
          const errorCode = (
            errorData as { error?: { code?: string; message?: string; details?: unknown } }
          ).error?.code;
          if (errorCode === 'COBRANCAS_PENDENTES') {
            const bloqueantes = (
              errorData as {
                error?: {
                  details?: {
                    cobrancasBloqueantes?: Array<{ status?: string; vencimento?: string }>;
                  };
                };
              }
            ).error?.details?.cobrancasBloqueantes;
            let detalheMensagem = '';
            if (Array.isArray(bloqueantes) && bloqueantes.length > 0) {
              const preventivo = bloqueantes
                .slice(0, 3)
                .map((item) => {
                  const statusLabel =
                    formatTaxaStatus(item.status as MatriculaCobrancaStatus | undefined) ||
                    'Pendente';
                  const vencimento = item.vencimento
                    ? dateFormatter.format(new Date(item.vencimento))
                    : 'sem vencimento';
                  return `${statusLabel} (venc. ${vencimento})`;
                })
                .join(', ');
              detalheMensagem = ` Cobranças bloqueantes: ${preventivo}.`;
            }
            throw new Error(
              (errorData as { error?: { message?: string } }).error?.message ||
                `Finalize ou cancele as cobranças pendentes antes de excluir.${detalheMensagem}`,
            );
          }
          throw new Error(
            (errorData as { error?: { message?: string } }).error?.message ||
              'Erro ao excluir matrícula',
          );
        }

        const result = await response.json();
        console.log('[DELETE] Sucesso:', result);

        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Matrícula excluída"
            description="A assinatura e os dados locais foram removidos."
            onClose={() => toast.dismiss(t)}
          />
        ));
        await reload();
      } catch (error) {
        console.error('[DELETE] Erro ao excluir:', error);
        toast.custom((t) => (
          <CustomToast
            variant="error"
            title="Erro ao excluir"
            description={(error as Error).message || 'Não foi possível excluir esta matrícula.'}
            onClose={() => toast.dismiss(t)}
          />
        ));
      } finally {
        setActionLoading(false);
        setDeleteTarget(null);
      }
    },
    [actionLoading, contaId, reload, formatTaxaStatus],
  );

  // Abre o comprovante EXACT do Asaas (transactionReceiptUrl > invoiceUrl)
  const handleAbrirComprovante = useCallback(async (cobrancaId: string) => {
    try {
      const res = await fetch(`/api/cobrancas/${cobrancaId}`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { asaasData?: { transactionReceiptUrl?: string; invoiceUrl?: string } };
      };
      const receipt = json?.data?.asaasData?.transactionReceiptUrl;
      const invoice = json?.data?.asaasData?.invoiceUrl;
      const url = receipt || invoice;
      if (url) {
        window.open(url, '_blank');
        return;
      }
      // Fallback para página da cobrança (tem botão de visualizar comprovante)
      window.open(`/cobrancas/${cobrancaId}`, '_blank');
    } catch (error) {
      // Fallback silencioso
      window.open(`/cobrancas/${cobrancaId}`, '_blank');
    }
  }, []);

  const columns: DataTableColumn<MatriculaListItem>[] = useMemo(
    () => [
      // 1. Aluno (clicável para ir para detalhes)
      {
        id: 'aluno',
        header: 'Aluno',
        align: 'left',
        width: 'w-[22%]',
        render: (m) => (
          <button
            onClick={() => window.location.href = `/matriculas/${m.id}`}
            className="flex flex-col leading-tight text-left hover:bg-gray-50 w-full p-2 -m-2 rounded transition-colors"
          >
            <span className="font-medium text-gray-900 truncate max-w-[220px]">
              {m.aluno.nome || '—'}
            </span>
            <span className="text-xs text-gray-500 mt-0.5">
              {m.aluno.cpf
                ? `CPF: ${m.aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`
                : 'Sem CPF'}
            </span>
          </button>
        ),
      },
      // 2. Turma / Combo
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
      // 3. Plano
      {
        id: 'plano',
        header: 'Plano',
        align: 'left',
        width: 'w-[15%]',
        render: (m) => (
          <div className="flex flex-col leading-tight">
            <span className="text-gray-800 text-sm font-medium truncate max-w-[180px]">
              {m.plano?.nome ?? (m.combo ? `Combo: ${m.combo.nome}` : '—')}
            </span>
            {m.plano ? (
              <span className="text-xs text-gray-500">{currency.format(m.plano.valor)}</span>
            ) : null}
          </div>
        ),
      },
      // 4. Taxa de Matrícula (clicável)
      {
        id: 'taxa',
        header: 'Taxa de Matrícula',
        align: 'center',
        width: 'w-[15%]',
        render: (m) => {
          const taxaCobranca = m.cobrancas.find((c) => c.tipo === 'TAXA_MATRICULA');

          if (m.taxaIsenta) {
            return (
              <Badge variant="outline" className="text-xs">
                Isento
              </Badge>
            );
          }

          if (!taxaCobranca) {
            return <span className="text-xs text-gray-500">Taxa não gerada</span>;
          }

          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 hover:bg-gray-100"
              onClick={() => {
                setSelectedTaxaMatricula(m);
                setTaxaResendResult(null);
                setTaxaDialogOpen(true);
              }}
              data-testid={`matricula-taxa-${m.id}`}
            >
              <StatusBadge status={taxaCobranca.status as StatusType} showIcon={true} size="sm" />
            </Button>
          );
        },
      },
      // 5. Status da Matrícula
      {
        id: 'status',
        header: 'Status',
        align: 'center',
        width: 'w-[12%]',
        render: (m) => (
          <div data-testid={`matricula-status-${m.id}`} className="flex justify-center">
            <StatusBadge status={m.status as StatusType} showIcon={false} size="sm" />
          </div>
        ),
      },
      // 6. Ações
      {
        id: 'acoes',
        header: 'Ações',
        align: 'right',
        width: 'w-[20%]',
        render: (m) => {
          const cobrancaBloqueante = m.cobrancas?.find((c) =>
            COBRANCA_BLOCKING_STATUSES.includes(c.status),
          );
          const podeExcluir = !cobrancaBloqueante;
          const isAtiva = m.status === 'ATIVA';
          const isPausada = m.status === 'PAUSADA';
          const podeSerCancelada = isAtiva || isPausada;
          const deleteHint = cobrancaBloqueante
            ? `Para excluir, regularize a cobrança ${formatTaxaStatus(cobrancaBloqueante.status)} com vencimento em ${dateFormatter.format(new Date(cobrancaBloqueante.vencimento))}.`
            : 'Excluir matrícula permanentemente.';

          return (
            <div className="flex justify-end" data-testid={`matricula-actions-cell-${m.id}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    aria-label="Ações da matrícula"
                    data-testid={`matricula-actions-${m.id}`}
                  >
                    <EllipsisVerticalIcon className="!h-5 !w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      window.location.href = `/matriculas/${m.id}`;
                    }}
                    data-testid={`matricula-action-detalhes-${m.id}`}
                  >
                    <EyeIcon className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAtiva && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handlePausarMatricula(m);
                      }}
                      data-testid={`matricula-action-pausar-${m.id}`}
                      disabled={actionLoading}
                    >
                      <PauseIcon className="mr-2 h-4 w-4" />
                      Pausar matrícula
                    </DropdownMenuItem>
                  )}
                  {isPausada && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        void handleRetomarMatricula(m);
                      }}
                      data-testid={`matricula-action-retomar-${m.id}`}
                      disabled={actionLoading}
                    >
                      <PlayIcon className="mr-2 h-4 w-4" />
                      Retomar matrícula
                    </DropdownMenuItem>
                  )}
                  {podeSerCancelada && (
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        setCancelTarget(m);
                      }}
                      data-testid={`matricula-action-cancelar-${m.id}`}
                      disabled={actionLoading}
                    >
                      <XMarkIcon className="mr-2 h-4 w-4 text-orange-600" />
                      Cancelar matrícula
                    </DropdownMenuItem>
                  )}
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        if (!podeExcluir) return;
                        setDeleteTarget(m);
                      }}
                      data-testid={`matricula-action-excluir-${m.id}`}
                      disabled={actionLoading || !podeExcluir}
                      className={cn(
                        'text-red-600 focus:text-red-700',
                        (!podeExcluir || actionLoading) && 'cursor-not-allowed opacity-60',
                      )}
                      title={deleteHint}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Excluir matrícula
                    </DropdownMenuItem>
                    {!podeExcluir && (
                      <div
                        className="px-3 py-2 text-xs leading-snug text-gray-500"
                        data-testid={`matricula-delete-hint-${m.id}`}
                      >
                        {deleteHint}
                      </div>
                    )}
                  </>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [actionLoading, handlePausarMatricula, handleRetomarMatricula, formatTaxaStatus],
  );

  const selectedTaxaCobranca = useMemo(() => {
    if (!selectedTaxaMatricula) return null;
    return (
      selectedTaxaMatricula.cobrancas.find((cobranca) => cobranca.tipo === 'TAXA_MATRICULA') ?? null
    );
  }, [selectedTaxaMatricula]);

  // Usar invoiceUrl do Asaas diretamente (Asaas cuida de todas as notificações)
  const checkoutUrl = useMemo(() => {
    // O invoiceUrl vem do taxaResendResult após carregar os dados
    return taxaResendResult?.invoiceUrl ?? null;
  }, [taxaResendResult]);

  const cobrancaStatusAtual = taxaResendResult?.status ?? selectedTaxaCobranca?.status ?? null;
  const podeReenviarTaxa = cobrancaStatusAtual
    ? ['PENDENTE', 'PROCESSANDO', 'ATRASADO'].includes(cobrancaStatusAtual)
    : false;
  const cobrancaEstaPaga = cobrancaStatusAtual === 'PAGO';
  const mensagemReenvio = (() => {
    if (!cobrancaStatusAtual) {
      return 'Nenhuma cobrança de taxa encontrada para esta matrícula.';
    }
    if (cobrancaStatusAtual === 'ATRASADO') {
      return 'A taxa de matrícula está em atraso. Gere uma nova segunda via para compartilhar com o responsável.';
    }
    if (cobrancaStatusAtual === 'PROCESSANDO') {
      return 'A taxa está em processamento no Asaas. Você pode gerar novamente os links para acompanhar o pagamento.';
    }
    return 'A taxa de matrícula está pendente. Deseja reenviar a cobrança para o responsável?';
  })();

  // Se não houver contaId, mostrar mensagem
  if (!contaId) {
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
      title={initialTurmaId ? 'Alunos da Turma' : 'Gestão de Matrículas'}
      subtitle={
        initialTurmaId
          ? 'Gerencie os alunos matriculados nesta turma.'
          : 'Acompanhe matrículas, cobranças e vínculos de turmas em tempo real.'
      }
      actions={
        initialTurmaId ? (
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <Button
            onClick={() => setWizardOpen(true)}
            className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white shadow-none"
            aria-label="Cadastrar matrícula"
            disabled={!contaId}
          >
            Nova matrícula
          </Button>
        )
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

      {/* Wizard de criação de matrícula */}
      <MatriculaWizardDialog
        open={wizardOpen}
        contaId={contaId ?? undefined}
        onOpenChange={(open: boolean) => {
          setWizardOpen(open);
          if (!open) {
            reload();
          }
        }}
        onCreated={(payload: MatriculaCreatedPayload) => {
          toast.custom((t) => (
            <CustomToast
              variant="success"
              title="Matrícula criada"
              description={`Total ${currency.format(payload.preco.total)}`}
              onClose={() => toast.dismiss(t)}
            />
          ));
          reload();
        }}
      />

      {/* Dialog de confirmação de cancelamento */}
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
              <strong> {cancelTarget.aluno.nome ?? 'Aluno'} </strong>? Esta ação irá cancelar a
              assinatura no Asaas.
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
          await handleCancelarMatricula(cancelTarget);
        }}
      />

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir matrícula"
        description={
          deleteTarget ? (
            <span>
              Tem certeza que deseja excluir permanentemente a matrícula de
              <strong> {deleteTarget.aluno.nome ?? 'Aluno'} </strong>? Esta ação não pode ser
              desfeita e removerá a assinatura do Asaas e todos os dados locais.
            </span>
          ) : (
            'Tem certeza que deseja excluir esta matrícula?'
          )
        }
        confirmLabel="Excluir permanentemente"
        cancelLabel="Cancelar"
        loadingLabel="Excluindo..."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await handleDeletarMatricula(deleteTarget);
        }}
      />

      {/* Dialog de detalhes da matrícula */}
      <MatriculaDetalhesDialog
        open={Boolean(detailsTarget)}
        matricula={detailsTarget}
        onOpenChange={(open) => {
          if (!open) setDetailsTarget(null);
        }}
        onRefresh={() => {
          void reload();
        }}
      />

      {/* Dialog para taxa de matrícula - Design Refatorado */}
      <Dialog
        open={taxaDialogOpen}
        onOpenChange={(open) => {
          setTaxaDialogOpen(open);
          if (!open) {
            setSelectedTaxaMatricula(null);
            setTaxaResendResult(null);
            setCopyingPix(false);
            setLoadingTaxaLinks(false);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-lg gap-0 overflow-hidden p-0 rounded-2xl">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Taxa de Matrícula
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-slate-500">
              Gerencie a taxa de matrícula, gere cobranças e compartilhe links de pagamento.
            </DialogDescription>
            <div className="absolute left-0 right-0 border-b border-slate-100 mt-3" />
            <div className="h-4" />
          </div>

          {selectedTaxaMatricula && (
            <CustomScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-4">
                {/* Informações do Aluno e Valor */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs text-slate-500 block">
                        Aluno
                      </label>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedTaxaMatricula.aluno.nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <label className="text-xs text-slate-500 block">
                        Valor da Taxa
                      </label>
                      <p className="text-base font-bold text-slate-900">
                        {currency.format(selectedTaxaMatricula.taxaMatricula)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status do Pagamento */}
                {cobrancaEstaPaga ? (
                  /* PAGA - Visual de Sucesso */
                  <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-green-900">
                          Pagamento Confirmado
                        </h3>
                        <p className="text-xs text-green-700">
                          A taxa de matrícula foi paga com sucesso.
                        </p>
                      </div>
                    </div>
                    {/* Botão de comprovante */}
                    {selectedTaxaCobranca && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirComprovante(selectedTaxaCobranca.id)}
                        className="w-full border-green-300 bg-white text-green-700 hover:bg-green-50"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
                        Ver Comprovante
                      </Button>
                    )}
                  </div>
                ) : podeReenviarTaxa ? (
                  /* PENDENTE/ATRASADO - Visual de Atenção */
                  <>
                    <div
                      className={cn(
                        'rounded-xl border px-4 py-3',
                        cobrancaStatusAtual === 'ATRASADO'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3
                            className={cn(
                              'text-sm font-semibold',
                              cobrancaStatusAtual === 'ATRASADO'
                                ? 'text-red-900'
                                : 'text-amber-900',
                            )}
                          >
                            {cobrancaStatusAtual === 'ATRASADO'
                              ? 'Pagamento em Atraso'
                              : 'Aguardando Pagamento'}
                          </h3>
                          {selectedTaxaCobranca?.vencimento && (
                            <p className="text-xs text-slate-600 mt-0.5">
                              Vencimento: {dateFormatter.format(new Date(selectedTaxaCobranca.vencimento))}
                            </p>
                          )}
                        </div>
                        <StatusBadge
                          status={cobrancaStatusAtual as StatusType}
                          size="sm"
                          showIcon
                        />
                      </div>
                    </div>

                    {/* Loading skeleton */}
                    {loadingTaxaLinks && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
                        <div className="flex gap-4">
                          <div className="h-24 w-24 bg-slate-200 rounded-lg flex-shrink-0"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-slate-200 rounded w-28"></div>
                            <div className="h-3 bg-slate-200 rounded w-full"></div>
                            <div className="h-8 bg-slate-200 rounded w-full"></div>
                            <div className="flex gap-2">
                              <div className="h-8 w-24 bg-slate-200 rounded"></div>
                              <div className="h-8 w-20 bg-slate-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seção PIX */}
                    {!loadingTaxaLinks && taxaResendResult && (taxaResendResult.pixCopyPaste || taxaResendResult.pixQrCodeUrl) && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex gap-4">
                          {/* QR Code - Esquerda */}
                          {taxaResendResult.pixQrCodeUrl && (
                            <div className="flex-shrink-0 self-stretch flex items-center">
                              <div className="bg-white p-2 rounded-lg border border-slate-200 h-full flex items-center">
                                <img
                                  src={taxaResendResult.pixQrCodeUrl}
                                  alt="QR Code PIX"
                                  className="w-32 h-32 object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* Informações - Direita */}
                          <div className="flex flex-col gap-2 flex-1 min-w-0 justify-between">
                            <div>
                              <h5 className="text-sm font-semibold text-slate-900">Pagamento via Pix</h5>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                No app do seu banco, escolha pagar com Pix e escaneie o QR Code ao lado.
                              </p>
                            </div>

                            {/* Código Pix Copia e Cola */}
                            {taxaResendResult.pixCopyPaste && (
                              <div className="w-full">
                                <label className="block text-xs text-slate-500 mb-1">Código Pix Copia e Cola</label>
                                <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5 overflow-hidden">
                                  <p className="font-mono text-xs text-slate-600 truncate">
                                    {taxaResendResult.pixCopyPaste}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Botões */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  void handleCopyPix(taxaResendResult.pixCopyPaste ?? '')
                                }
                                disabled={copyingPix}
                                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs h-8"
                                data-testid="taxa-copy-pix"
                              >
                                <DocumentDuplicateIcon className="h-3.5 w-3.5 mr-1" />
                                {copyingPix ? 'Copiando...' : 'Copiar Código'}
                              </Button>
                              {checkoutUrl && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => window.open(checkoutUrl, '_blank')}
                                  className="bg-violet-600 text-white hover:bg-violet-700 text-xs h-8"
                                >
                                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1" />
                                  Ver Fatura
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* OUTROS ESTADOS - Visual neutro */
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-10 w-10 rounded-full bg-slate-300 flex items-center justify-center shadow-sm">
                          <svg
                            className="h-6 w-6 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                  </div>
                </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900 mb-1">
                          Status: {formatTaxaStatus(cobrancaStatusAtual)}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {cobrancaStatusAtual
                            ? 'A cobrança está em processamento no sistema.'
                            : 'Nenhuma cobrança encontrada para esta taxa.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CustomScrollArea>
          )}

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTaxaDialogOpen(false)}
                className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TableLayout>
  );
}
