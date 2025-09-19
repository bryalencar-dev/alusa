"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

type Status = 'ATIVO' | 'INATIVO';

export type ProfessorEdit = {
  id?: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  bio?: string | null;
  status?: Status;
};

type Props = {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  mode: 'create' | 'edit';
  professor: ProfessorEdit | null;
  onSaved?: (_p?: unknown) => void;
};

export default function ProfessorEditDialog({ open, onOpenChange, mode, professor, onSaved }: Props) {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telefone, setTelefone] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [status, setStatus] = React.useState<Status>('ATIVO');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setNome(professor?.nome || "");
      setEmail((professor?.email || "") as string);
      setTelefone((professor?.telefone || "") as string);
      setBio((professor?.bio || "") as string);
      setStatus((professor?.status || 'ATIVO') as Status);
    }
  }, [open, professor]);

  function isEmail(v: string) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (nome.trim().length < 2) { toast.error('Nome muito curto'); return; }
      if (!isEmail(email.trim())) { toast.error('E-mail inválido'); return; }

      setSubmitting(true);
      const payload: Record<string, unknown> = {
        nome: nome.trim(),
        email: email.trim() || undefined,
        telefone: telefone.replace(/\D/g, '') || undefined,
        bio: bio || undefined,
        status,
      };

      let res: Response;
      if (mode === 'create') {
        const qs = new URLSearchParams({ contaId: 'conta-default' }).toString();
        res = await fetch(`/api/professores?${qs}` , {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      } else {
        if (!professor?.id) { toast.error('Registro inválido'); return; }
        res = await fetch(`/api/professores/${professor.id}` , {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data?.error?.message || data?.error || 'Falha ao salvar') as string;
        toast.error(msg);
        return;
      }

      toast.success(mode === 'create' ? 'Professor criado' : 'Professor atualizado');
      try { window.dispatchEvent(new CustomEvent('professores:changed')); } catch { void 0 }
      onSaved?.(data);
      onOpenChange(false);
    } catch {
      toast.error('Erro de comunicação');
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={mode === 'create' ? 'Novo Professor' : 'Editar Professor'} className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Nome</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Nome completo" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Telefone</label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full border rounded px-3 py-2 text-sm" placeholder="Breve descrição" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white">{submitting ? 'Salvando...' : (mode === 'create' ? 'Criar' : 'Salvar')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
