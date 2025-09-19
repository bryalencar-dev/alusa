"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { Close } from "@/components/icons/icons";

export interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
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
  items = [],
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.addEventListener("keydown", handleKey, true);
      document.addEventListener("mousedown", handleClickOutside, true);
      return () => {
        document.removeEventListener("keydown", handleKey, true);
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    } else {
      // Delay para permitir animação de saída
      const timeout = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [open, handleKey, handleClickOutside]);

  if (!visible) return null;
  const hasItems = items.length > 0;

  return (
    <>
      {/* Overlay preto clicável */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Painel com transição */}
      <div
        ref={panelRef}
        className={`absolute top-full right-0 z-50 mt-2 w-[380px] max-w-[calc(100vw-1rem)] flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 transform transition-all duration-200 ${
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        <header className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">
            Notificações
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            <Close className="h-5 w-5" />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-5 pt-3 pb-2 text-xs font-medium text-gray-600">
          <button className="relative text-violet-600 after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:bg-violet-600">
            Todas
          </button>
          <button className="hover:text-gray-800">Menções</button>
        </div>
        <div className="h-px bg-gray-100" />

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" aria-live="polite">
          {hasItems ? (
            items.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 rounded-lg border border-gray-200 p-3 text-sm ${
                  n.read ? "bg-white" : "bg-violet-50"
                }`}
              >
                <div className="h-10 w-10 flex-none rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[13px] leading-snug text-gray-800">
                    <span className="font-medium">{n.title}</span>
                    {n.description && <> — {n.description}</>}
                  </p>
                  {n.createdAt && (
                    <p className="text-[11px] text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString()} •{" "}
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
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
            <p className="text-xs text-gray-500">
              Nenhuma notificação por enquanto.
            </p>
          )}
        </div>

        {/* Rodapé */}
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
      </div>
    </>
  );
}
