"use client";
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

interface Aluno {
	id: string;
	nome: string;
	email?: string;
	telefone?: string;
	status: string;
	foto?: string;
	cpf?: string;
	consentimentoImagem?: boolean;
	dataConsentimentoImagem?: string;
	isentoTaxaMatricula?: boolean;
	bolsaDescontoPercent?: string | number | null;
	tags?: string[];
	dataInativacao?: string | null;
	motivoInativacao?: string | null;
}
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Edit3, Trash2, RotateCcw } from 'lucide-react';
import { useState, useMemo } from 'react';

export function AlunoTable({ data, loading, onEdit, onDeleted }: { data: Aluno[]; loading: boolean; onEdit: (_row: Aluno) => void; onDeleted: () => void; }) {
	// Filtros avançados
	const [fNome, setFNome] = useState('');
	const [fCpf, setFCpf] = useState('');
	const [fStatus, setFStatus] = useState<'TODOS'|'ATIVO'|'INATIVO'>('TODOS');
	const [fTag, setFTag] = useState('');
	const [fIsento, setFIsento] = useState<'ANY'|'SIM'|'NAO'>('ANY');
	const [fBolsa, setFBolsa] = useState<'ANY'|'COM'|'SEM'>('ANY');

	const filtered = useMemo(()=> {
		return data.filter(a => {
			if (fNome && !a.nome.toLowerCase().includes(fNome.toLowerCase())) return false;
			if (fCpf) {
				const digitsFiltro = fCpf.replace(/\D/g,'');
				const digitsAluno = (a.cpf||'').replace(/\D/g,'');
				if (!digitsAluno.includes(digitsFiltro)) return false;
			}
			if (fStatus !== 'TODOS' && a.status !== fStatus) return false;
			if (fTag) {
				const tag = fTag.toLowerCase();
				if (!a.tags || !a.tags.some(t => t.toLowerCase().includes(tag))) return false;
			}
			if (fIsento !== 'ANY') {
				const isIsento = !!a.isentoTaxaMatricula;
				if (fIsento === 'SIM' && !isIsento) return false;
				if (fIsento === 'NAO' && isIsento) return false;
			}
			if (fBolsa !== 'ANY') {
				const temBolsa = !!a.bolsaDescontoPercent && Number(a.bolsaDescontoPercent) > 0;
				if (fBolsa === 'COM' && !temBolsa) return false;
				if (fBolsa === 'SEM' && temBolsa) return false;
			}
			return true;
		});
	}, [data, fNome, fCpf, fStatus, fTag, fIsento, fBolsa]);

	// Modal inativação
	const [inativando, setInativando] = useState<Aluno | null>(null);
	const [motivo, setMotivo] = useState('');
	const [loadingAction, setLoadingAction] = useState(false);

	async function confirmarInativar() {
		if (!inativando) return;
		setLoadingAction(true);
		try {
			const res = await fetch(`/api/alunos/${inativando.id}?motivo=${encodeURIComponent(motivo)}`, { method: 'DELETE' });
			if (res.ok) { onDeleted(); setInativando(null); setMotivo(''); }
		} finally { setLoadingAction(false); }
	}

	async function reativar(aluno: Aluno) {
		setLoadingAction(true);
		try {
			await fetch(`/api/alunos/${aluno.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ATIVO', motivoInativacao: null, dataInativacao: null }) });
			onDeleted();
		} finally { setLoadingAction(false); }
	}

	const columns: ColumnDef<Aluno>[] = [
		{
			accessorKey: 'cpf',
			header: 'CPF',
			meta: { headerClassName: 'text-left', cellClassName: 'text-left' },
			cell: ({ row }) => (
				<span className="text-sm text-slate-700 whitespace-nowrap" title={row.original.cpf || ''}>
					{row.original.cpf ? maskCpf(row.original.cpf) : '-'}
				</span>
			),
		},
		{ accessorKey: 'nome', header: 'Nome', meta: { headerClassName: 'text-left', cellClassName: 'text-left' },
			cell: ({ row }) => {
				const aluno = row.original;
				const initials = aluno.nome.split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
				return (
					<div className={"flex items-center gap-3 " + (aluno.status==='INATIVO' ? 'opacity-60' : '')}>
						<Avatar className="h-10 w-10">
							{aluno.foto ? <AvatarImage src={aluno.foto} alt={aluno.nome} /> : null}
							<AvatarFallback className="h-10 w-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-medium">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-0.5 min-w-0">
							<span className="font-medium text-slate-900 text-sm leading-tight flex items-center gap-2 truncate">
								{aluno.nome}
								{aluno.isentoTaxaMatricula && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px]">Isento</span>}
								{aluno.bolsaDescontoPercent && Number(aluno.bolsaDescontoPercent) > 0 && (
									<span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px]">Bolsa {aluno.bolsaDescontoPercent}%</span>
								)}
							</span>
							<span className="text-xs text-slate-500 truncate" title={aluno.id}>#{aluno.id}</span>
							{!aluno.consentimentoImagem ? (
								<span className="text-[10px] text-amber-600 font-medium">Sem consentimento imagem</span>
							) : aluno.dataConsentimentoImagem && (
								<span className="text-[10px] text-emerald-600" title={`Consentimento em ${new Date(aluno.dataConsentimentoImagem).toLocaleDateString()}`}>Imagem OK</span>
							)}
							{aluno.tags && aluno.tags.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-0.5">
									{aluno.tags.slice(0,4).map(t => <span key={t} className="px-1 py-0.5 bg-gray-200 rounded text-[9px]">{t}</span>)}
									{aluno.tags.length > 4 && <span className="text-[9px] text-gray-500">+{aluno.tags.length-4}</span>}
								</div>
							)}
						</div>
					</div>
				);
			}
		},
		{
			accessorKey: 'email',
			header: 'E-mail',
			meta: { headerClassName: 'text-left', cellClassName: 'text-left' },
			cell: ({ row }) => (
				<span className="text-sm text-slate-700 block truncate max-w-[260px]" title={row.original.email || ''}>
					{row.original.email || '-'}
				</span>
			),
		},
		{
			accessorKey: 'telefone',
			header: 'Telefone',
			meta: { headerClassName: 'text-left', cellClassName: 'text-left' },
			cell: ({ row }) => (
				<span className="text-sm text-slate-700 whitespace-nowrap" title={row.original.telefone || ''}>
					{row.original.telefone || '-'}
				</span>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
			cell: ({ row }) => (
				row.original.status === 'ATIVO' ? (
					<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">ATIVO</span>
				) : (
					<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700" title={row.original.motivoInativacao || ''}>INATIVO</span>
				)
			),
		},
		{
			id: 'actions',
			meta: { headerClassName: 'text-center', cellClassName: 'text-center' },
			cell: ({ row }) => {
				const a = row.original;
				return (
					<div className="flex justify-center gap-2">
						<button
							type="button"
							aria-label="Editar aluno"
							className="p-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-violet-700"
							onClick={() => onEdit(a)}
						>
							<Edit3 className="h-4 w-4" />
						</button>
						{a.status === 'ATIVO' ? (
							<button
								type="button"
								aria-label="Excluir aluno"
								className="p-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-red-600"
								onClick={() => { setInativando(a); setMotivo(''); }}
							>
								<Trash2 className="h-4 w-4" />
							</button>
						) : (
							<button
								type="button"
								aria-label="Reativar aluno"
								className="p-2 rounded-md hover:bg-slate-100 text-slate-600 hover:text-violet-700 disabled:opacity-50"
								disabled={loadingAction}
								onClick={() => reativar(a)}
							>
								<RotateCcw className="h-4 w-4" />
							</button>
						)}
					</div>
				);
			}
		}
	];
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-xs items-end">
				<div className="flex flex-col gap-1">
					<label className="font-medium">Nome</label>
					<input value={fNome} onChange={e=> setFNome(e.target.value)} className="border rounded px-2 py-1" placeholder="Nome" />
				</div>
				<div className="flex flex-col gap-1">
					<label className="font-medium">CPF</label>
					<input value={fCpf} onChange={e=> setFCpf(e.target.value)} className="border rounded px-2 py-1" placeholder="CPF" />
				</div>
				<div className="flex flex-col gap-1">
					<label className="font-medium">Status</label>
					<Select value={fStatus} onValueChange={(value) => setFStatus(value as 'TODOS'|'ATIVO'|'INATIVO')}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="TODOS">Todos</SelectItem>
							<SelectItem value="ATIVO">Ativos</SelectItem>
							<SelectItem value="INATIVO">Inativos</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1">
					<label className="font-medium">Tag</label>
					<input value={fTag} onChange={e=> setFTag(e.target.value)} className="border rounded px-2 py-1" placeholder="Tag" />
				</div>
				<div className="flex flex-col gap-1">
					<label className="font-medium">Isento</label>
					<Select value={fIsento} onValueChange={(value) => setFIsento(value as 'ANY'|'SIM'|'NAO')}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ANY">Indiferente</SelectItem>
							<SelectItem value="SIM">Sim</SelectItem>
							<SelectItem value="NAO">Não</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1">
					<label className="font-medium">Bolsa</label>
					<Select value={fBolsa} onValueChange={(value) => setFBolsa(value as 'ANY'|'COM'|'SEM')}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ANY">Indiferente</SelectItem>
							<SelectItem value="COM">Com</SelectItem>
							<SelectItem value="SEM">Sem</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<DataTable columns={columns} data={filtered} loading={loading} emptyMessage="Nenhum aluno encontrado" />

			{inativando && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg shadow w-full max-w-sm p-5 space-y-4">
						<h3 className="text-sm font-semibold">Excluir aluno</h3>
						<p className="text-xs text-gray-600">Esta ação é permanente e removerá o aluno do sistema. Opcionalmente, informe um motivo para registro.</p>
						<textarea value={motivo} onChange={e=> setMotivo(e.target.value)} rows={3} className="w-full border rounded px-2 py-1 text-xs" placeholder="Motivo da exclusão (opcional)" />
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="border-slate-300 text-slate-700 hover:bg-slate-50"
								onClick={()=> { setInativando(null); setMotivo(''); }}
								disabled={loadingAction}
							>
								Cancelar
							</Button>
							<Button type="button" size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={confirmarInativar} disabled={loadingAction}>Excluir</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function maskCpf(cpf: string) {
	const d = cpf.replace(/\D/g,'');
	if (d.length !== 11) return cpf;
	return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9,11);
}
