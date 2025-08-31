// Página principal de conteúdo do dashboard dentro do novo layout (Sidebar + Header).
// Conteúdo inicial placeholder: cards/resumo podem ser adicionados depois.
import { StatCard } from '@/components/dashboard/StatCard';
import { Suspense } from 'react';

function StatSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-4 animate-pulse">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-4 h-8 w-32 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-12" data-testid="dashboard-root">
      <Suspense fallback={<StatSkeleton />}> {/* futuro: carregar métricas via fetch/server component */}
        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Matrículas Ativas" value="--" hint="Total de alunos atualmente ativos" loading={false} />
          <StatCard title="Receita (Mês)" value="--" hint="Receita consolidada mês corrente" />
          <StatCard title="Inadimplência" value="--" hint="% alunos em atraso" />
          <StatCard title="Aulas Hoje" value="--" hint="Quantidade de aulas agendadas" />
        </section>
      </Suspense>
      <section className="grid gap-8 grid-cols-1 2xl:grid-cols-3">
  <div className="2xl:col-span-2 relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 min-h-[300px]">
          <div className="absolute inset-px rounded-[23px] bg-gradient-to-br from-white/4 to-transparent pointer-events-none" />
          <h3 className="text-sm font-semibold text-white/90">Visão Geral</h3>
          <p className="mt-2 text-xs text-white/50 max-w-md">Adicionar gráficos e tendências aqui.</p>
        </div>
  <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 min-h-[300px]">
          <div className="absolute inset-px rounded-[23px] bg-gradient-to-br from-white/4 to-transparent pointer-events-none" />
          <h3 className="text-sm font-semibold text-white/90">Notificações Recentes</h3>
          <p className="mt-2 text-xs text-white/50">Stream de eventos / alertas.</p>
        </div>
      </section>
    </div>
  );
}
