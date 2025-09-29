'use client';

import React, { useMemo, useId, useCallback, useState, type JSX } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Search } from '@/components/icons/icons';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';
import UserMenu from './UserMenu';

export default function CardHeader(): JSX.Element {
  const { data } = useSession();
  const name = (data?.user?.name || 'Usuário').trim();
  const email = data?.user?.email || 'email@exemplo.com';
  const searchId = useId();

  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || 'U';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    return (first + last).toUpperCase();
  }, [name]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifAnchorRef = React.useRef<HTMLDivElement | null>(null);
  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((prev) => !prev);
  }, []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  return (
    <div className="relative flex items-center justify-between" aria-label="Header do conteúdo">
      {/* Busca */}
      <div className="relative w-full max-w-[460px]">
        <label htmlFor={searchId} className="sr-only">
          Pesquisar
        </label>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70" aria-hidden="true">
          <Search className="h-4 w-4" />
        </div>
        <input
          id={searchId}
          type="search"
          placeholder="Pesquise aqui"
          aria-label="Pesquisar"
          className="h-11 w-full rounded-full bg-white pl-9 pr-4 text-[14px] outline-none ring-1 ring-black/5 placeholder:text-gray-400 focus:ring-2 focus:ring-[#A94DFF]"
        />
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-4 pl-6">
        {/* Container relativo: botão + painel */}
        <div className="relative" ref={notifAnchorRef}>
          <button
            type="button"
            aria-label="Notificações"
            onClick={toggleNotifications}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-black/5 transition-colors hover:bg-black/5"
          >
            <Bell className="h-5 w-5" />
            {/* Badge mock - substituir por contagem real */}
            <span
              className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white"
              aria-hidden="true"
            />
          </button>

          {/* Painel alinhado ao botão */}
          <NotificationsPanel
            open={notificationsOpen}
            onClose={closeNotifications}
            items={[]}
            anchorRef={notifAnchorRef}
          />
        </div>

        <UserMenu name={name} email={email} initials={initials} />
      </div>
    </div>
  );
}
