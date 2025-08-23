import * as React from 'react';
import { cn } from './utils';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'table' | 'form' | 'inline';
  rows?: number; // para tabela / form
}

const base = 'animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded';

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ variant = 'card', rows = 3, className, ...rest }) => {
  if (variant === 'inline') return <span aria-busy="true" className={cn(base, 'inline-block align-middle h-3 w-16', className)} {...rest} />;
  if (variant === 'card') return <div aria-busy="true" role="status" data-testid="loading-skeleton" className={cn('space-y-2', className)} {...rest}>
    <div className={cn(base, 'h-4 w-1/3')} />
    <div className={cn(base, 'h-3 w-2/3')} />
    <div className={cn(base, 'h-3 w-1/2')} />
  </div>;
  if (variant === 'table') return (
    <div aria-busy="true" role="status" data-testid="loading-skeleton" className={cn('space-y-2', className)} {...rest}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={cn(base, 'h-4 w-full')} />
      ))}
    </div>
  );
  if (variant === 'form') return (
    <div aria-busy="true" role="status" data-testid="loading-skeleton" className={cn('space-y-3', className)} {...rest}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className={cn(base, 'h-3 w-24')} />
          <div className={cn(base, 'h-9 w-full')} />
        </div>
      ))}
    </div>
  );
  return null;
};
