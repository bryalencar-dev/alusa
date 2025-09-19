"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  professorId: string | null;
  professorNome?: string;
  onDeleted?: () => void;
};

export default function ProfessorDeleteDialog({ open, onOpenChange, professorId, professorNome, onDeleted }: Props) {
  const [motivo, setMotivo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => { if (open) setMotivo(""); }, [open]);

  async function onConfirm() {
    if (!professorId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/professores/${professorId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error((data?.error?.message || data?.error || 'Erro ao excluir') as string);
        return;
      }
      toast.success('Professor excluído');
      try { window.dispatchEvent(new CustomEvent('professores:changed')); } catch { void 0 }
      onDeleted?.();
      onOpenChange(false);
    } catch {
      toast.error('Erro de comunicação');
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Excluir professor" className="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Tem certeza que deseja excluir {professorNome ? <strong>{professorNome}</strong> : 'este professor'}?
          </p>
          <div>
            <label htmlFor="motivo" className="block text-xs text-gray-600 mb-1">Motivo (opcional)</label>
            <textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Ex.: duplicado, teste..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="button" onClick={onConfirm} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">{submitting ? 'Excluindo...' : 'Excluir'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
