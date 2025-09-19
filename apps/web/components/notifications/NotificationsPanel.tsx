"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Close } from "@/components/icons/icons";

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
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 380 });

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
    setMounted(true);
  }, []);

  // Calcula posição do painel com base no elemento âncora
  const updatePosition = useCallback(() => {
    const anchor = anchorRef?.current;
    const panelW = Math.min(380, Math.max(280, window.innerWidth - 16));
    if (!anchor) {
      // fallback: top-right da viewport, alinhado ao header
      const top = 56 + 8; // header ~56px + offset
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
      document.addEventListener("keydown", handleKey, true);
      document.addEventListener("mousedown", handleClickOutside, true);
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        document.removeEventListener("keydown", handleKey, true);
        document.removeEventListener("mousedown", handleClickOutside, true);
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    } else {
      // Delay para permitir animação de saída
      const timeout = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [open, handleKey, handleClickOutside, updatePosition]);

  if (!visible) return null;
  const hasItems = items.length > 0;

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Overlay preto clicável - acima do sidebar */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Painel com transição, fixo e ancorado */}
      <div
        ref={panelRef}
        style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
        className={`z-[61] max-w-[calc(100vw-1rem)] flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 transform transition-all duration-200 ${
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
    </>,
    document.body
  );
}
