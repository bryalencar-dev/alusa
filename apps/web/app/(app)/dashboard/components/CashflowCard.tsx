import React, { useEffect, useMemo, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type CashflowPoint = {
  mes: string;
  entradas: number;
  saidas: number;
  saldo: number;
};

type SummaryPanelProps = {
  entradas: number;
  saidas: number;
  saldo: number;
  saldoInicial: number;
  topNavigator?: React.ReactNode;
};

type MonthNavigatorProps = {
  mesAtual: string;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
};

type CashflowCarouselProps = {
  data: CashflowPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  windowSize?: number;
};

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

const CAROUSEL_TRANSITION_MS = 320;
const BAR_ZONE = 88; // metade superior/inferior
const BAR_WIDTH = 14;
const GAP = 32;
const SLOT = BAR_WIDTH * 2 + GAP;

// Helper para limitar valores
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// ---------------------------------------------------------------------------
// Dados de exemplo
// ---------------------------------------------------------------------------

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const CASHFLOW_MOCK: CashflowPoint[] = [
  { mes: 'Jan', entradas: 12000, saidas: 8000, saldo: 4000 },
  { mes: 'Fev', entradas: 10000, saidas: 9000, saldo: 1000 },
  { mes: 'Mar', entradas: 15000, saidas: 7000, saldo: 8000 },
  { mes: 'Abr', entradas: 9000, saidas: 9500, saldo: -500 },
  { mes: 'Mai', entradas: 13000, saidas: 8000, saldo: 5000 },
  { mes: 'Jun', entradas: 11000, saidas: 10000, saldo: 1000 },
  { mes: 'Jul', entradas: 14000, saidas: 9000, saldo: 5000 },
  { mes: 'Ago', entradas: 12000, saidas: 11000, saldo: 1000 },
  { mes: 'Set', entradas: 16000, saidas: 12000, saldo: 4000 },
  { mes: 'Out', entradas: 17000, saidas: 13000, saldo: 4000 },
  { mes: 'Nov', entradas: 18000, saidas: 14000, saldo: 4000 },
  { mes: 'Dez', entradas: 20000, saidas: 15000, saldo: 5000 },
];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const FINANCIAL_START_INDEX = 0;
const LAST_DATA_INDEX = FINANCIAL_START_INDEX + CASHFLOW_MOCK.length - 1;
const PAST_MONTHS = 12;
const FUTURE_MONTHS = 3;

const SYSTEM_MONTH = new Date().getMonth(); // 0..11
function computeCurrentIndex(): number {
  for (let i = LAST_DATA_INDEX; i >= FINANCIAL_START_INDEX; i--) {
    const normalized = ((i % 12) + 12) % 12;
    if (normalized === SYSTEM_MONTH) return i;
  }
  return LAST_DATA_INDEX;
}
const CURRENT_INDEX = computeCurrentIndex();

const MIN_INDEX = FINANCIAL_START_INDEX - PAST_MONTHS;
const MAX_INDEX = Math.min(LAST_DATA_INDEX, CURRENT_INDEX);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrencyFull(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });
}

function monthNameFromIndex(index: number, full: boolean): string {
  const base = full ? MESES : MESES_CURTOS;
  const normalized = ((index % 12) + 12) % 12;
  return base[normalized];
}

export function monthDateFromIndex(index: number): Date {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const offset = index - CURRENT_INDEX;
  return new Date(
    currentMonthStart.getFullYear(),
    currentMonthStart.getMonth() + offset,
    1,
  );
}

const LAST_KNOWN_SALDO = CASHFLOW_MOCK.length
  ? CASHFLOW_MOCK[CASHFLOW_MOCK.length - 1].saldo
  : 0;

function getMonthDataFromArray(index: number): {
  entradas: number;
  saidas: number;
  saldo: number;
  hasData: boolean;
} {
  const dataIndex = index - FINANCIAL_START_INDEX;

  if (dataIndex < 0) {
    return { entradas: 0, saidas: 0, saldo: 0, hasData: false };
  }

  if (dataIndex >= 0 && dataIndex < CASHFLOW_MOCK.length) {
    const p = CASHFLOW_MOCK[dataIndex];
    return { entradas: p.entradas, saidas: p.saidas, saldo: p.saldo, hasData: true };
  }

  return { entradas: 0, saidas: 0, saldo: LAST_KNOWN_SALDO, hasData: false };
}

function getSaldoAtIndex(index: number): number {
  return getMonthDataFromArray(index).saldo;
}

function catmullRom2bezier(points: [number, number][]): string {
  if (points.length < 2) return '';

  let d = `M ${points[0][0]},${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }

  return d;
}

// ---------------------------------------------------------------------------
// Navegação de mês
// ---------------------------------------------------------------------------

function MonthNavigator({
  mesAtual,
  onPrevious,
  onNext,
  canGoNext,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-center w-full gap-4">
      <button
        type="button"
        onClick={onPrevious}
        className="rounded-full p-1.5 hover:bg-gray-100 text-blue-600 transition-colors"
        aria-label="Mês anterior"
      >
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="inline-block"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <span className="text-base font-semibold text-gray-900">{mesAtual}</span>
      <button
        type="button"
        onClick={canGoNext ? onNext : undefined}
        className={`rounded-full p-1.5 transition-colors ${
          canGoNext
            ? 'hover:bg-gray-100 text-blue-600'
            : 'text-gray-300 cursor-default'
        }`}
        aria-label="Próximo mês"
      >
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="inline-block"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel de resumo
// ---------------------------------------------------------------------------

function SummaryPanel({
  entradas,
  saidas,
  saldo,
  saldoInicial,
  topNavigator,
}: SummaryPanelProps) {
  const linhas = [
    { label: 'Entradas', value: entradas, color: 'text-[#7c3aed]', prefix: '+ ' },
    { label: 'Saídas', value: saidas, color: 'text-[#c4b5fd]', prefix: '- ' },
    {
      label: 'Balanço',
      value: saldo,
      color: 'text-[#2D004A]',
      prefix: saldo >= 0 ? '+ ' : '- ',
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-[#e3d4f3] bg-white px-4 py-5 shadow-sm">
      {topNavigator && <div className="mb-4">{topNavigator}</div>}

      <div className="space-y-4 divide-y divide-[#e3d4f3]">
        {linhas.map((row, index) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-4 ${
              index === 0 ? '' : 'pt-4'
            }`}
          >
            <span className="text-sm text-[#2D004A]">{row.label}</span>
            <span className={`text-sm font-semibold ${row.color}`}>
              {row.prefix}
              {formatCurrencyFull(Math.abs(row.value))}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-[#f2eeff] px-4 py-3 text-sm text-[#4f2298]">
        Você começou o mês com{' '}
        <span className="font-semibold text-[#2D004A]">
          {formatCurrencyFull(saldoInicial)}
        </span>{' '}
        e terminou com{' '}
        <span className="font-semibold text-[#2D004A]">
          {formatCurrencyFull(saldo)}
        </span>
        .
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carrossel de velas + linha contínua
// ---------------------------------------------------------------------------

type CandleGeometry = {
  index: number;
  order: number;
  isFuture: boolean;
  showBars: boolean;
  entradaHeight: number;
  saidaHeight: number;
  xCenter: number;
  yLine: number;
};

function CashflowCarousel({
  data,
  selectedIndex,
  onSelect,
  windowSize = 7,
}: CashflowCarouselProps) {
  const chartHeight = BAR_ZONE * 2 + 36;
  const zeroY = chartHeight / 2;

  const hasMountedRef = useRef(false);
  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  const isDraggingRef = useRef(false);

  // Tooltip size
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [selectedIndex]);

  const indices = useMemo(() => {
    const arr: number[] = [];
    for (let i = MIN_INDEX; i <= MAX_INDEX; i++) arr.push(i);
    return arr;
  }, []);

  const trackLength = indices.length;
  const trackWidth = trackLength * (BAR_WIDTH * 2) + (trackLength - 1) * GAP;

  const chartWidth = windowSize * (BAR_WIDTH * 2) + (windowSize - 1) * GAP;

  const half = Math.floor(windowSize / 2);
  let startVis = selectedIndex - half;

  if (startVis < MIN_INDEX) startVis = MIN_INDEX;
  if (startVis + windowSize - 1 > CURRENT_INDEX) {
    startVis = Math.max(MIN_INDEX, CURRENT_INDEX - windowSize + 1);
  }

  const lineMax = useMemo(() => {
    const valores = indices.map((idx) => Math.abs(getSaldoAtIndex(idx)));
    return valores.length ? Math.max(...valores, 1) : 1;
  }, [indices]);

  const maxValue = useMemo(() => {
    const valores: number[] = [];
    indices.forEach((index) => {
      const md = getMonthDataFromArray(index);
      if (md.hasData) {
        valores.push(Math.abs(md.entradas), Math.abs(md.saidas));
      }
    });
    return valores.length ? Math.max(...valores, 1) : 1;
  }, [indices]);

  const candles: CandleGeometry[] = useMemo(
    () =>
      indices.map((idx, order) => {
        const md = getMonthDataFromArray(idx);
        const isFuture = idx > CURRENT_INDEX;
        const showBars = md.hasData && idx >= FINANCIAL_START_INDEX && !isFuture;

        const entradaHeight = showBars
          ? Math.max((Math.abs(md.entradas) / maxValue) * BAR_ZONE, 4)
          : 0;

        const saidaHeight = showBars
          ? Math.max((Math.abs(md.saidas) / maxValue) * BAR_ZONE, 4)
          : 0;

        const xCenter = order * SLOT + BAR_WIDTH;
        const saldo = idx < FINANCIAL_START_INDEX ? 0 : getSaldoAtIndex(idx);
        const yLine = zeroY - (saldo / lineMax) * BAR_ZONE;

        return {
          index: idx,
          order,
          isFuture,
          showBars,
          entradaHeight,
          saidaHeight,
          xCenter,
          yLine,
        };
      }),
    [indices, maxValue, lineMax, zeroY],
  );

  const balancePath = useMemo(
    () => catmullRom2bezier(candles.map((c) => [c.xCenter, c.yLine])),
    [candles],
  );

  const baseOffset = (startVis - MIN_INDEX) * SLOT;
  const translateX = -baseOffset;

  const shouldAnimate = hasMountedRef.current && !isDraggingRef.current;

  const dragStartXRef = useRef<number | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = e.clientX;
    dragStartIndexRef.current = selectedIndex;
    isDraggingRef.current = true;

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartXRef.current == null || dragStartIndexRef.current == null) return;

    const deltaX = e.clientX - dragStartXRef.current;
    const steps = Math.round(deltaX / SLOT);

    const baseIndex = dragStartIndexRef.current;
    const targetIndex = clamp(baseIndex - steps, MIN_INDEX, CURRENT_INDEX);

    if (targetIndex !== selectedIndex) {
      onSelect(targetIndex);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartXRef.current = null;
    dragStartIndexRef.current = null;
    isDraggingRef.current = false;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: chartHeight + 24 }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#f2eeff] to-transparent z-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#f2eeff] to-transparent z-40"
        aria-hidden
      />

      <div
        className="relative px-2 sm:px-4"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: chartWidth,
          height: chartHeight,
          margin: '0 auto',
          touchAction: 'pan-y',
        }}
      >
        {/* TRACK ÚNICO – linhas + velas */}
        <div
          className="relative flex items-end"
          style={{
            width: trackWidth,
            height: chartHeight,
            gap: GAP,
            transform: `translateX(${translateX}px)`,
            transition: shouldAnimate
              ? `transform ${CAROUSEL_TRANSITION_MS}ms cubic-bezier(.22, 1, .36, 1)`
              : undefined,
            willChange: 'transform',
          }}
        >
          <svg
            width={trackWidth}
            height={chartHeight}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <path
              d={balancePath}
              fill="none"
              stroke="#2D004A"
              strokeWidth={2}
              strokeDasharray="6 6"
              opacity={0.9}
            />

            {(() => {
              const candle = candles.find((c) => c.index === selectedIndex);
              if (!candle) return null;
              return (
                <circle
                  cx={candle.xCenter}
                  cy={candle.yLine}
                  r={6}
                  fill="#2D004A"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })()}
          </svg>

          {candles.map((candle) => {
            const isSelected = candle.index === selectedIndex;

            return (
              <button
                key={candle.index}
                type="button"
                className="flex flex-col items-center focus:outline-none"
                style={{
                  width: BAR_WIDTH * 2,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: candle.isFuture ? 'default' : 'pointer',
                  opacity: candle.isFuture ? 0.3 : 1,
                }}
                onClick={() => {
                  if (!candle.isFuture) onSelect(candle.index);
                }}
              >
                <div
                  style={{
                    height: BAR_ZONE,
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  {candle.showBars && (
                    <div
                      className="rounded-full"
                      style={{
                        width: BAR_WIDTH,
                        height: candle.entradaHeight,
                        marginTop: BAR_ZONE - candle.entradaHeight,
                        background: '#7c3aed',
                      }}
                    />
                  )}
                </div>
                <div style={{ height: 8 }} />
                <div
                  style={{
                    height: BAR_ZONE,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  {candle.showBars && (
                    <div
                      className="rounded-full"
                      style={{
                        width: BAR_WIDTH,
                        height: candle.saidaHeight,
                        background: '#c4b5fd',
                      }}
                    />
                  )}
                </div>
                <span
                  className={`mt-0.5 text-xs font-medium ${
                    isSelected ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  style={{ marginTop: 2 }}
                >
                  {monthNameFromIndex(candle.index, false)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tooltip fora do track (não sofre transform) */}
        {(() => {
          const candle = candles.find((c) => c.index === selectedIndex);
          if (!candle) return null;
          const saldo = getSaldoAtIndex(selectedIndex);

          const { width: w, height: h } = tooltipSize;
          const padding = 8;

          // centro do ponto na área visível (chart)
          const centerX = candle.xCenter + translateX;

          let left = centerX - (w || 0) / 2;
          if (w) {
            if (left < padding) left = padding;
            if (left + w > chartWidth - padding) {
              left = chartWidth - padding - w;
            }
          }

          // agora fica colado 8px acima do handle
          const baseTop = h ? candle.yLine - h - 8 : candle.yLine - 32;
          let top = baseTop;

          // se ainda encostar no topo, joga pra baixo
          if (h && baseTop < padding) {
            top = candle.yLine + 12;
          }

          return (
            <div
              ref={tooltipRef}
              className="pointer-events-none absolute z-30"
              style={{
                left,
                top,
                whiteSpace: 'nowrap',
              }}
            >
              <div className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-md border border-gray-100">
                {formatCurrencyFull(saldo)}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function CashflowCard() {
  const [selectedIndex, setSelectedIndex] = useState<number>(CURRENT_INDEX);

  const dadosMes = useMemo(() => {
    const saldo = getSaldoAtIndex(selectedIndex);
    const saldoInicial = getSaldoAtIndex(selectedIndex - 1);
    const md = getMonthDataFromArray(selectedIndex);

    return {
      entradas: md.hasData ? md.entradas : 0,
      saidas: md.hasData ? md.saidas : 0,
      saldo,
      saldoInicial,
    };
  }, [selectedIndex]);

  const handlePrevious = () => {
    setSelectedIndex((prev) => Math.max(MIN_INDEX, prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => Math.min(CURRENT_INDEX, prev + 1));
  };

  const canGoNext = selectedIndex < CURRENT_INDEX;

  return (
    <section aria-label="Fluxo de caixa" className="h-full w-full">
      <div className="flex h-full w-full flex-col rounded-2xl bg-[#f2eeff] shadow-sm px-5 py-4 gap-4">
        <div className="flex-1 flex w-full flex-col gap-4 sm:flex-row sm:gap-4">
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <CashflowCarousel
              data={CASHFLOW_MOCK}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              windowSize={7}
            />
          </div>

          <aside className="w-full min-w-0 sm:w-[260px] flex items-stretch">
            <SummaryPanel
              entradas={dadosMes.entradas}
              saidas={dadosMes.saidas}
              saldo={dadosMes.saldo}
              saldoInicial={dadosMes.saldoInicial}
              topNavigator={
                <MonthNavigator
                  mesAtual={monthNameFromIndex(selectedIndex, true)}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  canGoNext={canGoNext}
                />
              }
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
