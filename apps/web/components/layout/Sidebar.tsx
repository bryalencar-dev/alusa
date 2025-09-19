'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Squares2X2Icon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  RectangleStackIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  TicketIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import {
  Squares2X2Icon as Squares2X2Solid,
  AcademicCapIcon as AcademicCapSolid,
  UserIcon as UserSolid,
  UsersIcon as UsersSolid,
  BookOpenIcon as BookOpenSolid,
  BuildingLibraryIcon as BuildingLibrarySolid,
  RectangleStackIcon as RectangleStackSolid,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckSolid,
  BanknotesIcon as BanknotesSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  ChartBarIcon as ChartBarSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  TicketIcon as TicketSolid,
  Cog6ToothIcon as Cog6ToothSolid,
} from '@heroicons/react/24/solid';
import { useTheme } from '@/components/theme/ThemeProvider';

/** Tokens visuais (mantém sua coluna/tamanho) */
const TOKENS = {
  width: 262,
  widthCollapsed: 64,
  itemW: 192, // largura comum a grupo e submenu
  itemH: 52, // altura comum a grupo e submenu
} as const;

type SubItem = { label: string; href: string; icon: React.ReactNode; iconSolid: React.ReactNode };
type Group = { key: string; label: string; icon: React.ReactNode; iconSolid: React.ReactNode; items: SubItem[] };

const GROUPS: Group[] = [
  {
    key: 'cadastro',
    label: 'Cadastro',
    icon: <AcademicCapIcon className="h-5 w-5" />,
    iconSolid: <AcademicCapSolid className="h-5 w-5" />,
    items: [
      { label: 'Alunos', href: '/alunos', icon: <UserIcon className="h-5 w-5" />, iconSolid: <UserSolid className="h-5 w-5" /> },
      { label: 'Professores', href: '/professores', icon: <UsersIcon className="h-5 w-5" />, iconSolid: <UsersSolid className="h-5 w-5" /> },
      { label: 'Turmas', href: '/turmas', icon: <BookOpenIcon className="h-5 w-5" />, iconSolid: <BookOpenSolid className="h-5 w-5" /> },
      { label: 'Salas', href: '/salas', icon: <BuildingLibraryIcon className="h-5 w-5" />, iconSolid: <BuildingLibrarySolid className="h-5 w-5" /> },
      { label: 'Cursos', href: '/cursos', icon: <RectangleStackIcon className="h-5 w-5" />, iconSolid: <RectangleStackSolid className="h-5 w-5" /> },
    ],
  },
  {
    key: 'matriculas',
    label: 'Matrículas',
    icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
    iconSolid: <ClipboardDocumentCheckSolid className="h-5 w-5" />,
    items: [
      {
        label: 'Minhas Matrículas',
        href: '/matriculas',
        icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
        iconSolid: <ClipboardDocumentCheckSolid className="h-5 w-5" />,
      },
      {
        label: 'Nova Matrícula',
        href: '/matriculas/nova',
        icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
        iconSolid: <ClipboardDocumentCheckSolid className="h-5 w-5" />,
      },
      {
        label: 'Situação',
        href: '/matriculas/situacao',
        icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
        iconSolid: <ClipboardDocumentCheckSolid className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    icon: <BanknotesIcon className="h-5 w-5" />,
    iconSolid: <BanknotesSolid className="h-5 w-5" />,
    items: [
      {
        label: 'Cobranças',
        href: '/financeiro/cobrancas',
        icon: <BanknotesIcon className="h-5 w-5" />,
        iconSolid: <BanknotesSolid className="h-5 w-5" />,
      },
      {
        label: 'Pagamentos',
        href: '/financeiro/pagamentos',
        icon: <BanknotesIcon className="h-5 w-5" />,
        iconSolid: <BanknotesSolid className="h-5 w-5" />,
      },
      {
        label: 'Relatórios',
        href: '/financeiro/relatorios',
        icon: <ChartBarIcon className="h-5 w-5" />,
        iconSolid: <ChartBarSolid className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'aulas',
    label: 'Aulas',
    icon: <CalendarDaysIcon className="h-5 w-5" />,
    iconSolid: <CalendarDaysSolid className="h-5 w-5" />,
    items: [
      { label: 'Minhas Turmas', href: '/aulas/turmas', icon: <BookOpenIcon className="h-5 w-5" />, iconSolid: <BookOpenSolid className="h-5 w-5" /> },
      {
        label: 'Presença',
        href: '/aulas/presenca',
        icon: <CalendarDaysIcon className="h-5 w-5" />,
        iconSolid: <CalendarDaysSolid className="h-5 w-5" />,
      },
      {
        label: 'Horários',
        href: '/aulas/horarios',
        icon: <CalendarDaysIcon className="h-5 w-5" />,
        iconSolid: <CalendarDaysSolid className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    icon: <ChartBarIcon className="h-5 w-5" />,
    iconSolid: <ChartBarSolid className="h-5 w-5" />,
    items: [
      {
        label: 'Acadêmicos',
        href: '/relatorios/academicos',
        icon: <ChartBarIcon className="h-5 w-5" />,
        iconSolid: <ChartBarSolid className="h-5 w-5" />,
      },
      {
        label: 'Financeiros',
        href: '/relatorios/financeiros',
        icon: <ChartBarIcon className="h-5 w-5" />,
        iconSolid: <ChartBarSolid className="h-5 w-5" />,
      },
      {
        label: 'Operacionais',
        href: '/relatorios/operacionais',
        icon: <ChartBarIcon className="h-5 w-5" />,
        iconSolid: <ChartBarSolid className="h-5 w-5" />,
      },
    ],
  },
  {
    key: 'loja',
    label: 'Loja',
    icon: <ShoppingBagIcon className="h-5 w-5" />,
    iconSolid: <ShoppingBagSolid className="h-5 w-5" />,
    items: [
      { label: 'Produtos', href: '/loja/produtos', icon: <ShoppingBagIcon className="h-5 w-5" />, iconSolid: <ShoppingBagSolid className="h-5 w-5" /> },
      { label: 'Pedidos', href: '/loja/pedidos', icon: <ShoppingBagIcon className="h-5 w-5" />, iconSolid: <ShoppingBagSolid className="h-5 w-5" /> },
      { label: 'Estoque', href: '/loja/estoque', icon: <ShoppingBagIcon className="h-5 w-5" />, iconSolid: <ShoppingBagSolid className="h-5 w-5" /> },
    ],
  },
  {
    key: 'eventos',
    label: 'Eventos',
    icon: <TicketIcon className="h-5 w-5" />,
    iconSolid: <TicketSolid className="h-5 w-5" />,
    items: [
      { label: 'Lista', href: '/eventos', icon: <TicketIcon className="h-5 w-5" />, iconSolid: <TicketSolid className="h-5 w-5" /> },
      { label: 'Criar', href: '/eventos/novo', icon: <TicketIcon className="h-5 w-5" />, iconSolid: <TicketSolid className="h-5 w-5" /> },
      { label: 'Ingressos', href: '/eventos/ingressos', icon: <TicketIcon className="h-5 w-5" />, iconSolid: <TicketSolid className="h-5 w-5" /> },
    ],
  },
];

/** Collapsible com overflow hidden (evita “vazar” conteúdo fechado) */
function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setH(open ? el.scrollHeight : 0);
  }, [open, children]);
  return (
    <div style={{ height: h, transition: 'height 220ms ease', overflow: 'hidden' }}>
      <div ref={ref}>{children}</div>
    </div>
  );
}

/** Marcador flutuante que desliza entre os itens selecionados */
function useFloatingMarker() {
  const navRef = useRef<HTMLElement | null>(null);
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const activeElRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const update = useCallback(() => {
    const nav = navRef.current;
    const marker = markerRef.current;
    const el = activeElRef.current;
    if (!nav || !marker || !el) return;
    const n = nav.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    const top = e.top - n.top + nav.scrollTop; // relativo ao nav
    const height = el.offsetHeight;
    marker.style.top = `${top}px`;
    marker.style.height = `${height}px`;
    if (!visible) setVisible(true);
  }, [visible]);

  // Atualiza ao redimensionar/scroll
  useEffect(() => {
    const handler = () => update();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [update]);

  // Atualiza na próxima pintura quando o alvo mudar
  useLayoutEffect(() => { update(); });

  const setActiveElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      activeElRef.current = el;
      // aguarda layout para posicionar
      requestAnimationFrame(() => update());
    }
  }, [update]);

  return { navRef, markerRef, setActiveElement, visible } as const;
}

function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null); // apenas 1 grupo aberto
  const [activeKey, setActiveKey] = useState<string | 'dashboard' | null>('dashboard'); // quem está selecionado
  const { isDark } = useTheme();
  const { navRef, markerRef, setActiveElement, visible } = useFloatingMarker();

  // Largura sincronizada com o layout
  useEffect(() => {
    document.body.dataset.sidebar = collapsed ? 'collapsed' : 'expanded';
    document.documentElement.style.setProperty(
      '--sidebar-w',
      `${collapsed ? TOKENS.widthCollapsed : TOKENS.width}px`,
    );
  }, [collapsed]);

  // Rota → abre grupo correspondente e controla seleção
  useEffect(() => {
    let found: string | null = null;
    for (const g of GROUPS) {
      if (g.items.some((i) => pathname.startsWith(i.href))) {
        found = g.key;
        break;
      }
    }
    if (found) {
      setOpenKey(found);
      setActiveKey(found); // grupo fica selecionado quando está em um submenu
    } else if (pathname.startsWith('/dashboard')) {
      setOpenKey(null);
      setActiveKey('dashboard');
    } else {
      setActiveKey(null);
      setOpenKey(null);
    }
  }, [pathname]);

  const toggleSidebar = useCallback(() => setCollapsed((c) => !c), []);
  const onClickDashboard = () => {
    setOpenKey(null);
    setActiveKey('dashboard');
  };
  const onClickGroup = (key: string) => {
    setActiveKey(key);
    setOpenKey((curr) => (curr === key ? null : key)); // accordion (um aberto por vez)
  };

  /** Estilo pílula (sem alterar cor de fonte) */
  const pill = (activeBg: boolean): React.CSSProperties => ({
    width: TOKENS.itemW,
    height: TOKENS.itemH,
    color: 'var(--sidebar-text)',
    backgroundColor: activeBg ? 'var(--sidebar-active-bg-light)' : 'transparent',
  });

  return (
    <aside
      aria-label="Menu principal"
      className={[
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[262px]',
      ].join(' ')}
      style={{ backgroundColor: `var(--sidebar-bg)` }}
    >
      {/* Topo */}
      <div className="relative px-4 pt-7 pb-8">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md outline-none sidebar-hover sidebar-text"
        >
          <ChevronLeftIcon
            className={`h-5 w-5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>

        <div className="flex items-center justify-center">
          <Link href="/dashboard" aria-label="Alusa">
            {collapsed ? (
              <span
                className="grid h-10 w-10 place-items-center rounded-md text-[14px] font-semibold"
                style={{
                  backgroundColor: `var(--sidebar-active-bg)`,
                  color: `var(--sidebar-active-text)`,
                }}
              >
                A
              </span>
            ) : (
              <img
                src={isDark ? '/brand/logo-dark.svg' : '/brand/logo.svg'}
                alt="Alusa"
                width={132}
                height={40}
                className="h-10 w-auto select-none"
                draggable={false}
              />
            )}
          </Link>
        </div>
      </div>

      {/* Navegação (sem scrollbar) */}
  <nav ref={navRef as React.RefObject<HTMLElement>} className="relative flex-1 overflow-hidden px-0 pb-4">
        {/* Marcador flutuante encostado à esquerda */}
        <span
          ref={markerRef}
          aria-hidden
          className="absolute left-0 w-2 rounded-r-full z-10"
          style={{
            backgroundColor: 'var(--sidebar-active-bg)',
            top: 0,
            height: 0,
            opacity: visible ? 1 : 0,
            transition: 'top 240ms cubic-bezier(.2,.8,.2,1), height 200ms ease, opacity 140ms ease',
            transitionDelay: visible ? '60ms' : '0ms',
          }}
        />
        <ul className="flex flex-col gap-2">
          {/* Dashboard */}
          <li className="relative">
            <Link
              href="/dashboard"
              aria-label="Dashboard"
              className={[
                'group relative mx-auto flex items-center gap-3 rounded-[10px] px-4 pl-[30px] text-[16px] outline-none select-none transition-colors',
                activeKey === 'dashboard' ? 'font-semibold' : 'font-medium',
              ].join(' ')}
              style={pill(activeKey === 'dashboard')}
              onClick={onClickDashboard}
              ref={activeKey === 'dashboard' ? (el) => setActiveElement(el) : undefined}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {activeKey === 'dashboard' ? (
                  <Squares2X2Solid className="h-5 w-5" />
                ) : (
                  <Squares2X2Icon className="h-5 w-5" />
                )}
              </span>
              <span className="truncate">Dashboard</span>
            </Link>
          </li>

          {/* Grupos */}
          {GROUPS.map((group) => {
            const isOpen = openKey === group.key && !collapsed;
            const groupHasRoute = group.items.some((i) => pathname.startsWith(i.href));
            const groupSelected = activeKey === group.key;
            // Mostra marcador no grupo somente quando ele está selecionado e NÃO há submenu ativo
            // Mostra marcador no grupo quando:
            // - grupo está selecionado e não há submenu ativo; ou
            // - o submenu ativo existe, mas o grupo está FECHADO (isOpen === false)
            const showGroupMarker = (groupSelected && !groupHasRoute) || (!isOpen && groupHasRoute);

            return (
              <li key={group.key} className="relative">

                {/* Botão do grupo (sem setas) */}
                <button
                  type="button"
                  onClick={() => onClickGroup(group.key)}
                  aria-expanded={isOpen}
                  className={[
                    'group relative mx-auto flex items-center gap-3 rounded-[10px] px-4 pl-[30px] text-[16px] outline-none select-none transition-colors',
                    (groupSelected || groupHasRoute) ? 'font-semibold' : 'font-medium',
                  ].join(' ')}
                  style={pill(groupSelected)}
                  aria-label={group.label}
                  ref={showGroupMarker ? (el) => setActiveElement(el as HTMLElement) : undefined}
                >
                  <span className="flex h-5 w-5 items-center justify-center">{(groupSelected || groupHasRoute) ? group.iconSolid : group.icon}</span>
                  <span className="truncate">{group.label}</span>
                </button>

                {/* Submenus — alinhados ao grupo (mesmo padding/coluna/tamanho) */}
                <Collapsible open={isOpen}>
                  <ul className="mt-1 flex flex-col gap-2">
                    {group.items.map((item) => {
                      const subActive = pathname.startsWith(item.href);
                      return (
                        <li key={item.href} className="relative">
                          <Link
                            href={item.href}
                            aria-label={item.label}
                            className={[
                              'group relative mx-auto flex items-center gap-3 rounded-[10px] px-4 pl-[30px] text-[16px] outline-none select-none transition-colors',
                              subActive ? 'font-semibold' : 'font-medium',
                            ].join(' ')}
                            style={pill(subActive)}
                            onClick={() => setActiveKey(group.key)} // mantém o grupo como selecionado
                            aria-current={subActive ? 'page' : undefined}
                            ref={subActive && isOpen ? (el) => setActiveElement(el) : undefined}
                          >
                            <span className="flex h-5 w-5 items-center justify-center">
                              {subActive ? item.iconSolid : item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Collapsible>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Configurações */}
      <div className="mt-auto px-0 pb-6">
        <ul>
          <li className="relative">
            <Link
              href="/admin/configuracoes"
              aria-label="Configurações"
              className={[
                'group relative mx-auto flex items-center gap-3 rounded-[10px] px-4 pl-[30px] text-[16px] outline-none select-none transition-colors',
                pathname.startsWith('/admin/configuracoes') ? 'font-semibold' : 'font-medium',
              ].join(' ')}
              style={pill(pathname.startsWith('/admin/configuracoes'))}
              ref={pathname.startsWith('/admin/configuracoes') ? (el) => setActiveElement(el) : undefined}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {pathname.startsWith('/admin/configuracoes') ? (
                  <Cog6ToothSolid className="h-5 w-5" />
                ) : (
                  <Cog6ToothIcon className="h-5 w-5" />
                )}
              </span>
              <span className="truncate">Configurações</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
export default Sidebar;
export { Sidebar };
