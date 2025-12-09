import * as React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'destructive' | 'outline' | 'warning' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-violet-100 text-violet-700 border-violet-200',
  destructive: 'bg-rose-100 text-rose-700 border-rose-200',
  outline: 'bg-white text-gray-700 border-gray-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border';
  return <span className={cn(base, VARIANT_STYLES[variant], className)} {...props} />;
};
