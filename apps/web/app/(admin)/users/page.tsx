"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@alusa/ui';
import { CustomToast } from '@/components/CustomToast';

export default function UsersRootPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{ title: string; description?: string; variant?: 'success'|'error'|'info'|'warning' } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    setLoading(true);
    try {
      // Mock: email + role fixos para teste
      const body = { email: 'convite.teste@example.com', role: 'RECEPCAO' };
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Falha ao criar convite');
      const json = await res.json();
      const link = json?.invite?.token ? `${window.location.origin}/auth/accept?token=${json.invite.token}` : '';
      if (link) await navigator.clipboard.writeText(link);
      setToast({ title: 'Link de convite copiado!', description: link, variant: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tente novamente';
      setToast({ title: 'Erro ao enviar convite', description: msg, variant: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Usuários</h1>

      {/* Segmented control */}
      <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm" role="tablist">
        <Button
          variant="ghost"
          className="rounded-full px-4 py-2 text-sm hover:bg-purple-50"
          onClick={handleInvite}
          disabled={loading}
        >
          {loading ? 'Enviando…' : 'Enviar Convite'}
        </Button>
        <Button
          variant="ghost"
          className="rounded-full px-4 py-2 text-sm hover:bg-purple-50"
          onClick={() => router.push('/admin/users/list')}
        >
          Visualizar Usuários
        </Button>
        <Button
          variant="ghost"
          className="rounded-full px-4 py-2 text-sm hover:bg-purple-50"
          onClick={() => router.push('/admin/users/pending')}
        >
          Visualizar Pendentes
        </Button>
      </div>

      {toast && (
        <div className="fixed right-6 top-6 z-[100]" role="status">
          <CustomToast
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
