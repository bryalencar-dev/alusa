'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, User } from '@/components/icons/icons';
import { pushToast } from '@/components/ui/toast';

interface AlunoComPagamentos {
  id: string;
  nome: string;
  cpf: string | null;
  foto: string | null;
  totalPagamentos: number;
  valorTotal: number;
  ultimoPagamento: string | null;
  pagamentosCount: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
  } catch {
    return '—';
  }
};

const getInitials = (nome: string) => {
  const parts = nome.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function FinanceiroPagamentosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<AlunoComPagamentos[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      if (statusFilter !== 'TODOS') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/financeiro/pagamentos/summary?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        pushToast({
          title: 'Erro',
          description: data?.error?.message || 'Falha ao carregar dados',
          variant: 'error',
        });
        setAlunos([]);
        return;
      }

      const payload = await res.json();
      setAlunos(payload.data || []);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      pushToast({ title: 'Erro', description: errMsg, variant: 'error' });
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-gray-900">
          Pagamentos
        </h1>
        <p className="text-[13px] text-gray-500">
          Visualize o histórico de pagamentos por aluno. Clique em um aluno para ver todos os seus
          pagamentos.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-full md:flex-1 md:min-w-[250px] md:max-w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-none" />
              <Input
                placeholder="Buscar por nome do aluno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 border border-gray-300 shadow-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 !w-auto md:!w-auto shrink-0 min-w-[140px] max-w-[170px] whitespace-nowrap bg-white text-gray-700 border border-gray-300 shadow-none px-3 flex items-center justify-between gap-2">
                <SelectValue placeholder="Todos Status" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="TODOS">Todos Status</SelectItem>
                <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="ESTORNADO">Estornado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <>
            {/* Header da tabela (skeleton) */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="col-span-4 h-4" />
                <Skeleton className="col-span-2 h-4" />
                <Skeleton className="col-span-3 h-4" />
                <Skeleton className="col-span-3 h-4" />
              </div>
            </div>
            {/* Linhas (skeleton) */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="col-span-2 h-4 w-12 mx-auto" />
                  <Skeleton className="col-span-3 h-4 w-28 mx-auto" />
                  <Skeleton className="col-span-3 h-4 w-24 mx-auto" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-4">Aluno</div>
                <div className="col-span-2 text-center">Pagamentos</div>
                <div className="col-span-3 text-center">Valor Total</div>
                <div className="col-span-3 text-center">Último Pagamento</div>
              </div>
            </div>

            {/* Linhas */}
            <div className="divide-y">
              {alunos.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm">Nenhum aluno com pagamentos encontrado</p>
                </div>
              ) : (
                alunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="px-6 py-3 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
                    onClick={() => router.push(`/financeiro/pagamentos/${aluno.id}`)}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Aluno */}
                      <div className="col-span-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={aluno.foto || undefined} alt={aluno.nome} />
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-medium">
                            {getInitials(aluno.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-normal text-gray-900 text-[13px] truncate">
                            {aluno.nome}
                          </div>
                          {aluno.cpf && (
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              CPF:{' '}
                              {aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantidade de Pagamentos */}
                      <div className="col-span-2 text-[13px] text-gray-700 text-center">
                        {aluno.pagamentosCount}
                      </div>

                      {/* Valor Total */}
                      <div className="col-span-3 text-[13px] text-gray-900 text-center font-normal">
                        {formatCurrency(aluno.valorTotal)}
                      </div>

                      {/* Último Pagamento */}
                      <div className="col-span-3 text-[13px] text-gray-700 text-center">
                        {aluno.ultimoPagamento ? formatDate(aluno.ultimoPagamento) : '—'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
