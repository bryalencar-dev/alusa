'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import { TotalAlunosCard } from './components/TotalAlunosCard';
import { ReceitaMesCard } from './components/ReceitaMesCard';
import { TaxaMatriculaCard, PeriodoTaxaMatricula } from './components/TaxaMatriculaCard';
import { EmAtrasoCard } from './components/EmAtrasoCard';
import { CashflowCard } from './components/CashflowCard';

type DashboardMetrics = {
  totalAlunos: number;
  alunosAtivos: number;
  totalMatriculas: number;
  matriculasAtivas: number;
  cobrancasPendentes: number;
  cobrancasVencidas: number;
  receitaMes: number;
  receitaTotal: number;
  proximosVencimentos: number;
  taxaInadimplencia: number;
  receitaSemanal: number[];
  matriculasNovasSemanal: number[];
  matriculasCanceladasSemanal: number[];
  ultimasCobrancas: Array<{
    id: string;
    aluno: string;
    valor: number;
    vencimento: string;
    status: string;
  }>;
  alunosRecentes: Array<{
    id: string;
    nome: string;
    foto: string | null;
    tipo: string;
  }>;
};

export default function DashboardClient() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodoReceita, setPeriodoReceita] = useState<'1d' | '15d' | '30d' | null>(null);
  const [periodoTaxa, setPeriodoTaxa] = useState<PeriodoTaxaMatricula>('30d');

  const handleGoToCadastro = useCallback(() => {
    router.push('/alunos');
  }, [router]);

  useEffect(() => {
    if (!user?.contaId) {
      setMetrics(null);
      return;
    }

    let cancelled = false;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ contaId: user.contaId });
        const response = await fetch(`/api/dashboard/metrics?${params.toString()}`, {
          cache: 'no-store',
        });
        const data = await response.json();

        if (!cancelled && data.success) {
          setMetrics(data.data);
        } else if (!cancelled) {
          console.error('[DashboardClient] Erro na resposta:', data);
        }
      } catch (error) {
        if (!cancelled) console.error('[DashboardClient] Erro ao buscar métricas:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMetrics();

    return () => {
      cancelled = true;
    };
  }, [user?.contaId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <section aria-label="Conteúdo do Dashboard" className="flex flex-col gap-8 pr-8">
        <div>
          <Skeleton className="h-9 w-48 mb-1" />
          <Skeleton className="h-5 w-80" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-5 border border-gray-200">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-9 w-20 mb-1.5" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <section aria-label="Conteúdo do Dashboard" className="flex flex-col gap-8 pr-8">
      {/* Título */}
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">
          Olá, {user?.name || 'Usuário'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Veja o resumo das suas métricas e acompanhe o desempenho do seu negócio.
        </p>
      </header>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <TotalAlunosCard
          total={metrics?.totalAlunos ?? 0}
          recentStudents={(metrics?.alunosRecentes || []).map((aluno) => ({
            id: aluno.id,
            name: aluno.nome,
            avatarUrl: aluno.foto,
            initials: getInitials(aluno.nome),
          }))}
          onAddAluno={handleGoToCadastro}
        />

        {/* Receita do Mês */}
        <ReceitaMesCard
          periodo={periodoReceita}
          onPeriodoChange={setPeriodoReceita}
        />

        {/* Taxa de Matrícula */}
        <TaxaMatriculaCard
          periodo={periodoTaxa}
          onPeriodoChange={(p) => p && setPeriodoTaxa(p)}
        />

        <EmAtrasoCard
          quantidadeEmAtraso={metrics?.cobrancasVencidas ?? 0}
          taxaInadimplencia={metrics?.taxaInadimplencia ?? 0}
        />

        <div className="lg:col-span-2">
          <CashflowCard />
        </div>
      </div>

      {/* Cards Laterais */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card de Análises */}
        <div className="space-y-5 lg:col-span-1">
          <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-5 text-white">
            <h3 className="text-base font-semibold mb-1.5">Recursos Premium</h3>
            <p className="text-xl font-bold mb-0.5">Em Breve</p>
            <p className="text-sm text-teal-100 mb-3">Funcionalidades avançadas</p>
            <button className="w-full px-4 py-2.5 bg-yellow-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
              Saiba Mais
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Mais Análises</h3>
            <p className="text-xs text-gray-500 mb-3">Explore mais relatórios</p>

            <div className="space-y-1.5">
              <button
                onClick={() => router.push('/financeiro/cobrancas')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Cobranças</span>
                </div>
                <svg
                  className="h-4 w-4 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => router.push('/financeiro/pagamentos')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Pagamentos</span>
                </div>
                <svg
                  className="h-4 w-4 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-gray-500">Dados atualizados por</p>
                <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">
                  Alusa
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Últimas Cobranças */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Últimas Cobranças</h2>
            <button
              onClick={() => router.push('/financeiro/cobrancas')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
            >
              Ver Todas
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(metrics?.ultimasCobrancas || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nenhuma cobrança encontrada
                    </td>
                  </tr>
                ) : (
                  (metrics?.ultimasCobrancas || []).map((cobranca) => (
                    <tr key={cobranca.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{cobranca.aluno}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{formatDate(cobranca.vencimento)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cobranca.status === 'PAGO'
                              ? 'bg-green-100 text-green-800'
                              : cobranca.status === 'PENDENTE'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cobranca.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(cobranca.valor)}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alunos Recentes */}
        <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Alunos Recentes</h2>
            <p className="text-xs text-gray-500 mt-0.5">Últimos cadastros</p>
          </div>

          <div className="p-4 space-y-1.5">
            {(metrics?.alunosRecentes || []).length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-6">Nenhum aluno recente</p>
            ) : (
              (metrics?.alunosRecentes || []).map((aluno) => (
                <button
                  key={aluno.id}
                  onClick={() => router.push(`/alunos/${aluno.id}`)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm flex-shrink-0">
                    {aluno.foto ? (
                      <img
                        src={aluno.foto}
                        alt={aluno.nome}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(aluno.nome)
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{aluno.nome}</p>
                    <p className="text-xs text-gray-500">{aluno.tipo}</p>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-400 group-hover:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => router.push('/alunos')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ver todos os alunos
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}



