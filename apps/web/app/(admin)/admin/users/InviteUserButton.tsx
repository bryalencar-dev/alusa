"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import InviteLinkModal from '@/components/invite/InviteLinkModal';
import { buildInviteUrl } from '@alusa/lib/client';

type RoleLabel = 'Administrador' | 'Professor' | 'Recepção' | 'Financeiro' | 'Responsável';

// Mock de action: em produção, trocar por server action/rota real.
async function createInvite(_payload: { email: string; role: RoleLabel }): Promise<{ token?: string; inviteUrl?: string }> {
  // Simula delay de rede
  await new Promise((r) => setTimeout(r, 300));
  const token = `tok_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  return { token };
}

export default function InviteUserButton() {
  const [open, setOpen] = React.useState(false);
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);

  const onClick = async () => {
    setInviteUrl(null); // mostra loading no modal
    setOpen(true);
    const res = await createInvite({ email: 'convidado@exemplo.com', role: 'Administrador' });
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const url = res.inviteUrl ?? (res.token ? buildInviteUrl(base, res.token) : null);
    setInviteUrl(url);
  };

  return (
    <>
      <Button type="button" onClick={onClick} aria-label="convidar usuário">Convidar usuário</Button>
      <InviteLinkModal
        open={open}
        onOpenChange={setOpen}
        inviteUrl={inviteUrl}
        email="convidado@exemplo.com"
        expiresInHours={72}
      />
    </>
  );
}
