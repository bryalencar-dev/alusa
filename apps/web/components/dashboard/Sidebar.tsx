"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  GraduationCap,
  DollarSign,
  BookOpen,
  BarChart3,
  ShoppingBag,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isActive = (href: string) => pathname.startsWith(href);
  const toggleGroup = (group: string) =>
    setOpenGroup((g) => (g === group ? null : group));

  return (
    <aside className="w-56 h-screen bg-[#2A004A] text-white flex flex-col py-10 px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-3xl font-bold text-[#A94DFF]">alusa</h1>
      </div>

      {/* Menus principais */}
      <nav className="flex flex-col gap-2">
        {/* Dashboard */}
        <SidebarItem
          href="/admin/dashboard"
          icon={<LayoutGrid size={20} />}
          active={isActive("/admin/dashboard")}
        >
          Dashboard
        </SidebarItem>

        {/* Acadêmico (grupo expansível) */}
        <Group
          id="academico"
          label="Acadêmicos"
          icon={<GraduationCap size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[
            { label: "Alunos", href: "/admin/alunos" },
            { label: "Professores", href: "/admin/professores" },
            { label: "Turmas", href: "/admin/turmas" },
            { label: "Matrículas", href: "/admin/matriculas" },
            { label: "Presenças", href: "/admin/presencas" },
            { label: "Avaliações", href: "/admin/avaliacoes" },
          ]}
        />

        {/* Financeiro */}
        <Group
          id="financeiro"
          label="Financeiro"
          icon={<DollarSign size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[
            { label: "Mensalidades", href: "/admin/cobrancas" },
            {
              label: "Relatórios Financeiros",
              href: "/admin/relatorios-financeiros",
            },
          ]}
        />

        {/* Aulas */}
        <Group
          id="aulas"
          label="Aulas"
          icon={<BookOpen size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[{ label: "Agenda", href: "/admin/aulas" }]}
        />

        {/* Relatórios */}
        <Group
          id="relatorios"
          label="Relatórios"
          icon={<BarChart3 size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[
            { label: "Acadêmicos", href: "/admin/relatorios-academicos" },
            { label: "Financeiros", href: "/admin/relatorios-financeiros" },
            { label: "Gerais", href: "/admin/relatorios-gerais" },
          ]}
        />

        {/* Loja */}
        <Group
          id="loja"
          label="Loja"
          icon={<ShoppingBag size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[
            { label: "Produtos", href: "/admin/produtos" },
            { label: "Vendas", href: "/admin/vendas" },
          ]}
        />

        {/* Eventos */}
        <Group
          id="eventos"
          label="Eventos"
          icon={<Calendar size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[
            { label: "Eventos", href: "/admin/eventos" },
            { label: "Ingressos", href: "/admin/ingressos" },
          ]}
        />
      </nav>

      {/* Configurações no rodapé */}
      <div className="mt-auto pt-6">
        <Group
          id="config"
          label="Configurações"
          icon={<Settings size={20} />}
          openGroup={openGroup}
          toggleGroup={toggleGroup}
          pathname={pathname}
          items={[
            { label: "Usuários", href: "/admin/users" },
            { label: "Integrações", href: "/admin/integracoes" },
            { label: "Configurações Gerais", href: "/admin/settings" },
          ]}
        />
      </div>
    </aside>
  );
}

/* ======================= Sidebar Item ======================= */
function SidebarItem({
  href,
  icon,
  children,
  active,
  isSub,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  isSub?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={String(children)}
      className={cn(
        "flex items-center rounded-lg h-10 px-3 transition-colors duration-200 truncate",
        isSub ? "pl-9 text-sm" : "text-base",
        active
          ? isSub
            ? "bg-[#E14DFF] text-white font-semibold"
            : "bg-[#A94DFF] text-white font-semibold"
          : "hover:bg-white/10 text-white font-normal"
      )}
    >
      {icon && <span className="flex-shrink-0 mr-2">{icon}</span>}
      <span className="leading-5">{children}</span>
    </Link>
  );
}

/* ======================= Grupo Expandível ======================= */
interface SidebarSubItem {
  href: string;
  label: string;
}
interface GroupProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  openGroup: string | null;
  toggleGroup: (_id: string) => void;
  pathname: string;
  items: SidebarSubItem[];
}

function Group({
  id,
  label,
  icon,
  openGroup,
  toggleGroup,
  pathname,
  items,
}: GroupProps) {
  const isActive = (href: string) => pathname.startsWith(href);
  const isOpen = openGroup === id;

  return (
    <div className="flex flex-col gap-1">
      {/* Botão principal */}
      <motion.button
        onClick={() => toggleGroup(id)}
        aria-label={`Abrir grupo ${label}`}
        className={cn(
          "flex items-center gap-2 h-10 px-3 rounded-lg text-base transition-colors duration-200",
          isOpen ? "bg-[#A94DFF] font-semibold" : "hover:bg-white/10 font-normal"
        )}
      >
        {icon}
        {label}
      </motion.button>

      {/* Submenus */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-1"
          >
            {items.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                active={isActive(item.href)}
                isSub
              >
                {item.label}
              </SidebarItem>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
