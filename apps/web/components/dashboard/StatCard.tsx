"use client";
import React from 'react';
import clsx from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  loading?: boolean;
  trend?: { value: number; direction: 'up' | 'down' | 'flat'; label?: string };
  className?: string;
}

export function StatCard({ title, value, icon, hint, loading, trend, className }: StatCardProps) {
  return (
    <div className={clsx(
      'group relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-[#A94DFF]/50',
      loading && 'animate-pulse',
      className
    )}>
  <div className="absolute inset-px rounded-[11px] bg-gradient-to-br from-[#A94DFF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-medium text-gray-600 tracking-wide flex items-center gap-1">
            {icon && <span className="text-gray-500 group-hover:text-gray-700 transition-colors">{icon}</span>}
            {title}
          </h3>
        </div>
        {trend && (
          <span className={clsx('text-[11px] font-medium px-2 py-0.5 rounded-full',
            trend.direction === 'up' && 'bg-emerald-100 text-emerald-600',
            trend.direction === 'down' && 'bg-rose-100 text-rose-600',
            trend.direction === 'flat' && 'bg-gray-100 text-gray-400'
          )}>
            {trend.direction !== 'flat' && (trend.direction === 'up' ? '▲' : '▼')}{' '}{trend.value}%
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
        {loading ? <span className="inline-block h-6 w-20 rounded bg-gray-200" /> : value}
      </p>
      {hint && <p className="mt-2 text-[11px] text-gray-500 leading-snug max-w-[220px]">{hint}</p>}
    </div>
  );
}
