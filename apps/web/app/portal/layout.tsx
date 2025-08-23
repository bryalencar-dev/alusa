import React from 'react';
import '../globals.css';
import LogoutButton from './logout-button';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ padding: '0.75rem 1rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }} className="stack-sm">
        <h1 data-testid="portal-header" style={{ fontSize: '1.1rem', margin: 0 }}>Portal do Aluno</h1>
        <nav aria-label="Navegação principal" style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a aria-label="Ir para matrículas" href="/portal/matriculas">Matrículas</a>
          <a aria-label="Ir para cobranças" href="/portal/cobrancas">Cobranças</a>
          <a aria-label="Ir para eventos" href="/portal/eventos">Eventos</a>
          <a aria-label="Ir para check-in" href="/portal/checkin">Check-in</a>
          <LogoutButton />
        </nav>
      </header>
      <main style={{ flex: 1, padding: '1rem', width: '100%', maxWidth: 960, margin: '0 auto' }}>
        {children}
      </main>
      <footer style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>© {new Date().getFullYear()} Alusa</footer>
    </div>
  );
}
