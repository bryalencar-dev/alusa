import * as React from 'react';
import { cn } from '@/lib/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { variant?: 'default'|'destructive'|'outline'; }

export const Badge: React.FC<BadgeProps> = ({ className, variant='default', ...props }) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border';
  const styles = variant==='destructive'
    ? 'bg-rose-100 text-rose-700 border-rose-200'
    : variant==='outline'
      ? 'bg-white text-gray-700 border-gray-300'
      : 'bg-violet-100 text-violet-700 border-violet-200';
  return <span className={cn(base, styles, className)} {...props} />;
};
