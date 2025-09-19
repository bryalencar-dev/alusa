"use client";

import "./globals.css";
import "@/lib/zod-error-map";
import { AppProviders } from "./providers";
import { Toaster } from "sonner";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Listener removido (era usado apenas para testes E2E do toast)
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-screen text-gray-900 antialiased app-surface-bg">
        <AppProviders>
          {children}
          <Toaster position="top-right" duration={4000} />
        </AppProviders>
      </body>
    </html>
  );
}
