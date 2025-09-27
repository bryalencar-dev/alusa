import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Layout reutilizável para páginas com tabela + header de filtros/ações.
 * Mantém consistência visual entre entidades.
 */
export interface TableLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode; // barra de ações (botões, selects)
  filtersBar?: React.ReactNode; // área complementar (ex: busca)
  children: React.ReactNode; // tabela ou grid
  footer?: React.ReactNode; // paginação
  className?: string;
}

export function TableLayout({
  title,
  subtitle,
  actions,
  filtersBar,
  children,
  footer,
  className,
}: TableLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="space-y-1">
        <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
      </div>
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 flex-wrap">{actions}</div>
          <div className="flex-1 md:flex-none w-full md:w-auto">{filtersBar}</div>
        </div>
      </div>
      {children}
      {footer}
    </div>
  );
}

export default TableLayout;
