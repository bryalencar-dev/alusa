'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/Sidebar';
import CardHeader from '@/components/layout/CardHeader';

/** Espaçamentos já validados por você */
const CONTENT_GAP_PX = 12;
const OUTER_PADDING_TOP_PX = 20;
const OUTER_PADDING_RIGHT_PX = 24; // igual ao padding inferior
const OUTER_PADDING_BOTTOM_PX = 24;
const CARD_PADDING_PX = 32;
const CARD_RADIUS_PX = 40;
const CARD_SHADOW =
  'rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 70, 0.03) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 2px 2px -1px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.03) 0px 5px 5px -2.5px, rgba(42, 51, 70, 0.03) 0px 10px 10px -5px, rgba(42, 51, 70, 0.03) 0px 24px 24px -8px';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useSession(); // mantém hidratação de sessão caso necessário

  // Health ping em dev
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const w = window as unknown as { __alusaHealthCalled?: boolean };
      if (!w.__alusaHealthCalled) {
        w.__alusaHealthCalled = true;
        fetch('/api/health', { cache: 'no-store' }).catch(() => {});
      }
    }
  }, []);

  // largura inicial da sidebar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (!root.style.getPropertyValue('--sidebar-w')) {
        root.style.setProperty('--sidebar-w', '262px');
      }
    }
  }, []);

  // Regra solicitada: Sidebar SEMPRE exibida nas páginas dentro de (app)
  // (Mantemos session effect/health ping para consistência.)

  return (
    <div className="relative min-h-screen w-full app-surface-bg">
      <Sidebar />

      <main
        className="with-sidebar transition-[padding-left] duration-300 ease-in-out overflow-visible"
        style={{ ['--sidebar-gap' as string]: `${CONTENT_GAP_PX}px` } as Record<string, string>}
      >
        <div
          style={{
            paddingTop: OUTER_PADDING_TOP_PX,
            paddingRight: OUTER_PADDING_RIGHT_PX,
            paddingBottom: OUTER_PADDING_BOTTOM_PX,
          }}
          className="overflow-visible"
        >
          <div
            className="w-full transition-[width] duration-300 ease-in-out overflow-visible"
            style={{
              minHeight: `calc(100vh - ${OUTER_PADDING_TOP_PX + OUTER_PADDING_BOTTOM_PX}px)`,
              background: '#FFFFFF',
              borderRadius: CARD_RADIUS_PX,
              padding: CARD_PADDING_PX,
              boxShadow: CARD_SHADOW,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CardHeader />
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
