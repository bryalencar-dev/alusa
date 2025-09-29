'use client';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, CheckCircle } from '@/components/icons/icons';
import { cn } from '@/lib/cn';

export type StatusValue = 'TODOS' | 'ATIVO' | 'INATIVO';
export type SortOrder = 'ASC' | 'DESC';

interface EntityFiltersBarProps {
  searchValue: string;
  onSearchChange: (_v: string) => void;
  onSearchEnter?: () => void;
  searchPlaceholder?: string;
  statusValue: StatusValue;
  onStatusChange: (_v: StatusValue) => void;
  sortOrder: SortOrder;
  onSortChange: (_o: SortOrder) => void;
  className?: string;
  extraLeft?: ReactNode; // espaço para futuros filtros específicos
}

export default function EntityFiltersBar({
  searchValue,
  onSearchChange,
  onSearchEnter,
  searchPlaceholder = 'Buscar...',
  statusValue,
  onStatusChange,
  sortOrder,
  onSortChange,
  className = '',
  extraLeft,
}: EntityFiltersBarProps) {
  return (
    <div className={cn('flex w-full flex-col gap-3 md:flex-row md:items-center', className)}>
      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
        {extraLeft}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-none"
            >
              <Filter className="h-4 w-4 mr-2" /> Filtro
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Ordenar por nome
            </div>
            <DropdownMenuItem
              onClick={() => onSortChange('ASC')}
              className={'justify-between ' + (sortOrder === 'ASC' ? 'text-brand-accent' : '')}
            >
              A–Z (crescente)
              {sortOrder === 'ASC' ? <CheckCircle className="h-4 w-4" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortChange('DESC')}
              className={'justify-between ' + (sortOrder === 'DESC' ? 'text-brand-accent' : '')}
            >
              Z–A (decrescente)
              {sortOrder === 'DESC' ? <CheckCircle className="h-4 w-4" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Select value={statusValue} onValueChange={(v: StatusValue) => onStatusChange(v)}>
          <SelectTrigger className="h-10 w-full md:w-auto md:min-w-[150px] md:max-w-[190px] shrink-0 whitespace-nowrap bg-white text-gray-700 border border-gray-300 shadow-none px-3 flex items-center justify-between gap-2">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent align="end" className="text-[13px]">
            <SelectItem value="TODOS">Todos os status</SelectItem>
            <SelectItem value="ATIVO">Ativa</SelectItem>
            <SelectItem value="INATIVO">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="relative w-full md:ml-auto md:flex-1 md:max-w-[360px] lg:max-w-[420px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchEnter?.();
          }}
          className="h-10 pl-10 border border-gray-300 shadow-none"
        />
      </div>
    </div>
  );
}
