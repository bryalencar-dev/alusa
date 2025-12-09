'use client';

import { useMemo, useState } from 'react';
import TableLayout from '@/components/layout/TableLayout';
import { StatusBadge } from '@/components/ui/status-badge';
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/icons/icons';
import useCurrentUser from '@/hooks/use-current-user';
import { useRematriculas } from './hooks/use-rematriculas';
import type { RematriculaElegivelItem, StatusContrato } from './services/rematriculas-service';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RematriculaDialog } from '@/components/matriculas/RematriculaDialog';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import EntityFiltersBar, {
  type SortOrder as SortOrderEF,
} from '@/components/layout/EntityFiltersBar';

const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });

type QuickFilter = 'TODOS' | 'EXPIRADO' | 'EM_BREVE';

type SortOrder = 'ASC' | 'DESC';

const contratoOptions: Array<{ label: string; value: StatusContrato | 'TODOS' }> = [
  { label: 'Todos os contratos', value: 'TODOS' },
  { label: 'Ativos', value: 'ATIVO' },
  { label: 'Encerrados', value: 'ENCERRADO' },
];

const quickFilters: Array<{ label: string; value: QuickFilter }> = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Expirados', value: 'EXPIRADO' },
  { label: 'Vencem em breve', value: 'EM_BREVE' },
];

function getDiasBadgeVariant(diasRestantes: number): BadgeVariant {
  if (diasRestantes < 0) return 'destructive';
  if (diasRestantes <= 15) return 'warning';
  if (diasRestantes <= 45) return 'info';
  return 'default';
}

export default function RematriculasFeature() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const [search, setSearch] = useState('');
  const [diasAntecedencia, setDiasAntecedencia] = useState(60);
  const [statusContrato, setStatusContrato] = useState<StatusContrato | undefined>(undefined);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('TODOS');
  const [selectedMatricula, setSelectedMatricula] = useState<RematriculaElegivelItem | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');

  const { items, loading, total, referencia, ate, reload } = useRematriculas({
    contaId,
    diasAntecedencia,
    statusContrato,
    search: search || undefined,
  });

  const filteredItems = useMemo(() => {
    if (quickFilter === 'TODOS') return items;
    if (quickFilter === 'EXPIRADO') {
      return items.filter((item) => item.contratoExpirado);
    }
    return items.filter((item) => item.diasRestantes <= 30 && item.diasRestantes >= 0);
  }, [items, quickFilter]);

  // Colunas no mesmo padrão da tabela de alunos
  const columns: DataTableColumn<RematriculaElegivelItem>[] = [
    {
      id: 'aluno',
      header: 'Aluno',
      width: 'w-1/4',
      align: 'left',
      render: (row) => {
        const initials = (row.aluno.nome ?? '')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10">
              {row.aluno.foto ? (
                <AvatarImage src={row.aluno.foto} alt={row.aluno.nome ?? ''} />
              ) : null}
              <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-normal text-gray-900 text-[13px] truncate">{row.aluno.nome}</div>
              <div className="text-xs text-gray-500">{row.aluno.cpf ?? '—'}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'plano',
      header: 'Plano',
      width: 'w-1/4',
      align: 'left',
      render: (row) => (
        <div className="flex flex-col text-sm text-gray-700">
          <span className="font-medium text-gray-900">
            {row.plano?.nome ?? (row.combo ? `Combo: ${row.combo.nome}` : '—')}
          </span>
          {row.turma ? (
            <span className="text-xs text-gray-500">{row.turma.nome}</span>
          ) : (
            <span className="text-xs text-gray-400">Sem turma vinculada</span>
          )}
        </div>
      ),
    },
    {
      id: 'contrato',
      header: 'Contrato',
      width: 'w-1/6',
      align: 'center',
      render: (row) => (
        <Badge variant={getDiasBadgeVariant(row.diasRestantes)}>
          {row.contratoExpirado ? 'Expirado' : 'Ativo'}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      width: 'w-1/6',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: 'acoes',
      header: 'Ações',
      width: 'w-1/6',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            variant={row.podeRenovar ? 'default' : 'outline'}
            size="sm"
            className={row.podeRenovar ? 'bg-brand-accent text-white' : 'text-xs'}
            disabled={!row.podeRenovar}
            onClick={() => {
              if (!row.podeRenovar) {
                toast.custom((t) => (
                  <CustomToast
                    variant="warning"
                    title="Contrato ainda ativo"
                    description="A rematrícula só pode ser iniciada quando o contrato atual estiver encerrado."
                    onClose={() => toast.dismiss(t)}
                  />
                ));
                return;
              }
              setSelectedMatricula(row);
            }}
          >
            Rematricular
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <TableLayout
        title="Gestão de Rematrículas"
        subtitle="Gerencie contratos próximos do fim e renove em poucos cliques."
        actions={
          <div className="flex justify-center items-center w-full py-2">
            <ToggleGroup
              value={quickFilter}
              onValueChange={(v) => setQuickFilter((v as QuickFilter) || 'TODOS')}
              className=""
            >
              {quickFilters.map((filter) => (
                <ToggleGroupItem key={filter.value} value={filter.value}>
                  {filter.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        }
        filtersBar={
          <EntityFiltersBar
            searchValue={search}
            onSearchChange={setSearch}
            statusValue={(statusContrato ?? 'TODOS') as string}
            onStatusChange={(value) =>
              setStatusContrato(value === 'TODOS' ? undefined : (value as StatusContrato))
            }
            sortOrder={sortOrder as SortOrderEF}
            onSortChange={(order) => setSortOrder(order as SortOrder)}
            searchPlaceholder="Buscar por aluno, plano ou turma"
            extraFilters={
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wide text-gray-500">
                  Dias de antecedência
                </span>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={diasAntecedencia}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (!Number.isFinite(parsed)) {
                      setDiasAntecedencia(60);
                      return;
                    }
                    const clamped = Math.min(180, Math.max(15, parsed));
                    setDiasAntecedencia(clamped);
                  }}
                  className="block w-full max-w-[120px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent"
                />
              </div>
            }
          />
        }
      >
        <div className="bg-white rounded-xl border overflow-hidden px-0 py-0">
          <DataTable
            aria-label="Tabela de rematrículas elegíveis"
            columns={columns}
            data={filteredItems}
            rowKey={(row) => row.id}
            loading={loading}
            emptyMessage={
              <div className="px-6 py-12 text-center text-sm text-gray-500">
                {loading
                  ? 'Carregando rematrículas...'
                  : 'Nenhuma matrícula elegível encontrada para os filtros atuais'}
              </div>
            }
          />
        </div>
      </TableLayout>

      <RematriculaDialog
        open={Boolean(selectedMatricula)}
        contaId={contaId ?? undefined}
        item={selectedMatricula}
        onOpenChange={(open) => {
          if (!open) setSelectedMatricula(null);
        }}
        onCreated={() => {
          toast.custom((t) => (
            <CustomToast
              variant="success"
              title="Rematrícula criada"
              description="A nova matrícula foi criada com sucesso."
              onClose={() => toast.dismiss(t)}
            />
          ));
          setSelectedMatricula(null);
          void reload();
        }}
      />
    </>
  );
}
