'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Item = { href: string; label: string };

const BASE_ITEMS: Item[] = [
  { href: '/conta/perfil', label: 'Perfil' },
  { href: '/conta/seguranca', label: 'Segurança' },
  { href: '/conta/email', label: 'E-mail' },
  { href: '/conta/notificacoes', label: 'Notificações' },
  { href: '/conta/assinaturas', label: 'Assinaturas' },
];

const PAYMENT_ALLOWED_ROLES = new Set(['RESPONSAVEL', 'ALUNO']);

export default function AccountSettingsNav() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = (data?.user as { role?: string } | undefined)?.role;
  const showPaymentSection = role ? PAYMENT_ALLOWED_ROLES.has(role) : false;

  const items = showPaymentSection
    ? BASE_ITEMS
    : BASE_ITEMS.filter((item) => item.href !== '/conta/assinaturas');

  return (
    <nav aria-label="Navegação Minha Conta" data-testid="account-card-nav">
      <ul className="space-y-2">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                  active
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'bg-white text-gray-700 hover:bg-gray-50',
                  'focus:outline-none focus:ring-0',
                ].join(' ')}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
