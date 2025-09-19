import React from 'react';
import '../../globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import CardHeader from '@/components/layout/CardHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white text-gray-900">
      {/* Sidebar fixa à esquerda, ocupando 100vh */}
      <div className="fixed inset-y-0 left-0 w-56 z-30">
        <Sidebar />
      </div>

      {/* Header fixo apenas sobre a área de conteúdo (ao lado da sidebar) */}
      <div className="fixed top-0 left-56 right-0 z-40">
  <CardHeader />
      </div>

      {/* Conteúdo: deslocado pela sidebar (pl-56) e pelo header (pt-16) */}
      <main className="pl-56 pt-16">
        <div className="h-[calc(100vh-4rem)] overflow-y-auto min-w-0 bg-white p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
