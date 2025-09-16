"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const adminNavGroups: NavGroup[] = [
  {
    title: "Acadêmico",
    items: [
      { label: "Alunos", href: "/admin/alunos" },
      { label: "Professores", href: "/admin/professores" },
      { label: "Turmas", href: "/admin/turmas" },
      { label: "Matrículas", href: "/admin/matriculas" },
      { label: "Presenças", href: "/admin/presencas" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Mensalidades / Cobranças", href: "/admin/cobrancas" },
      { label: "Relatórios Financeiros", href: "/admin/relatorios-financeiros" },
    ],
  },
  {
    title: "Eventos",
    items: [
      { label: "Eventos", href: "/admin/eventos" },
      { label: "Ingressos / Check-in", href: "/admin/ingressos" },
    ],
  },
  {
    title: "Relatórios",
    items: [
      { label: "Acadêmico", href: "/admin/relatorios-academicos" },
      { label: "Financeiro", href: "/admin/relatorios-financeiros" },
      { label: "Geral / KPIs", href: "/admin/relatorios-gerais" },
    ],
  },
  {
    title: "Configurações",
    items: [
      { label: "Usuários", href: "/admin/users" },
      { label: "Integrações", href: "/admin/integracoes" },
      { label: "Configurações Gerais", href: "/admin/settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#2A004A] text-white h-screen p-4 space-y-6">
      {/* Dashboard no topo */}
      <div>
        <Link
          href="/admin/dashboard"
          aria-label="Dashboard Geral"
          className={cn(
            "block rounded-md px-3 py-2 text-sm font-semibold hover:bg-[#5A178C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A94DFF]",
            pathname === "/admin/dashboard" && "bg-[#A94DFF] text-black"
          )}
        >
          Dashboard Geral
        </Link>
      </div>

      {/* Grupos */}
      {adminNavGroups.map((group) => (
        <div key={group.title}>
          <h3 className="text-sm uppercase tracking-wide text-gray-400 mt-4 mb-2">
            {group.title}
          </h3>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm hover:bg-[#5A178C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A94DFF]",
                    pathname.startsWith(item.href) && "bg-[#A94DFF] text-black"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
