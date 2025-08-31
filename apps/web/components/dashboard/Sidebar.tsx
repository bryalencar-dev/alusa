"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GraduationCap, DollarSign, BookOpen, BarChart2, ShoppingBag, Calendar, Settings, ChevronDown } from 'lucide-react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

interface NavItemBase { label: string; icon: React.ReactNode; href?: string; children?: { label: string; href: string }[] }
const NAV: NavItemBase[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  {
    label: 'Acadêmicos',
    icon: <GraduationCap className="h-5 w-5" />,
    href: '/admin/academicos',
    children: [
      { label: 'Cadastros', href: '/admin/academicos/cadastros' },
      { label: 'Matrículas', href: '/admin/academicos/matriculas' },
      { label: 'Avaliações', href: '/admin/academicos/avaliacoes' }
    ]
  },
  { label: 'Finanças', href: '/admin/financas', icon: <DollarSign className="h-5 w-5" /> },
  { label: 'Aulas', href: '/admin/aulas', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Relatórios', href: '/admin/relatorios', icon: <BarChart2 className="h-5 w-5" /> },
  { label: 'Loja', href: '/admin/loja', icon: <ShoppingBag className="h-5 w-5" /> },
  { label: 'Eventos', href: '/admin/eventos', icon: <Calendar className="h-5 w-5" /> }
];

import Image from 'next/image';
function LogoMark() {
  return (
    <Image src="/alusa-logo.svg" alt="Alusa" width={140} height={43} priority draggable={false} className="select-none" />
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // auto-open group if child active
  useEffect(() => {
    NAV.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(c => pathname.startsWith(c.href));
        if (hasActiveChild && !openGroups[item.label]) {
          setOpenGroups(g => ({ ...g, [item.label]: true }));
        }
      }
    });
  }, [pathname, openGroups]);

  const toggleGroup = (label: string) => {
    setOpenGroups(g => ({ ...g, [label]: !g[label] }));
  };

  return (
  <aside className="h-screen w-[248px] bg-[#2A004A] text-white flex flex-col border-r border-black/20 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-screen" style={{ background: 'radial-gradient(circle at 30% 15%, rgba(169,77,255,0.35), transparent 65%), radial-gradient(circle at 85% 70%, rgba(84,0,140,0.45), transparent 70%)' }} />
      {/* Logo */}
      <div className="h-[108px] px-6 pt-6 pb-4 flex items-center justify-center relative z-10">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, ease: 'easeOut' }} className="w-full flex justify-center">
          <LogoMark />
        </motion.div>
      </div>
      {/* Menu */}
      <ScrollArea.Root className="flex-1 w-full relative z-10">
        <ScrollArea.Viewport className="w-full h-full">
          <nav className="pt-2 pb-8 px-6" aria-label="Menu principal">
            <ul className="flex flex-col gap-2">
              {NAV.map(item => {
                const isGroup = !!item.children?.length;
                const groupOpen = openGroups[item.label];
                const active = isGroup
                  ? (item.children?.some(c => pathname.startsWith(c.href)) || pathname.startsWith(item.href || ''))
                  : (!!item.href && pathname.startsWith(item.href));

                if (!isGroup) {
                  return (
                    <li key={item.label}>
                      <Tooltip.Provider delayDuration={250}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            {item.href && <Link
                              href={item.href}
                              aria-current={active ? 'page' : undefined}
                              className={clsx(
                                'relative group inline-flex items-center w-full h-12 rounded-[10px] font-medium text-[15px] transition-all duration-200 outline-none ring-offset-1 ring-offset-[#2A004A] gap-3 px-5 pr-4',
                                active
                                  ? 'bg-[#A94DFF] text-white font-semibold'
                                  : 'text-white/90 hover:bg-[#3a0d61] hover:text-white focus-visible:ring-2 focus-visible:ring-[#A94DFF]/60'
                              )}
                            >
                              {active && (
                                <motion.span layoutId="sb-active-glow" className="absolute inset-0 rounded-[10px] bg-[#A94DFF]" />
                              )}
                              <span className="relative z-10 flex items-center justify-center w-5">{item.icon}</span>
                              <span className="relative z-10 truncate">{item.label}</span>
                            </Link>}
                          </Tooltip.Trigger>
                          {/* tooltip não necessário em modo expandido */}
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </li>
                  );
                }

                // Group with submenu
                return (
                  <li key={item.label} className="group/sub">
                    <button
                      type="button"
                      onClick={() => { toggleGroup(item.label); }}
                      aria-expanded={groupOpen}
                      className={clsx(
                        'relative inline-flex items-center w-full h-12 rounded-[10px] font-medium text-[15px] transition-all duration-200 outline-none gap-3 px-5 pr-4',
                        active ? 'bg-[#A94DFF] text-white font-semibold' : 'text-white/90 hover:bg-[#3a0d61] hover:text-white focus-visible:ring-2 focus-visible:ring-[#A94DFF]/60'
                      )}
                    >
                      {active && (
                        <motion.span layoutId="sb-active-glow" className="absolute inset-0 rounded-[10px] bg-[#A94DFF]" />
                      )}
                      <span className="relative z-10 flex items-center justify-center w-5">{item.icon}</span>
                      <span className="relative z-10 flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown className={clsx('h-4 w-4 relative z-10 transition-transform', groupOpen ? 'rotate-180' : '')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {groupOpen && (
                        <motion.ul
                          key="submenu"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: .25, ease: 'easeInOut' }}
                          className="mt-1 mb-2 ml-2 flex flex-col gap-1 overflow-hidden"
                        >
                          {(item.children ?? []).map(sub => {
                            const subActive = pathname.startsWith(sub.href);
                            return (
                              <li key={sub.href}>
                                <Link
                                  href={sub.href}
                                  aria-current={subActive ? 'page' : undefined}
                                  className={clsx(
                                    'block rounded-md text-[14px] leading-none px-3 py-2 pl-9 relative font-medium transition-all duration-200',
                                    subActive ? 'bg-[#A94DFF] text-white' : 'text-white/75 hover:bg-[#3a0d61] hover:text-white'
                                  )}
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </nav>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 w-2 bg-white/5 hover:bg-white/10 transition-colors">
          <ScrollArea.Thumb className="flex-1 bg-white/30 rounded-full relative before:content-[''] before:absolute before:inset-0 before:min-w-[40px]" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      {/* Footer / Configurações */}
  <div className="w-full pb-8 relative z-10 flex px-6">      
        <Link
          href="/admin/configuracoes"
          className={clsx(
            'inline-flex items-center w-full h-12 rounded-[10px] font-medium text-[15px] transition-all duration-200 outline-none gap-3 px-4',
            pathname.startsWith('/admin/configuracoes')
              ? 'bg-[#A94DFF] text-white font-semibold'
              : 'text-white/85 hover:bg-[#3a0d61] hover:text-white focus-visible:ring-2 focus-visible:ring-[#A94DFF]/60'
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="truncate">Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
