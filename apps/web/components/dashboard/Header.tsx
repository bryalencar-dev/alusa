"use client";
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Settings, Info } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// LABEL_MAP removido; caso volte breadcrumb ou título contextual, reintroduzir.

// Título removido; saudação principal exibida no lugar.

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string | null; email?: string | null; image?: string | null; role?: string | null } | undefined;
  const initials = (user?.name?.split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase()) || 'AL';
  const nameParts = (user?.name || '').trim().split(/\s+/).filter(Boolean);
  const displayName = nameParts.slice(0,2).join(' ') || 'Usuário';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
  <h1 className="text-lg font-semibold text-gray-900 tracking-tight truncate">Olá, {displayName}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-gray-900 max-w-[160px] truncate">{user?.name || 'Usuário'}</span>
            <span className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{user?.role || 'Membro'}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Abrir menu do usuário" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A94DFF]/60">
                <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-[#A94DFF] ring-offset-white cursor-pointer">
                  <AvatarImage src={user?.image || ''} alt={user?.name || 'Avatar'} />
                  <AvatarFallback className="bg-[#2A004A] text-white text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem asChild>
                <Link href="/admin/account" className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-600" />
                  <span>Minha conta</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4 text-gray-600" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <Info className="mr-2 h-4 w-4 text-gray-600" />
                  <span>Ajuda</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e: Event) => { e.preventDefault(); void signOut({ callbackUrl: '/auth/login' }); }}
                className="text-red-500 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Finalizar sessão</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
