// pixel-perfect login
// Componente de logo textual “alusa” para telas de auth (Inter 700, cor #0F0F1A).
// Mantém apenas span sem estilos complexos; tamanhos controlados via className externa.
import React from 'react';
import clsx from 'clsx';

export function BrandLogo({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx('font-bold leading-none tracking-tight text-[#0F0F1A] select-none font-sans', className)}
      {...rest}
    >
      alusa
    </span>
  );
}

export default BrandLogo;
