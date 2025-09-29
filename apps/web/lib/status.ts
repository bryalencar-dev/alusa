export interface StatusBadgeProps {
  label: string;
  className: string;
}

const STATUS_STYLES: Record<string, StatusBadgeProps> = {
  ATIVO: {
    label: 'Ativo',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  INATIVO: {
    label: 'Inativo',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  PENDENTE: {
    label: 'Pendente',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
};

export function getStatusBadgeProps(status: string | null | undefined): StatusBadgeProps {
  if (!status) {
    return { label: '—', className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  const normalized = status.toUpperCase();
  return (
    STATUS_STYLES[normalized] || {
      label: normalized,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  );
}
