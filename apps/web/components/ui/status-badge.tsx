/**
 * StatusBadge Component
 *
 * Componente reutilizável para exibir status de cobrança/pagamento
 * com aparência padronizada, ícones e cores consistentes.
 *
 * @module StatusBadge
 * @example
 * ```tsx
 * <StatusBadge status="CONFIRMED" />
 * <StatusBadge status="PENDING" />
 * <StatusBadge status="OVERDUE" />
 * ```
 */

import * as React from 'react';
import { cn } from '@/lib/cn';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  NoSymbolIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  PauseIcon,
} from '@heroicons/react/24/solid';

/**
 * Mapeamento de status para configuração visual
 */
const statusConfig = {
  // Estados de sucesso/confirmação
  CONFIRMED: {
    text: 'Pagamento Confirmado',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  RECEIVED: {
    text: 'Pagamento Recebido',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  PAGO: {
    text: 'Pago',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },

  // Estados de pendência/aguardando
  PENDING: {
    text: 'Aguardando Pagamento',
    icon: ClockIcon,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  PENDENTE: {
    text: 'Pendente',
    icon: ClockIcon,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },

  // Estados de atraso/alerta
  OVERDUE: {
    text: 'Atrasado',
    icon: ExclamationTriangleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  ATRASADO: {
    text: 'Atrasado',
    icon: ExclamationTriangleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },

  // Estados de falha/erro
  FAILED: {
    text: 'Falha no Pagamento',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },

  // Estados de reembolso
  REFUNDED: {
    text: 'Reembolsado',
    icon: ArrowPathIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  REFUND_REQUESTED: {
    text: 'Reembolso Solicitado',
    icon: ArrowPathIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },

  // Estados de cancelamento
  CANCELED: {
    text: 'Cancelado',
    icon: NoSymbolIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  CANCELADO: {
    text: 'Cancelado',
    icon: NoSymbolIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  EXPIRADO: {
    text: 'Expirado',
    icon: NoSymbolIcon,
    className: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  },
  ISENTO: {
    text: 'Isento',
    icon: CheckCircleIcon,
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },

  // Pagamento manual
  MANUAL: {
    text: 'Pago Manualmente',
    icon: BanknotesIcon,
    className: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  RECEIVED_IN_CASH: {
    text: 'Pago em Dinheiro',
    icon: BanknotesIcon,
    className: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  ESTORNADO: {
    text: 'Estornado',
    icon: ArrowPathIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  PROCESSANDO: {
    text: 'Processando',
    icon: ClockIcon,
    className: 'bg-orange-100 text-orange-700 border-orange-300',
  },

  // Status de entidades (Alunos, Professores, Colaboradores, Turmas, Usuários)
  ATIVO: {
    text: 'Ativo',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  ENCERRADO: {
    text: 'Encerrado',
    icon: NoSymbolIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  INATIVO: {
    text: 'Inativo',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },

  // Funções/Roles
  ADMIN: {
    text: 'Admin',
    icon: UserIcon,
    className: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  PROFESSOR: {
    text: 'Professor',
    icon: AcademicCapIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  INSTRUTOR: {
    text: 'Instrutor',
    icon: AcademicCapIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  SECRETARIA: {
    text: 'Secretaria',
    icon: BuildingOfficeIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  RECEPCIONISTA: {
    text: 'Recepcionista',
    icon: UserIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  GERENTE: {
    text: 'Gerente',
    icon: UserIcon,
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  },

  // Dias da semana (para turmas)
  SEGUNDA: {
    text: 'Segunda',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },
  TERCA: {
    text: 'Terça',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },
  QUARTA: {
    text: 'Quarta',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },
  QUINTA: {
    text: 'Quinta',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },
  SEXTA: {
    text: 'Sexta',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },
  SABADO: {
    text: 'Sábado',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },
  DOMINGO: {
    text: 'Domingo',
    icon: CalendarDaysIcon,
    className: 'bg-violet-100 text-violet-700 border-violet-300',
  },

  // Status de Matrícula
  PENDENTE_TAXA: {
    text: 'Pendente Taxa',
    icon: ClockIcon,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  AGUARDANDO_CONFIRMACAO: {
    text: 'Aguardando Confirmação',
    icon: ClockIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  ATIVA: {
    text: 'Ativa',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  PAUSADA: {
    text: 'Pausada',
    icon: PauseIcon,
    className: 'bg-amber-100 text-amber-700 border-amber-300',
  },
  RECUSADA: {
    text: 'Recusada',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  CANCELADA: {
    text: 'Cancelada',
    icon: NoSymbolIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },

  // Status Financeiro
  ADIMPLENTE: {
    text: 'Adimplente',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  },
  INADIMPLENTE: {
    text: 'Inadimplente',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },

  // Roles adicionais
  RECEPCAO: {
    text: 'Recepção',
    icon: UserIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  FINANCEIRO: {
    text: 'Financeiro',
    icon: BanknotesIcon,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  RESPONSAVEL: {
    text: 'Responsável',
    icon: UserIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  ADMINISTRATIVO: {
    text: 'Administrativo',
    icon: BuildingOfficeIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  OUTRO: {
    text: 'Outro',
    icon: UserIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },

  // Status de Convites
  PENDING_INVITE: {
    text: 'Pendente',
    icon: ClockIcon,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  ACCEPTED: {
    text: 'Aceito',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  REVOKED: {
    text: 'Revogado',
    icon: XCircleIcon,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  EXPIRED: {
    text: 'Expirado',
    icon: NoSymbolIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },

  // Outros status genéricos
  DISPONIVEL: {
    text: 'Disponível',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  INDISPONIVEL: {
    text: 'Indisponível',
    icon: NoSymbolIcon,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  EM_ANDAMENTO: {
    text: 'Em Andamento',
    icon: ClockIcon,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  CONCLUIDO: {
    text: 'Concluído',
    icon: CheckCircleIcon,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  AGUARDANDO: {
    text: 'Aguardando',
    icon: ClockIcon,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
} as const;

export type StatusType = keyof typeof statusConfig;

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Status a ser exibido
   */
  status: StatusType;
  /**
   * Exibir ícone junto com o texto
   * @default true
   */
  showIcon?: boolean;
  /**
   * Tamanho do badge
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

/**
 * Componente StatusBadge
 *
 * Exibe um badge com status de cobrança/pagamento
 * com ícone, cor e texto apropriados.
 */
export function StatusBadge({
  status,
  showIcon = true,
  size = 'default',
  className,
  ...props
}: StatusBadgeProps) {
  // Fallback para status desconhecidos
  const config = statusConfig[status] ?? statusConfig.PENDING;
  const Icon = config.icon;

  // Variações de tamanho
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    default: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3 flex-shrink-0',
    default: 'h-3.5 w-3.5 flex-shrink-0',
    lg: 'h-4 w-4 flex-shrink-0',
  };

  return (
    <span
      className={cn(
        // Base styles - whitespace-nowrap garante que não quebre em duas linhas
        'rounded-full border inline-flex items-center font-medium whitespace-nowrap',
        // Size variant
        sizeClasses[size],
        // Color variant
        config.className,
        // Custom classes
        className,
      )}
      aria-label={config.text}
      {...props}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span>{config.text}</span>
    </span>
  );
}

/**
 * Hook para obter as configurações de um status
 * Útil para uso em outros componentes
 */
export function useStatusConfig(status: StatusType) {
  return statusConfig[status] ?? statusConfig.PENDING;
}

/**
 * Função helper para determinar se um status é considerado "pago"
 */
export function isStatusPaid(status: StatusType): boolean {
  return ['CONFIRMED', 'RECEIVED', 'PAGO', 'MANUAL', 'RECEIVED_IN_CASH', 'CONCLUIDO'].includes(
    status,
  );
}

/**
 * Função helper para determinar se um status é considerado "pendente"
 */
export function isStatusPending(status: StatusType): boolean {
  return ['PENDING', 'PENDENTE', 'AGUARDANDO', 'PROCESSANDO'].includes(status);
}

/**
 * Função helper para determinar se um status é considerado "atrasado"
 */
export function isStatusOverdue(status: StatusType): boolean {
  return ['OVERDUE', 'ATRASADO'].includes(status);
}

/**
 * Função helper para determinar se um status é considerado "falha"
 */
export function isStatusFailed(status: StatusType): boolean {
  return ['FAILED'].includes(status);
}

/**
 * Função helper para determinar se um status é considerado "ativo"
 */
export function isStatusActive(status: StatusType): boolean {
  return ['ATIVO', 'DISPONIVEL', 'EM_ANDAMENTO'].includes(status);
}

/**
 * Função helper para determinar se um status é considerado "inativo"
 */
export function isStatusInactive(status: StatusType): boolean {
  return ['INATIVO', 'INDISPONIVEL', 'CANCELADO', 'CANCELED'].includes(status);
}
