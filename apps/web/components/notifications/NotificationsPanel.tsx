'use client';
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Close } from '@/components/icons/icons';

export interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  /** Elemento âncora para posicionar o painel (ex.: wrapper do botão). */
  anchorRef?: React.RefObject<HTMLElement>;
  items?: Array<{
    id: string;
    title: string;
    description?: string;
    read?: boolean;
    createdAt?: string;
  }>;
}

export default function NotificationsPanel({
  open,
  onClose,
  anchorRef,
  items = [],
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360,
  });

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      onClose();
    },
    [onClose],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcula posição do painel com base no elemento âncora
  const updatePosition = useCallback(() => {
    const anchor = anchorRef?.current;
    const panelW = Math.min(360, Math.max(280, window.innerWidth - 16));
    if (!anchor) {
      const top = 56 + 8;
      const left = Math.max(8, window.innerWidth - panelW - 16);
      setPos({ top, left, width: panelW });
      return;
    }
    const r = anchor.getBoundingClientRect();
    const top = Math.max(8, r.bottom + 8);
    const left = Math.min(window.innerWidth - panelW - 8, Math.max(8, r.right - panelW));
    setPos({ top, left, width: panelW });
  }, [anchorRef]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      updatePosition();
      document.addEventListener('keydown', handleKey, true);
      document.addEventListener('mousedown', handleClickOutside, true);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        document.removeEventListener('keydown', handleKey, true);
        document.removeEventListener('mousedown', handleClickOutside, true);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    } else {
      const t = setTimeout(() => setVisible(false), 120);
      return () => clearTimeout(t);
    }
  }, [open, updatePosition, handleKey, handleClickOutside]);

  if (!mounted || !visible) return null;
  const hasItems = items.length > 0;

  return createPortal(
    <div
      role="dialog"
      aria-label="Notificações"
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
      className={`z-[70] max-w-[calc(100vw-1rem)] flex max-h-[72vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-black/5 ring-1 ring-black/5 transition-all duration-160 origin-top-right ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'}`}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">Notificações</h2>
        <button
          onClick={onClose}
          aria-label="Fechar painel"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        >
          <Close className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-6 px-5 pb-2 text-xs font-medium text-gray-600">
        <button className="relative text-violet-600 focus:outline-none after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-violet-600">
          Todas
        </button>
        <button className="hover:text-gray-800 focus:outline-none">Menções</button>
      </div>
      <div className="h-px bg-gray-100" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" aria-live="polite">
        {hasItems ? (
          items.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 rounded-lg border border-gray-200 p-3 text-sm ${n.read ? 'bg-white' : 'bg-violet-50'}`}
            >
              <div className="h-10 w-10 flex-none rounded-full bg-gray-200" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[13px] leading-snug text-gray-800">
                  <span className="font-medium">{n.title}</span>
                  {n.description && <> — {n.description}</>}
                </p>
                {n.createdAt && (
                  <p className="text-[11px] text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString()} •{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              {!n.read && (
                <span
                  className="mt-2 h-2 w-2 flex-none rounded-full bg-violet-600"
                  aria-label="Não lida"
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500">Nenhuma notificação por enquanto.</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3">
        <button
          type="button"
          className="text-xs font-medium text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          Marcar todas como lidas
        </button>
        <button
          type="button"
          className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          onClick={onClose}
        >
          Ver todas
        </button>
      </div>
    </div>,
    document.body,
  );
}
