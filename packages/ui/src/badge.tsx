import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'outline';
}

const variantClasses: Record<string, string> = {
  default: 'bg-gray-200 text-gray-800',
  success: 'bg-green-600 text-white',
  danger: 'bg-red-600 text-white',
  warning: 'bg-yellow-400 text-black',
  outline: 'border border-gray-300 text-gray-700'
};

export function Badge({ variant = 'default', className = '', ...rest }: BadgeProps) {
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${variantClasses[variant] || variantClasses.default} ${className}`} {...rest} />;
}