"use client";
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  bgClassName?: string;
}

export default function AuthPageContainer({ children, bgClassName }: Props) {
  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${bgClassName ?? 'bg-[#3C0269]'}`}>
      {children}
    </div>
  );
}
