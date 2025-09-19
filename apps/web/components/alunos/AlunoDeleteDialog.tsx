"use client";
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Props = {
	open: boolean;
	onOpenChange: (_: boolean) => void;
	alunoId: string | null;
	alunoNome?: string;
	onDeleted?: () => void;
};

export function AlunoDeleteDialog({ open, onOpenChange, alunoId, alunoNome, onDeleted }: Props) {
	const [motivo, setMotivo] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	React.useEffect(() => { if (open) setMotivo(""); }, [open]);
	async function onConfirm() {
		if (!alunoId) return;
		try {
			setSubmitting(true);
			const qs = motivo.trim() ? `?motivo=${encodeURIComponent(motivo.trim())}` : "";
			const res = await fetch(`/api/alunos/${alunoId}${qs}` , { method: "DELETE" });
			if (!res.ok) {
				const data = await res.json().catch(() => ({ error: "Erro ao excluir" }));
				toast.error(data.error || "Erro ao excluir");
				return;
			}
			toast.success("Aluno excluído");
			try { window.dispatchEvent(new CustomEvent("alunos:changed")); } catch { /* noop */ }
			onDeleted?.();
			onOpenChange(false);
		} catch { toast.error("Erro de comunicação"); } finally { setSubmitting(false); }
	}
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent title="Excluir aluno" className="max-w-md">
				<div className="space-y-4">
					<p className="text-sm text-gray-700">Tem certeza que deseja excluir {alunoNome ? <strong>{alunoNome}</strong> : "este aluno"}? Esta ação é permanente.</p>
					<div>
						<label htmlFor="motivo" className="block text-xs text-gray-600 mb-1">Motivo (opcional)</label>
						<textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Ex.: duplicado, teste, solicitação do responsável..." />
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
						<Button type="button" onClick={onConfirm} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">{submitting ? "Excluindo..." : "Excluir"}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default AlunoDeleteDialog;
