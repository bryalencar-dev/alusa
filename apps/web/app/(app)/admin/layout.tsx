import React from 'react';
import '../../globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import CardHeader from '@/components/layout/CardHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full app-surface-bg text-gray-900 with-sidebar"
      style={{ ['--sidebar-gap' as string]: '12px' } as Record<string, string>}
    >
      {/* Sidebar fixa à esquerda, ocupando 100vh */}
      <div className="fixed inset-y-0 left-0 z-30" style={{ width: 'var(--sidebar-w)' }}>
        <Sidebar />
      </div>

      {/* Header fixo apenas sobre a área de conteúdo (ao lado da sidebar) */}
  <div className="fixed top-0 right-0 z-40" style={{ left: 'calc(var(--sidebar-w) + 12px)' }}>
  <CardHeader />
      </div>

      {/* Conteúdo: deslocado pela sidebar (pl-56) e pelo header (pt-16) */}
      <main className="pt-16 overflow-visible">
        <div className="h-[calc(100vh-4rem)] overflow-y-auto min-w-0 bg-white pr-12 pl-6 py-6 rounded-3xl shadow-[0_8px_24px_rgba(149,157,165,0.2)]">
          {children}
        </div>
      </main>
    </div>
  );
}
