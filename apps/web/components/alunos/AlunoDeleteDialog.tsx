'use client';

import * as React from 'react';
import ConfirmDeleteDialog from '@/components/dialogs/ConfirmDeleteDialog';
import toast from 'react-hot-toast';

type Props = {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  alunoId: string | null;
  alunoNome?: string;
  onDeleted?: () => void;
};

export function AlunoDeleteDialog({ open, onOpenChange, alunoId, alunoNome, onDeleted }: Props) {
  const [motivo, setMotivo] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setMotivo('');
  }, [open]);

  async function handleConfirm() {
    if (!alunoId) return;
    try {
      setSubmitting(true);
      const qs = motivo.trim() ? `?motivo=${encodeURIComponent(motivo.trim())}` : '';
      const res = await fetch(`/api/alunos/${alunoId}${qs}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao excluir' }));
        toast.error(data.error || 'Erro ao excluir');
        return;
      }
      toast.success('Aluno excluído');
      try {
        window.dispatchEvent(new CustomEvent('alunos:changed'));
      } catch {
        /* noop */
      }
      onDeleted?.();
      onOpenChange(false);
    } catch {
      toast.error('Erro de comunicação');
    } finally {
      setSubmitting(false);
    }
  }

  const description = alunoNome
    ? `Tem certeza que deseja excluir ${alunoNome}? Esta ação é permanente.`
    : 'Tem certeza que deseja excluir este aluno? Esta ação é permanente.';

  return (
    <ConfirmDeleteDialog
      open={open}
      title="Excluir aluno"
      description={description}
      confirmLabel={submitting ? 'Excluindo...' : 'Excluir'}
      cancelLabel="Cancelar"
      loadingLabel="Excluindo..."
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
    >
      <div className="space-y-3 text-left">
        <label
          htmlFor="motivo-aluno"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Motivo (opcional)
        </label>
        <textarea
          id="motivo-aluno"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-[#7A1BFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/40"
          placeholder="Ex.: duplicado, teste, solicitação do responsável..."
        />
        <p className="text-xs leading-4 text-slate-500">
          Esse campo é opcional e fica registrado apenas para controle interno.
        </p>
      </div>
    </ConfirmDeleteDialog>
  );
}

export default AlunoDeleteDialog;
