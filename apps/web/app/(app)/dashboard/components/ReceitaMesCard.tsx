
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import useCurrentUser from '@/hooks/use-current-user';

type ReceitaData = {
  receitaMes: number;
  variacaoPercentual: number | null;
  serie: number[];
  serieAcumulada: number[];
};

// Hook para buscar receita do mês
function useReceitaMes(periodo: PeriodoReceita | null) {
  const { user } = useCurrentUser();
  const contaId = user?.contaId;
  const [data, setData] = useState<ReceitaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReceita = useCallback(async () => {
    if (!contaId) return;
    
    setLoading(true);
    try {
      const periodoParam = periodo || '30d';
      const response = await fetch(`/api/dashboard/receita?contaId=${contaId}&periodo=${periodoParam}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
    } finally {
      setLoading(false);
    }
  }, [contaId, periodo]);

  useEffect(() => {
    fetchReceita();
  }, [fetchReceita]);

  return { data, loading };
}

// Subcomponente: Toggle de período
// Subcomponente: Toggle de período (1D, 15D, 30D apenas para filtrar o gráfico)
function ReceitaMesToggle({ periodo, onPeriodoChange }: { periodo: PeriodoReceita | null; onPeriodoChange?: (_periodo: PeriodoReceita | null) => void }) {
  return (
    <div className="flex gap-1 bg-[#e3d4f3] rounded-md p-1 w-fit" role="group" aria-label="Selecionar período da receita">
      {[
        { label: '1D', value: '1d' },
        { label: '15D', value: '15d' },
        { label: '30D', value: '30d' },
      ].map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-label={`Visualizar receita por ${opt.label}`}
          className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent
            ${periodo === opt.value
              ? 'bg-[#f2eeff] text-[#2D004A]'
              : 'bg-transparent text-[#4f2298] hover:bg-[#e5daf6]'}
          `}
          onClick={() =>
            onPeriodoChange?.(
              periodo === (opt.value as PeriodoReceita) ? null : (opt.value as PeriodoReceita),
            )
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Subcomponente: Gráfico de receita
function ReceitaMesChart({ serie, width, height }: { serie: number[]; width: number; height: number }) {
  const spark = buildSparklinePath(serie, width, height);
  if (!spark.d) return null;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Gráfico de receita do período"
      role="img"
      className="max-w-[260px] w-full block"
    >
      <defs>
        <linearGradient id="receitaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f2298" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4f2298" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* área */}
      <path
        d={`${spark.d} L ${width},${height} L 0,${height} Z`}
        fill="url(#receitaGradient)"
        stroke="none"
      />
      {/* linha */}
      <path d={spark.d} fill="none" stroke="#2D004A" strokeWidth={2} strokeLinecap="round" />
      {/* ponto final */}
      {spark.lastPoint && (
        <circle
          cx={spark.lastPoint.x}
          cy={spark.lastPoint.y}
          r={3}
          fill="#4f2298"
        />
      )}
    </svg>
  );
}

type PeriodoReceita = '1d' | '15d' | '30d';

type ReceitaMesCardProps = {
  periodo: PeriodoReceita | null;
  onPeriodoChange?: (_periodo: PeriodoReceita | null) => void;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace('R$', '')
    .trim();
};

export function buildSparklinePath(values: number[] | undefined | null, width: number, height: number) {
  if (!Array.isArray(values) || values.length === 0) {
    return { d: '', lastPoint: null as { x: number; y: number } | null };
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = stepX * i;
    const normalized = (v - min) / range;
    const y = height - normalized * height;
    return { x, y };
  });

  // Usa curvas cúbicas (C) para uma linha mais suave
  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];

    const dx = (p1.x - p0.x) / 3;

    const c1x = p0.x + dx;
    const c1y = p0.y;
    const c2x = p1.x - dx;
    const c2y = p1.y;

    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p1.x},${p1.y}`;
  }

  return { d, lastPoint: points[points.length - 1] };
}

export function ReceitaMesCard({
  periodo,
  onPeriodoChange,
}: ReceitaMesCardProps) {
  const { data, loading } = useReceitaMes(periodo);
  
  const valorAtual = data?.receitaMes ?? 0;
  const variacaoPercentual = data?.variacaoPercentual ?? null;
  // Usa série acumulada para um gráfico mais significativo quando há dados
  const serie = data?.serieAcumulada ?? [];
  
  const isNegativo = (variacaoPercentual ?? 0) < 0;
  const variacaoLabel =
    variacaoPercentual === null
      ? null
      : `${isNegativo ? '▼' : '▲'} ${Math.abs(variacaoPercentual).toFixed(1)}%`;

  const width = 260;
  const height = 90;

  // Usa série real ou fallback se não houver dados
  const isSerieValida = Array.isArray(serie) && serie.length > 1 && new Set(serie).size > 1;
  const effectiveSerie = isSerieValida ? serie : [];

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 rounded-2xl bg-[#f2eeff] px-5 py-4 min-h-[140px] animate-pulse">
        <div className="flex flex-col justify-between min-w-[120px] md:max-w-[180px] flex-shrink-0 h-full">
          <div>
            <Skeleton className="h-4 w-24 bg-[#e3d4f3] mb-2" />
            <Skeleton className="h-10 w-20 bg-[#e3d4f3] mb-1" />
            <Skeleton className="h-3 w-12 bg-[#e3d4f3]" />
          </div>
          <div className="flex items-end mt-3">
            <Skeleton className="h-7 w-28 bg-[#e3d4f3] rounded-md" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center mt-3 md:mt-0">
          <Skeleton className="w-full max-w-[260px] h-[90px] bg-[#e3d4f3] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 rounded-2xl bg-[#f2eeff] px-5 py-4 min-h-[140px]">
      {/* Grupo: texto + toggle */}
      <div className="flex flex-col justify-between min-w-[120px] md:max-w-[180px] flex-shrink-0 h-full">
        <div>
          <p className="text-[13px] font-normal tracking-wide text-[#2D004A] mb-2 text-left">Receita do mês</p>
          <span className="text-4xl leading-none font-medium text-[#2D004A] mb-1 block">
            {formatCurrency(valorAtual)}
          </span>
          {variacaoLabel && (
            <span
              className={
                'text-xs font-medium mb-2 block ' +
                (isNegativo ? 'text-red-500' : 'text-emerald-500')
              }
            >
              {variacaoLabel}
            </span>
          )}
        </div>
        <div className="flex items-end mt-3">
          <ReceitaMesToggle periodo={periodo} onPeriodoChange={onPeriodoChange} />
        </div>
      </div>

      {/* Grupo: gráfico */}
      <div className="flex flex-1 items-center justify-center mt-3 md:mt-0">
        <div className="w-full h-[96px] flex items-center justify-center">
          {effectiveSerie.length > 1 ? (
            <ReceitaMesChart serie={effectiveSerie} width={width} height={height} />
          ) : (
            <div className="flex items-center justify-center text-[#4f2298]/50 text-sm">
              Sem dados no período
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
