import * as React from 'react';
import { Button } from './button';
import { cn } from './utils';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Ocorreu um erro.', onRetry, retryLabel = 'Tentar novamente', className, ...rest }) => (
  <div role="alert" data-testid="error-state" className={cn('border border-red-300 dark:border-red-700 rounded-md p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm flex items-start gap-3', className)} {...rest}>
    <span className="sr-only">Erro:</span>
    <div className="flex-1">
      {message}
    </div>
    {onRetry && <Button aria-label={retryLabel} onClick={onRetry} variant="outline" size="sm">{retryLabel}</Button>}
  </div>
);
