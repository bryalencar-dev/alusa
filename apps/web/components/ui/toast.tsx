"use client";
import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
}

const variantStyles: Record<ToastVariant, string> = {
  neutral: 'bg-[#e5e5e5] text-[#0f0f1a]',
  info: 'bg-[#eef2ff] text-[#0f0f1a]',
  success: 'bg-[#e6f9ef] text-[#0f0f1a]',
  warning: 'bg-[#fff3e1] text-[#0f0f1a]',
  error: 'bg-[#fdecec] text-[#0f0f1a]'
};

let pushToastExternal: ((t: Omit<ToastMessage,'id'>) => void) | null = null;

export function pushToast(t: Omit<ToastMessage,'id'>) {
  if (pushToastExternal) pushToastExternal(t);
}

export function ToastViewport() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: string) => { setToasts(ts => ts.filter(t => t.id !== id)); }, []);

  const push = useCallback((t: Omit<ToastMessage,'id'>) => {
    const id = crypto.randomUUID();
    const toast: ToastMessage = { duration: 5000, variant: 'neutral', ...t, id };
    setToasts(ts => [...ts, toast]);
    if (toast.duration) {
      setTimeout(() => { remove(id); }, toast.duration);
    }
  }, [remove]);

  useEffect(() => { pushToastExternal = push; return () => { pushToastExternal = null; }; }, [push]);

  if (typeof document === 'undefined') return null;
  const root = document.getElementById('toast-root');
  if (!root) return null;

  return createPortal(
    toasts.map(t => (
      <div
        key={t.id}
        role="status"
        className={`pointer-events-auto rounded-2xl px-5 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex gap-4 items-start relative animate-fade-in border border-black/5 ${variantStyles[t.variant || 'neutral']}`}
      >
        <div className="flex-1">
          {t.title && <p className="text-[14px] font-semibold leading-tight mb-1">{t.title}</p>}
          {t.description && <p className="text-[13px] font-medium leading-snug opacity-80">{t.description}</p>}
        </div>
        <button
          onClick={() => { remove(t.id); }}
          aria-label="Fechar"
          className="h-7 w-7 shrink-0 grid place-items-center rounded-lg hover:bg-black/10 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )),
    root
  );
}

// Pequena animação
// (Pode ser movida para CSS global se preferir; inline para simplificar)
const style = typeof document !== 'undefined' ? document.getElementById('__toast_anim') : null;
if (!style && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.id = '__toast_anim';
  s.innerHTML = `@keyframes fade-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}.animate-fade-in{animation:fade-in .25s ease}`;
  document.head.appendChild(s);
}