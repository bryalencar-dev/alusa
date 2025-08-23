import * as React from 'react';
import { Button } from './button';
import { cn } from './utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message = 'Nada encontrado', actionLabel, onAction, icon, className, ...rest }) => (
  <div role="status" data-testid="empty-state" aria-live="polite" className={cn('flex flex-col items-center justify-center text-center border border-dashed rounded-md p-8 bg-neutral-50 dark:bg-neutral-800/40', className)} {...rest}>
    {icon && <div aria-hidden className="mb-3 text-neutral-500 dark:text-neutral-400">{icon}</div>}
    {title && <h3 className="font-medium text-sm mb-1">{title}</h3>}
    <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm">{message}</p>
    {actionLabel && onAction && <Button className="mt-4" size="sm" onClick={onAction}>{actionLabel}</Button>}
  </div>
);
