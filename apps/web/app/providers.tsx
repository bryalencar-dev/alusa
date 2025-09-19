"use client";
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
