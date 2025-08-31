"use client";
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full bg-white">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <SessionProvider>
          {children}
          <Toaster position="top-right" duration={4000} />
        </SessionProvider>
      </body>
    </html>
  );
}
