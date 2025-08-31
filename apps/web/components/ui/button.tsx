import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A94DFF]/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[.97] will-change-transform',
  {
    variants: {
      variant: {
        default: 'bg-[#A94DFF] text-white shadow hover:brightness-110',
        secondary: 'bg-white/10 text-white hover:bg-white/20',
        ghost: 'bg-transparent hover:bg-white/10 text-white',
        outline: 'border border-white/20 hover:border-white/40 text-white'
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: { variant: 'default', size: 'md' }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';

export { buttonVariants };
