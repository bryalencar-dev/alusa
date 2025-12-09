import { Badge } from '@/components/ui/badge';
import { StatusCobranca } from '@prisma/client';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';

interface StatusPagamentoBadgeProps {
  status: StatusCobranca;
  className?: string;
}

const statusConfig: Record<StatusCobranca, { label: string; icon: any; className: string }> = {
  [StatusCobranca.A_VENCER]: {
    label: 'A Vencer',
    icon: ClockIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  [StatusCobranca.PENDENTE]: {
    label: 'Aguardando Pagamento',
    icon: ClockIcon,
    className: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  [StatusCobranca.PROCESSANDO]: {
    label: 'Processando',
    icon: ArrowPathIcon,
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  },
  [StatusCobranca.PAGO]: {
    label: 'Pagamento Confirmado',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  [StatusCobranca.ATRASADO]: {
    label: 'Pagamento Atrasado',
    icon: ExclamationTriangleIcon,
    className: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  [StatusCobranca.CANCELADO]: {
    label: 'Cancelado',
    icon: XCircleIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  [StatusCobranca.ESTORNADO]: {
    label: 'Pagamento Estornado',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  [StatusCobranca.ESTORNADO_PARCIAL]: {
    label: 'Estorno Parcial',
    icon: XCircleIcon,
    className: 'bg-red-50 text-red-600 border-red-200',
  },
};

export function StatusPagamentoBadge({ status, className }: StatusPagamentoBadgeProps) {
  const config = statusConfig[status] || statusConfig[StatusCobranca.PENDENTE];
  const Icon = config.icon;

  return (
    <Badge
      className={`inline-flex items-center gap-1.5 font-medium ${config.className} ${className || ''}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs">{config.label}</span>
    </Badge>
  );
}
