import { Badge } from '@/components/ui/badge';
import { getStatusBadgeProps } from '@/lib/status';
import React from 'react';

export interface StatusBadgeComponentProps {
  status: string | null | undefined;
  className?: string;
  children?: React.ReactNode; // optional override label
}

export function StatusBadge({ status, className, children }: StatusBadgeComponentProps) {
  const statusProps = getStatusBadgeProps(status);
  return (
    <Badge
      variant="outline"
      className={`text-xs ${statusProps.className} ${className || ''}`.trim()}
    >
      {children ?? statusProps.label}
    </Badge>
  );
}

export default StatusBadge;
