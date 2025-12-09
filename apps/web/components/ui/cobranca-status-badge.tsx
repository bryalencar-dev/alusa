/**
 * Componente Badge para exibir status de cobranças
 *
 * @module CobrancaStatusBadge
 */

import { StatusCobranca } from '@prisma/client';
import {
  getInternalStatusBadge,
  getAsaasStatusBadge,
  type AsaasPaymentStatus,
} from '@/lib/asaas-status-mapper';

interface CobrancaStatusBadgeProps {
  status: StatusCobranca | AsaasPaymentStatus;
  isAsaasStatus?: boolean;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

export function CobrancaStatusBadge({
  status,
  isAsaasStatus = false,
  showIcon = true,
  showDescription = false,
  className = '',
}: CobrancaStatusBadgeProps) {
  const config = isAsaasStatus
    ? getAsaasStatusBadge(status as AsaasPaymentStatus)
    : getInternalStatusBadge(status as StatusCobranca);

  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    warning: 'bg-amber-100 text-amber-700 border-amber-300',
    danger: 'bg-red-100 text-red-700 border-red-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs border inline-flex items-center gap-1.5 font-medium ${variantClasses[config.variant]}`}
        title={config.description}
      >
        {showIcon && config.icon && <span className="text-xs">{config.icon}</span>}
        <span className="text-xs">{config.label}</span>
      </span>
      {showDescription && config.description && (
        <span className="text-xs text-gray-500">{config.description}</span>
      )}
    </div>
  );
}
