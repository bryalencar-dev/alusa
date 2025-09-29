'use client';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CustomToast } from '@/components/CustomToast';
import { Edit3, Trash2, Search } from '@/components/icons/icons';
import { Input } from '@/components/ui/input';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import UsuarioEditDialog from '@/components/usuarios/UsuarioEditDialog';
import InviteLinkModal from '@/components/invite/InviteLinkModal';
import { buildInviteUrl } from '@alusa/lib/client';

type Role = 'PROFESSOR' | 'RECEPCAO' | 'FINANCEIRO' | 'RESPONSAVEL' | 'ADMIN';
type UserStatus = 'ATIVO' | 'INATIVO';
type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

type InviteRow = { id: string; email: string; role: Role; createdAt: string; status: InviteStatus };
type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdVia?: 'INVITE' | 'DIRECT';
};
type UsersListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdVia?: 'INVITE' | 'DIRECT';
};

export default function ConfigUsuariosPage() {
  // Toast
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Form
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('RECEPCAO');
  const [submitting, setSubmitting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [lastInviteEmail, setLastInviteEmail] = useState<string | undefined>(undefined);

  // Tabs & busca
  const [tab, setTab] = useState<'USERS' | 'PENDING'>('USERS');
  const [search, setSearch] = useState('');

  // Dados
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);

  // Dialogs
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string | undefined>();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState<string | undefined>();

  // Loaders
  async function loadInvites() {
    const res = await fetch('/api/users/invite', { cache: 'no-store' });
    if (!res.ok) return;
    const data: { items?: InviteApi[] } = await res.json();
    const items = data.items ?? [];
    setInvites(
      items.map((it) => ({
        id: it.id,
        email: it.email,
        role: it.role,
        status: (it.status as InviteStatus) || 'PENDING',
        createdAt:
          typeof it.createdAt === 'string'
            ? it.createdAt
            : it.createdAt instanceof Date
              ? it.createdAt.toISOString()
              : 'created_at' in it && typeof (it as { created_at?: string }).created_at === 'string'
                ? (it as { created_at: string }).created_at
                : new Date().toISOString(),
      })),
    );
  }

  async function reloadUsers() {
    try {
      const res = await fetch('/api/users/list', { cache: 'no-store' });
      if (!res.ok) {
        setUsers([]);
        setUserCount(0);
        return;
      }
      const data: { items?: UsersListItem[] } = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped: UserRow[] = items.map((u) => ({
        id: String(u.id),
        name: String(u.name ?? ''),
        email: String(u.email ?? ''),
        role: String(u.role ?? 'RESPONSAVEL') as Role,
        status: String(u.status ?? 'ATIVO') as UserStatus,
        createdVia: u.createdVia === 'INVITE' ? 'INVITE' : 'DIRECT',
      }));
      setUsers(mapped);
      setUserCount(mapped.length);
    } catch {
      setUsers([]);
      setUserCount(0);
    }
  }

  useEffect(() => {
    loadInvites();
    reloadUsers();
  }, []);

  // Actions
  async function onGenerateInvite() {
    if (!email) return;
    setSubmitting(true);
    try {
      setInviteUrl(null);
      setLastInviteEmail(email);
      setInviteOpen(true);
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error('Falha ao criar convite');
      const json = await res.json();
      const base =
        (process.env.NEXT_PUBLIC_APP_URL as string | undefined) ?? window.location.origin;
      const token: string | undefined = json?.invite?.token || json?.token;
      const link: string | undefined =
        json?.invite?.inviteUrl || (token ? buildInviteUrl(base, token) : undefined);
      setInviteUrl(link ?? null);
      setToast({ title: 'Convite criado', description: link, variant: 'success' });
      setEmail('');
      await loadInvites();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tente novamente';
      setToast({ title: 'Erro ao enviar convite', description: msg, variant: 'error' });
      setInviteOpen(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  const onEditUser = useCallback(
    (id: string) => {
      const u = users.find((x) => x.id === id);
      setEditUserId(id);
      setEditUserName(u?.name || u?.email);
      setEditOpen(true);
    },
    [users],
  );

  const onDeleteUser = useCallback(
    (id: string) => {
      const toDelete = users.find((u) => u.id === id);
      setDeleteUserId(id);
      setDeleteUserName(toDelete?.name || toDelete?.email);
      setDeleteOpen(true);
    },
    [users],
  );

  async function handleConfirmDeleteUser() {
    if (!deleteUserId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(deleteUserId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Falha ao excluir usuário');
      }
      setToast({
        title: 'Usuário excluído',
        description: deleteUserName ? `${deleteUserName} foi removido.` : undefined,
        variant: 'success',
      });
      await reloadUsers();
      setDeleteOpen(false);
    } catch (e) {
      setToast({
        title: 'Erro ao excluir usuário',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'error',
      });
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setToast(null), 3000);
      setDeleteUserId(null);
      setDeleteUserName(undefined);
    }
  }

  const onDeleteInvite = useCallback((id: string) => {
    fetch(`/api/users/invite/${id}`, { method: 'DELETE' })
      .then(() => {
        loadInvites();
        setToast({ title: 'Convite removido', variant: 'success' });
      })
      .catch(() => setToast({ title: 'Erro ao excluir convite', variant: 'error' }))
      .finally(() => setTimeout(() => setToast(null), 2500));
  }, []);

  const onToggleStatus = useCallback(async (u: UserRow) => {
    if (u.role === 'ADMIN') return; // Admin não pode ser desativado
    try {
      const next = u.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
      const who = u.name || u.email;
      const activating = next === 'ATIVO';
      const res = await fetch(`/api/users/${encodeURIComponent(u.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Falha ao atualizar status');
      }
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
      setToast({
        title: activating ? 'Usuário ativado' : 'Usuário marcado como inativo',
        description: activating
          ? `${who} agora pode acessar o sistema.`
          : `${who} não poderá acessar até ser reativado.`,
        variant: 'success',
      });
    } catch (e) {
      setToast({
        title: u.status === 'ATIVO' ? 'Falha ao inativar usuário' : 'Falha ao ativar usuário',
        description: e instanceof Error && e.message ? e.message : 'Tente novamente.',
        variant: 'error',
      });
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  }, []);

  // Helpers
  function labelRole(role: Role): string {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'PROFESSOR') return 'Professor';
    if (role === 'RECEPCAO') return 'Recepção';
    if (role === 'FINANCEIRO') return 'Financeiro';
    if (role === 'RESPONSAVEL') return 'Responsável';
    return role;
  }

  // Tabela de usuários
  function renderUserTable() {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            labelRole(u.role).toLowerCase().includes(term),
        )
      : users;

    return (
      <div className="overflow-auto rounded-lg border bg-white">
        {/* Cabeçalho sticky */}
        <div className="sticky top-0 z-10 bg-gray-50 px-6 py-2 border-b">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
            <div className="col-span-4 text-left">Nome</div>
            <div className="col-span-4 text-left">Email</div>
            <div className="col-span-2 text-left">Função</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Editar</div>
          </div>
        </div>

        {/* Linhas */}
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">Nenhum usuário encontrado</div>
          ) : (
            filtered.map((u) => (
              <div key={u.id} className="px-6 py-3 hover:bg-gray-50 transition-colors duration-150">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm text-gray-900 truncate flex items-center gap-2">
                    <span className="truncate">{u.name}</span>
                    {u.role === 'ADMIN' && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0 h-5 bg-violet-50 text-violet-700 border-violet-200"
                        aria-label="Você"
                        title="Você"
                      >
                        Você
                      </Badge>
                    )}
                    {u.createdVia === 'INVITE' && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0 h-5 bg-violet-50 text-violet-700 border-violet-200"
                      >
                        Via convite
                      </Badge>
                    )}
                  </div>

                  <div
                    className="col-span-4 text-sm text-gray-700 text-left truncate"
                    title={u.email}
                  >
                    {u.email}
                  </div>

                  {/* Função como Badge */}
                  <div className="col-span-2 text-sm">
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                      {labelRole(u.role)}
                    </Badge>
                  </div>

                  {/* Toggle de status — OFF cinza */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={u.status === 'ATIVO'}
                      aria-label={`Alternar status de ${u.name || u.email}`}
                      disabled={u.role === 'ADMIN'}
                      onClick={() => onToggleStatus(u)}
                      onKeyDown={(e) => {
                        if ((e.key === ' ' || e.key === 'Enter') && u.role !== 'ADMIN') {
                          e.preventDefault();
                          onToggleStatus(u);
                        }
                      }}
                      className={[
                        'relative inline-flex h-6 w-11 items-center rounded-full p-[2px]',
                        'transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-violet-500',
                        u.role === 'ADMIN'
                          ? 'bg-gray-300 cursor-not-allowed'
                          : u.status === 'ATIVO'
                            ? 'bg-green-500 cursor-pointer'
                            : 'bg-gray-300 cursor-pointer',
                      ].join(' ')}
                    >
                      <span className="sr-only">{u.status === 'ATIVO' ? 'Ativo' : 'Inativo'}</span>
                      <span
                        aria-hidden
                        className={[
                          'absolute left-[2px] top-1/2 -translate-y-1/2 h-[20px] w-[20px] rounded-full bg-white',
                          'shadow-sm ring-1 ring-black/5',
                          'transition-transform duration-200 ease-out will-change-transform',
                          u.status === 'ATIVO' ? 'translate-x-[20px]' : 'translate-x-0',
                        ].join(' ')}
                      />
                    </button>
                  </div>

                  {/* Ações sempre visíveis */}
                  <div className="col-span-1 flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-50 ${u.role === 'ADMIN' ? 'opacity-40 pointer-events-none' : ''}`}
                      aria-label="Editar usuário"
                      onClick={() => onEditUser(u.id)}
                      disabled={u.role === 'ADMIN'}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 ${u.role === 'ADMIN' ? 'opacity-40 pointer-events-none' : ''}`}
                      aria-label="Excluir usuário"
                      onClick={() => onDeleteUser(u.id)}
                      disabled={u.role === 'ADMIN'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Tabela de convites
  function renderInviteTable() {
    const formatDateTime = (iso: string) => {
      const d = new Date(iso);
      return isNaN(d.getTime())
        ? iso
        : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };
    const statusBadge = (s: InviteStatus) => {
      if (s === 'PENDING')
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendente</Badge>;
      if (s === 'ACCEPTED')
        return <Badge className="bg-green-100 text-green-700 border-green-200">Aceito</Badge>;
      if (s === 'REVOKED')
        return <Badge className="bg-red-100 text-red-700 border-red-200">Revogado</Badge>;
      if (s === 'EXPIRED')
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Expirado</Badge>;
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">-</Badge>;
    };
    const term = search.trim().toLowerCase();
    const filtered = term
      ? invites.filter(
          (i) =>
            i.email.toLowerCase().includes(term) ||
            labelRole(i.role).toLowerCase().includes(term) ||
            String(i.status).toLowerCase().includes(term),
        )
      : invites;

    return (
      <div className="overflow-auto rounded-lg border bg-white">
        <div className="sticky top-0 z-10 bg-gray-50 px-6 py-2 border-b">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
            <div className="col-span-4 text-left">Email</div>
            <div className="col-span-2 text-left">Função</div>
            <div className="col-span-3 text-left">Data de envio</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-1 text-center">Excluir</div>
          </div>
        </div>
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">Nenhum convite pendente</div>
          ) : (
            filtered.map((i) => (
              <div key={i.id} className="px-6 py-3 hover:bg-gray-50 transition-colors duration-150">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 text-sm text-gray-900 truncate" title={i.email}>
                    {i.email}
                  </div>
                  <div className="col-span-2 text-sm">
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                      {labelRole(i.role)}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-sm text-gray-700 text-left">
                    {formatDateTime(i.createdAt)}
                  </div>
                  <div className="col-span-2 flex justify-center">{statusBadge(i.status)}</div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      aria-label="Excluir convite"
                      onClick={() => onDeleteInvite(i.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Render
  return (
    <div className="rounded-lg bg-white p-6">
      <h2 className="text-xl md:text-2xl font-medium tracking-tight text-gray-900">
        Usuários e Convites
      </h2>
      <p className="mt-1 text-sm text-gray-600">Gerencie convites e usuários do sistema.</p>

      {/* Card: Enviar convite */}
      <section className="mt-4 rounded-md border border-gray-200 p-4" aria-label="Enviar convite">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-12 md:col-span-5">
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="invite-email"
              aria-label="E-mail do convidado"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 h-10 text-sm outline-none focus:border-violet-400"
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
              Função
            </label>
            <Select value={role} onValueChange={(v: Role) => setRole(v)}>
              <SelectTrigger
                aria-label="Função do convidado"
                id="invite-role"
                className="mt-1 h-10"
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              {/* Popover com largura do trigger */}
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value="PROFESSOR">Professor</SelectItem>
                <SelectItem value="RECEPCAO">Recepção</SelectItem>
                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                <SelectItem value="RESPONSAVEL">Responsável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <Button
              onClick={onGenerateInvite}
              disabled={submitting || !email}
              className="mt-6 md:mt-0 w-full h-10 rounded-md bg-violet-600 hover:bg-violet-700 text-white"
              aria-label="Gerar convite"
            >
              {submitting ? 'Gerando…' : 'Gerar convite'}
            </Button>
          </div>
        </div>
      </section>

      {/* Abas + busca */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div
            className="inline-flex gap-1 rounded-md border border-gray-200 bg-white p-1"
            role="tablist"
            aria-label="Alternar listagens"
          >
            <button
              role="tab"
              aria-selected={tab === 'USERS'}
              className={`rounded-md px-4 h-9 text-sm transition-colors ${
                tab === 'USERS' ? 'bg-violet-600 text-white' : 'hover:bg-violet-50 text-gray-900'
              }`}
              onClick={() => setTab('USERS')}
            >
              Usuários
            </button>
            <button
              role="tab"
              aria-selected={tab === 'PENDING'}
              className={`rounded-md px-4 h-9 text-sm transition-colors ${
                tab === 'PENDING' ? 'bg-violet-600 text-white' : 'hover:bg-violet-50 text-gray-900'
              }`}
              onClick={() => setTab('PENDING')}
            >
              Pendentes
            </button>
          </div>

          {/* Busca sem sombra, dimensões coerentes e alinhada */}
          <div className="relative w-full md:w-[320px] max-w-sm">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            <Input
              className="h-10 pl-8 rounded-md border border-gray-300 shadow-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-violet-400"
              placeholder={
                tab === 'USERS'
                  ? 'Buscar por nome, email ou função...'
                  : 'Buscar por email, função ou status...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          {typeof userCount === 'number' && (
            <div className="mb-2 text-[12px] text-gray-500">
              Total de usuários cadastrados:{' '}
              <span className="font-medium text-gray-700">{userCount}</span>
            </div>
          )}
          {tab === 'USERS' ? renderUserTable() : renderInviteTable()}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-[100]" role="status" aria-live="polite">
          <CustomToast
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Modais */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) {
            setDeleteUserId(null);
            setDeleteUserName(undefined);
          }
        }}
        title="Excluir usuário"
        description={(() => {
          if (!deleteUserName) {
            return 'Tem certeza que deseja excluir este usuário? Esta ação é permanente.';
          }
          const parts = deleteUserName.trim().split(/\s+/);
          const first = parts[0];
          const last = parts.length > 1 ? parts[parts.length - 1] : '';
          const display =
            last && last.toLowerCase() !== first.toLowerCase() ? `${first} ${last}` : first;
          return (
            <span>
              Tem certeza que deseja excluir o usuário <strong>{display}</strong>? Esta ação é
              permanente e removerá o acesso deste usuário.
            </span>
          );
        })()}
        confirmLabel={deleteLoading ? 'Excluindo…' : 'Excluir'}
        onConfirm={handleConfirmDeleteUser}
      />
      <UsuarioEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        usuarioId={editUserId}
        usuarioNome={editUserName}
        onSaved={reloadUsers}
      />

      {/* Modal de link do convite */}
      <InviteLinkModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        inviteUrl={inviteUrl}
        email={lastInviteEmail}
        expiresInHours={72}
      />
    </div>
  );
}

type InviteApi = {
  id: string;
  email: string;
  role: Role;
  status?: InviteStatus | string;
  createdAt?: string | Date;
  created_at?: string;
};
