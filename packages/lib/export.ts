import { utils, write } from 'xlsx';

export function toCSV<T extends Record<string, unknown>>(rows: T[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g,'""');
    if (/[";,\n]/.test(s)) return '"'+s+'"';
    return s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

export function toXLSX<T extends Record<string, unknown>>(rows: T[]): Buffer {
  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Dados');
  return write(wb, { type: 'buffer', bookType: 'xlsx' });
}