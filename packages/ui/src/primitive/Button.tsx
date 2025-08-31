import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 px-4 py-2';
const variants: Record<string,string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-600',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-900'
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => (
  <button className={`${base} ${variants[variant]} ${className}`} {...props} />
);

Button.displayName = 'Button';
