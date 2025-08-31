import React from 'react';
import { cn } from '../../lib/ui';

interface BaseProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, BaseProps>(function InputField(
  { label, error, icon, className, containerClassName, id, ...rest }, ref
) {
  const inputId = id || rest.name || Math.random().toString(36).slice(2);
  return (
    <div className={cn('w-[320px] flex flex-col gap-1', containerClassName)}>
      {label && <label htmlFor={inputId} className="sr-only">{label}</label>}
      <div className="relative h-12">
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error || undefined}
          className={cn('peer w-full h-12 rounded-[30px] bg-white outline outline-[1.5px] outline-brand-stroke px-5 pr-10 text-[14px] font-medium placeholder:text-[#828282] focus:outline-brand-accent focus:ring-0', className)}
          {...rest}
        />
        {icon && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#646464]" aria-hidden>{icon}</span>}
      </div>
      {error && <p className="text-[12px] text-red-500" role="alert">{error}</p>}
    </div>
  );
});

type PasswordProps = Omit<BaseProps, 'type'>;

export function PasswordField(props: PasswordProps) {
  const { error, label = 'Senha', icon, className, containerClassName, id, ...rest } = props;
  const [show, setShow] = React.useState(false);
  const inputId = id || rest.name || Math.random().toString(36).slice(2);
  return (
    <div className={cn('w-[320px] flex flex-col gap-1', containerClassName)}>
      {label && <label htmlFor={inputId} className="sr-only">{label}</label>}
      <div className="relative h-12">
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error || undefined}
          className={cn('peer w-full h-12 rounded-[30px] bg-white outline outline-[1.5px] outline-brand-stroke px-5 pr-12 text-[14px] font-medium placeholder:text-[#828282] focus:outline-brand-accent focus:ring-0', className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => { setShow(s => !s); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646464] p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {icon}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-500" role="alert">{error}</p>}
    </div>
  );
}
