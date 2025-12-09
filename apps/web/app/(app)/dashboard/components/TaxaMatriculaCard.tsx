"use client";

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import useCurrentUser from '@/hooks/use-current-user';
import { buildSparklinePath, formatCurrency } from "./ReceitaMesCard";

export type PeriodoTaxaMatricula = "7d" | "30d" | "1a";

type TaxaMatriculaData = {
  totalTaxas: number;
  variacaoPercentual: number | null;
  serie: number[];
  serieAcumulada: number[];
};

// Hook para buscar taxas de matrícula
function useTaxaMatricula(periodo: PeriodoTaxaMatricula | null) {
  const { user } = useCurrentUser();
  const contaId = user?.contaId;
  const [data, setData] = useState<TaxaMatriculaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTaxas = useCallback(async () => {
    if (!contaId) return;
    
    setLoading(true);
    try {
      const periodoParam = periodo || '30d';
      const response = await fetch(`/api/dashboard/taxa-matricula?contaId=${contaId}&periodo=${periodoParam}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar taxas de matrícula:', error);
    } finally {
      setLoading(false);
    }
  }, [contaId, periodo]);

  useEffect(() => {
    fetchTaxas();
  }, [fetchTaxas]);

  return { data, loading };
}

type TaxaMatriculaCardProps = {
  periodo: PeriodoTaxaMatricula;
  onPeriodoChange?: (_periodo: PeriodoTaxaMatricula | null) => void;
};

function TaxaMatriculaToggle({
  periodo,
  onPeriodoChange,
}: {
  periodo: PeriodoTaxaMatricula | null;
  onPeriodoChange?: (_periodo: PeriodoTaxaMatricula | null) => void;
}) {
  const options: { label: string; value: PeriodoTaxaMatricula }[] = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "1A", value: "1a" },
  ];

  return (
    <div
      className="flex gap-1 bg-[#e3d4f3] rounded-md p-1 w-fit"
      role="group"
      aria-label="Selecionar período da taxa de matrícula"
    >
      {options.map((opt) => {
        const isActive = periodo === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={`Filtrar taxa de matrícula por ${opt.label}`}
            className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent
              ${isActive
                ? 'bg-[#f2eeff] text-[#2D004A]'
                : 'bg-transparent text-[#4f2298] hover:bg-[#e5daf6]'}
            `}
            onClick={() => onPeriodoChange?.(isActive ? null : opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function TaxaMatriculaChart({ serie }: { serie: number[] }) {
  const width = 260;
  const height = 90;

  const spark = buildSparklinePath(serie, width, height);
  if (!spark.d) return null;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Gráfico da taxa de matrícula"
      role="img"
      className="max-w-[260px] w-full block"
    >
      <defs>
        <linearGradient id="taxaMatriculaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f2298" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4f2298" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${spark.d} L ${width},${height} L 0,${height} Z`}
        fill="url(#taxaMatriculaGradient)"
        stroke="none"
      />
      <path d={spark.d} fill="none" stroke="#2D004A" strokeWidth={2} strokeLinecap="round" />
      {spark.lastPoint && (
        <circle cx={spark.lastPoint.x} cy={spark.lastPoint.y} r={3} fill="#4f2298" />
      )}
    </svg>
  );
}

export function TaxaMatriculaCard({
  periodo,
  onPeriodoChange,
}: TaxaMatriculaCardProps) {
  const { data, loading } = useTaxaMatricula(periodo);
  
  const valorPago = data?.totalTaxas ?? 0;
  const variacaoPercentual = data?.variacaoPercentual ?? null;
  const serie = data?.serieAcumulada ?? [];

  const isNegativo = (variacaoPercentual ?? 0) < 0;
  const variacaoLabel =
    variacaoPercentual === null
      ? null
      : `${isNegativo ? '▼' : '▲'} ${Math.abs(variacaoPercentual).toFixed(1)}%`;

  const isSerieValida = Array.isArray(serie) && serie.length > 1 && new Set(serie).size > 1;

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 rounded-2xl bg-[#f2eeff] px-5 py-4 min-h-[140px] animate-pulse">
        <div className="flex flex-col justify-between min-w-[120px] md:max-w-[180px] flex-shrink-0 h-full">
          <div>
            <Skeleton className="h-4 w-28 bg-[#e3d4f3] mb-2" />
            <Skeleton className="h-10 w-20 bg-[#e3d4f3] mb-1" />
            <Skeleton className="h-3 w-12 bg-[#e3d4f3]" />
          </div>
          <div className="flex items-end mt-3">
            <Skeleton className="h-7 w-24 bg-[#e3d4f3] rounded-md" />
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
      <div className="flex flex-col justify-between min-w-[120px] md:max-w-[180px] flex-shrink-0 h-full">
        <div>
          <p className="text-[13px] font-normal tracking-wide text-[#2D004A] mb-2 text-left">
            Taxa de matrícula
          </p>
          <span className="text-4xl leading-none font-medium text-[#2D004A] mb-1 block">
            {formatCurrency(valorPago)}
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
          <TaxaMatriculaToggle periodo={periodo} onPeriodoChange={onPeriodoChange} />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center mt-3 md:mt-0">
        <div className="w-full h-[96px] flex items-center justify-center">
          {isSerieValida ? (
            <TaxaMatriculaChart serie={serie} />
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
