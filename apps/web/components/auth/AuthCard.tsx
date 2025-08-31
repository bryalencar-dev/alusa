// AuthCard: container padrão de formulários de autenticação
import React from 'react';
import { cn } from '../../lib/ui';

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AuthCard({ className, children, ...rest }: AuthCardProps) {
  return (
    <div
      data-component="AuthCard"
      className={cn('flex flex-col items-center justify-center gap-5 bg-white rounded-[40px] px-10 py-[42px] w-[420px] max-w-[92vw] shadow-card', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
