'use client';
import React from 'react';
import { Close, CheckCircle, Warning, InfoCircle, ErrorCircle } from '@/components/icons/icons';
import { cn } from '@/lib/utils';

type Variant = 'success' | 'error' | 'warning' | 'info';

interface CustomToastProps {
  title: string;
  description?: React.ReactNode;
  variant?: Variant;
  onClose?: () => void;
}

const variantStyles: Record<Variant, { container: string; tilt?: string }> = {
  success: { container: 'toast-container toast-success' },
  error: { container: 'toast-container toast-error', tilt: '-rotate-1' },
  warning: { container: 'toast-container toast-warning' },
  info: { container: 'toast-container toast-info' },
};

const variantIcons: Record<Variant, React.ReactElement> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <ErrorCircle className="h-5 w-5" />,
  warning: <Warning className="h-5 w-5" />,
  info: <InfoCircle className="h-5 w-5" />,
};

export function CustomToast({ title, description, variant = 'info', onClose }: CustomToastProps) {
  const v = variantStyles[variant];
  const dataTestId =
    variant === 'success' ? 'toast-success' : variant === 'error' ? 'toast-error' : undefined;
  return (
    <div
      data-custom-toast
      data-testid={dataTestId}
      className={cn('pointer-events-auto animate-toast-in transition-all', v.container, v.tilt)}
      role="status"
    >
      <div className="toast-icon-wrap mt-0.5">
        <span>{variantIcons[variant]}</span>
      </div>
      <div className="flex-1 min-w-0 text-sm leading-snug">
        <p className="toast-title" title={title}>
          {title}
        </p>
        {description && <p className="toast-desc break-words">{description}</p>}
      </div>
      <button onClick={onClose} aria-label="Fechar" className="toast-close-btn ml-1 mt-0.5">
        <Close className="h-4 w-4" />
      </button>
    </div>
  );
}
