/**
 * Mapeamento de status Asaas para status interno e badges UI
 *
 * @module asaas-status-mapper
 *
 * @see https://docs.asaas.com/docs/payment-events
 */

import { StatusCobranca } from '@prisma/client';

/**
 * Status retornados pela API Asaas
 */
export type AsaasPaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS'
  | 'DELETED'
  | 'FAILED';

/**
 * Configuração de badge para cada status
 */
export interface BadgeConfig {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: string;
  description?: string;
}

/**
 * Mapeia status Asaas para StatusCobranca interno
 */
export function mapAsaasStatusToInternal(asaasStatus: AsaasPaymentStatus): StatusCobranca {
  const mapping: Record<AsaasPaymentStatus, StatusCobranca> = {
    PENDING: StatusCobranca.PENDENTE,
    AWAITING_RISK_ANALYSIS: StatusCobranca.PROCESSANDO,
    CONFIRMED: StatusCobranca.PROCESSANDO,
    RECEIVED: StatusCobranca.PAGO,
    RECEIVED_IN_CASH: StatusCobranca.PAGO,
    OVERDUE: StatusCobranca.ATRASADO,
    REFUNDED: StatusCobranca.ESTORNADO,
    REFUND_REQUESTED: StatusCobranca.PROCESSANDO,
    CHARGEBACK_REQUESTED: StatusCobranca.PROCESSANDO,
    CHARGEBACK_DISPUTE: StatusCobranca.PROCESSANDO,
    AWAITING_CHARGEBACK_REVERSAL: StatusCobranca.PROCESSANDO,
    DUNNING_REQUESTED: StatusCobranca.ATRASADO,
    DUNNING_RECEIVED: StatusCobranca.PAGO,
    DELETED: StatusCobranca.CANCELADO,
    FAILED: StatusCobranca.CANCELADO,
  };

  return mapping[asaasStatus] || StatusCobranca.PENDENTE;
}

/**
 * Retorna configuração de badge para status Asaas
 */
export function getAsaasStatusBadge(asaasStatus: AsaasPaymentStatus): BadgeConfig {
  const badges: Record<AsaasPaymentStatus, BadgeConfig> = {
    PENDING: {
      label: 'Aguardando pagamento',
      variant: 'warning',
      icon: '⏳',
      description: 'Cobrança criada, aguardando pagamento',
    },
    AWAITING_RISK_ANALYSIS: {
      label: 'Em análise',
      variant: 'info',
      icon: '🔍',
      description: 'Pagamento com cartão em análise de risco',
    },
    CONFIRMED: {
      label: 'Confirmado',
      variant: 'info',
      icon: '✓',
      description: 'Pagamento confirmado, aguardando compensação',
    },
    RECEIVED: {
      label: 'Pago',
      variant: 'success',
      icon: '✓',
      description: 'Pagamento recebido com sucesso',
    },
    RECEIVED_IN_CASH: {
      label: 'Pago (Dinheiro)',
      variant: 'success',
      icon: '💵',
      description: 'Confirmado recebimento em dinheiro',
    },
    OVERDUE: {
      label: 'Vencido',
      variant: 'danger',
      icon: '⚠️',
      description: 'Cobrança vencida e não paga',
    },
    REFUNDED: {
      label: 'Reembolsado',
      variant: 'info',
      icon: '↩️',
      description: 'Pagamento reembolsado ao cliente',
    },
    REFUND_REQUESTED: {
      label: 'Reembolso solicitado',
      variant: 'info',
      icon: '🔄',
      description: 'Solicitação de reembolso em processamento',
    },
    CHARGEBACK_REQUESTED: {
      label: 'Contestação',
      variant: 'danger',
      icon: '⚠️',
      description: 'Cliente contestou o pagamento',
    },
    CHARGEBACK_DISPUTE: {
      label: 'Disputa aberta',
      variant: 'danger',
      icon: '⚖️',
      description: 'Disputa de chargeback em andamento',
    },
    AWAITING_CHARGEBACK_REVERSAL: {
      label: 'Aguardando reversão',
      variant: 'warning',
      icon: '⏳',
      description: 'Aguardando reversão de chargeback',
    },
    DUNNING_REQUESTED: {
      label: 'Negativação solicitada',
      variant: 'danger',
      icon: '📋',
      description: 'Processo de negativação iniciado',
    },
    DUNNING_RECEIVED: {
      label: 'Pago após negativação',
      variant: 'success',
      icon: '✓',
      description: 'Pagamento recebido após negativação',
    },
    DELETED: {
      label: 'Cancelado',
      variant: 'neutral',
      icon: '❌',
      description: 'Cobrança cancelada',
    },
    FAILED: {
      label: 'Falha no pagamento',
      variant: 'danger',
      icon: '❌',
      description: 'Erro ao processar pagamento',
    },
  };

  return (
    badges[asaasStatus] || {
      label: 'Desconhecido',
      variant: 'neutral',
      icon: '❓',
      description: 'Status não reconhecido',
    }
  );
}

/**
 * Calcula status dinâmico baseado na data de vencimento e status atual
 *
 * Regras:
 * - Se status é PAGO, CANCELADO, ESTORNADO ou ESTORNADO_PARCIAL: mantém o status (imutável)
 * - Se vencimento é futuro: A_VENCER
 * - Se vencimento é hoje: PENDENTE
 * - Se vencimento passou e não foi pago: ATRASADO
 */
export function calculateDynamicStatus(
  currentStatus: StatusCobranca,
  dueDate: Date | string,
): StatusCobranca {
  // Status finais não mudam
  const immutableStatuses: StatusCobranca[] = [
    StatusCobranca.PAGO,
    StatusCobranca.CANCELADO,
    StatusCobranca.ESTORNADO,
    StatusCobranca.ESTORNADO_PARCIAL,
  ];

  if (immutableStatuses.includes(currentStatus)) {
    return currentStatus;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    // Vencimento futuro
    return StatusCobranca.A_VENCER;
  } else if (diffDays === 0) {
    // Vence hoje
    return StatusCobranca.PENDENTE;
  } else {
    // Já venceu
    return StatusCobranca.ATRASADO;
  }
}

/**
 * Retorna configuração de badge para StatusCobranca interno
 */
export function getInternalStatusBadge(status: StatusCobranca): BadgeConfig {
  const badges: Record<StatusCobranca, BadgeConfig> = {
    A_VENCER: {
      label: 'A vencer',
      variant: 'info',
      icon: '📅',
      description: 'Vencimento futuro',
    },
    PENDENTE: {
      label: 'Pendente',
      variant: 'warning',
      icon: '⏳',
      description: 'Aguardando pagamento',
    },
    PROCESSANDO: {
      label: 'Processando',
      variant: 'info',
      icon: '🔄',
      description: 'Pagamento em processamento',
    },
    PAGO: {
      label: 'Pago',
      variant: 'success',
      icon: '✓',
      description: 'Pagamento confirmado',
    },
    ATRASADO: {
      label: 'Em atraso',
      variant: 'danger',
      icon: '⚠️',
      description: 'Pagamento em atraso',
    },
    CANCELADO: {
      label: 'Cancelada',
      variant: 'neutral',
      icon: '❌',
      description: 'Cobrança cancelada',
    },
    ESTORNADO: {
      label: 'Estornada',
      variant: 'info',
      icon: '↩️',
      description: 'Pagamento reembolsado integralmente',
    },
    ESTORNADO_PARCIAL: {
      label: 'Estornada Parcialmente',
      variant: 'warning',
      icon: '↩️',
      description: 'Pagamento reembolsado parcialmente',
    },
  };

  return (
    badges[status] || {
      label: 'Desconhecido',
      variant: 'neutral',
      icon: '❓',
      description: 'Status não reconhecido',
    }
  );
}

/**
 * Verifica se a cobrança pode ser reenviada
 */
export function canResendPayment(status: AsaasPaymentStatus | StatusCobranca): boolean {
  const resendableAsaas: AsaasPaymentStatus[] = ['PENDING', 'OVERDUE'];
  const resendableInternal: StatusCobranca[] = [StatusCobranca.PENDENTE, StatusCobranca.ATRASADO];

  if (Object.values(StatusCobranca).includes(status as StatusCobranca)) {
    return resendableInternal.includes(status as StatusCobranca);
  }

  return resendableAsaas.includes(status as AsaasPaymentStatus);
}

/**
 * Verifica se a cobrança está paga
 */
export function isPaid(status: AsaasPaymentStatus | StatusCobranca): boolean {
  const paidAsaas: AsaasPaymentStatus[] = ['RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED'];
  const paidInternal: StatusCobranca[] = [StatusCobranca.PAGO, StatusCobranca.PROCESSANDO];

  if (Object.values(StatusCobranca).includes(status as StatusCobranca)) {
    return paidInternal.includes(status as StatusCobranca);
  }

  return paidAsaas.includes(status as AsaasPaymentStatus);
}
