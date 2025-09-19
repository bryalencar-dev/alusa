"use client";
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

type ColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<TData>({ columns, data, loading, emptyMessage }: DataTableProps<TData>) {
  const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <table className="w-full">
        <thead className="h-12 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => {
                const meta = (h.column.columnDef.meta as ColumnMeta | undefined) || {};
                const thClass = meta.headerClassName || 'text-left';
                return (
                  <th key={h.id} className={`px-4 h-12 align-middle ${thClass}`}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`} className="odd:bg-white even:bg-slate-50">
                <td colSpan={columns.length} className="px-4 h-16">
                  <div className="animate-pulse flex items-center gap-4">
                    <div className="h-4 w-1/3 bg-slate-200 rounded" />
                    <div className="h-4 w-1/4 bg-slate-200 rounded" />
                    <div className="h-4 w-1/5 bg-slate-200 rounded" />
                  </div>
                </td>
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">{emptyMessage || 'Sem dados'}</td>
            </tr>
          ) : (
            table.getRowModel().rows.map(r => (
              <tr key={r.id} className="h-16 odd:bg-white even:bg-slate-50 hover:bg-slate-50">
                {r.getVisibleCells().map(cell => {
                  const meta = (cell.column.columnDef.meta as ColumnMeta | undefined) || {};
                  const tdClass = meta.cellClassName || 'text-left';
                  return (
                    <td key={cell.id} className={`px-4 h-16 align-middle text-sm text-slate-700 ${tdClass}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
