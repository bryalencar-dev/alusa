import { Badge } from '@/components/ui/badge';
import { StatusFinanceiro } from '@prisma/client';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface StatusFinanceiroBadgeProps {
  status: StatusFinanceiro;
  className?: string;
}

const statusConfig = {
  [StatusFinanceiro.ADIMPLENTE]: {
    label: 'Adimplente',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  [StatusFinanceiro.PENDENTE_TAXA]: {
    label: 'Pendente',
    icon: ExclamationCircleIcon,
    className: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  [StatusFinanceiro.INADIMPLENTE]: {
    label: 'Inadimplente',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
};

export function StatusFinanceiroBadge({ status, className }: StatusFinanceiroBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={`inline-flex items-center gap-1.5 ${config.className} ${className || ''}`}>
      <Icon className="h-4 w-4" />
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
}
