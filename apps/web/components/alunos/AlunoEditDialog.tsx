"use client";
// Conteúdo migrado de components/aluno/AlunoEditDialog.tsx (original)
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { IMaskInput } from "react-imask";

type StatusAluno = "ATIVO" | "INATIVO";

export type EditAluno = {
	id: string;
	nome: string;
	nomeSocial?: string | null;
	dataNasc?: string | null;
	cpf?: string | null;
	email?: string | null;
	telefone?: string | null;
	foto?: string | null;
	enderecoCep?: string | null;
	enderecoLogradouro?: string | null;
	enderecoNumero?: string | null;
	enderecoComplemento?: string | null;
	enderecoBairro?: string | null;
	enderecoCidade?: string | null;
	enderecoUf?: string | null;
	observacao?: string | null;
	genero?: "MASCULINO" | "FEMININO" | "NAO_BINARIO" | "OUTRO" | "PREFERE_NAO_INFORMAR" | null;
	modalidadePrincipal?: string | null;
	nivel?: string | null;
	alergias?: string | null;
	restricoesMedicas?: string | null;
	contatoEmergenciaNome?: string | null;
	contatoEmergenciaTelefone?: string | null;
	origemCadastro?: string | null;
	bolsaDescontoPercent?: number | null;
	isentoTaxaMatricula?: boolean | null;
	consentimentoImagem?: boolean | null;
	dataConsentimentoImagem?: string | null;
	consentimentoComunicacoes?: boolean | null;
	tamanhoCamiseta?: string | null;
	tamanhoCalcado?: string | null;
	codigoInterno?: string | null;
	tags?: string[] | null;
	status: StatusAluno;
	responsavel?: {
		nome?: string | null;
		cpf?: string | null;
		email?: string | null;
		telefone?: string | null;
		endereco?: {
			cep?: string | null;
			logradouro?: string | null;
			numero?: string | null;
			complemento?: string | null;
			bairro?: string | null;
			cidade?: string | null;
			uf?: string | null;
		} | null;
	} | null;
};

type Props = {
	open: boolean;
	onOpenChange: (_open: boolean) => void;
	aluno: EditAluno | null;
	onSaved?: () => void;
};

export function AlunoEditDialog({ open, onOpenChange, aluno, onSaved }: Props) {
	const [nome, setNome] = React.useState("");
	const [nomeSocial, setNomeSocial] = React.useState("");
	const [dataNasc, setDataNasc] = React.useState("");
	const [cpf, setCpf] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [telefone, setTelefone] = React.useState("");
	const [foto, setFoto] = React.useState("");
	const [cep, setCep] = React.useState("");
	const [logradouro, setLogradouro] = React.useState("");
	const [numero, setNumero] = React.useState("");
	const [complemento, setComplemento] = React.useState("");
	const [bairro, setBairro] = React.useState("");
	const [cidade, setCidade] = React.useState("");
	const [uf, setUf] = React.useState("");
	const [observacao, setObservacao] = React.useState("");
	const [genero, setGenero] = React.useState<EditAluno["genero"] | undefined>(undefined);
	const [alergias, setAlergias] = React.useState("");
	const [restricoes, setRestricoes] = React.useState("");
	const [contatoNome, setContatoNome] = React.useState("");
	const [contatoTelefone, setContatoTelefone] = React.useState("");
	const [status, setStatus] = React.useState<StatusAluno>("ATIVO");
	const [codigoInterno, setCodigoInterno] = React.useState("");
	const [respNome, setRespNome] = React.useState("");
	const [respCpf, setRespCpf] = React.useState("");
	const [respEmail, setRespEmail] = React.useState("");
	const [respTelefone, setRespTelefone] = React.useState("");
	const [respCep, setRespCep] = React.useState("");
	const [respLogradouro, setRespLogradouro] = React.useState("");
	const [respNumero, setRespNumero] = React.useState("");
	const [respComplemento, setRespComplemento] = React.useState("");
	const [respBairro, setRespBairro] = React.useState("");
	const [respCidade, setRespCidade] = React.useState("");
	const [respUf, setRespUf] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);

	React.useEffect(() => {
		if (aluno && open) {
			setNome(aluno.nome || "");
			setNomeSocial((aluno.nomeSocial || "") as string);
			const iso = (aluno.dataNasc || "") as string;
			const d = iso ? new Date(iso) : null;
			setDataNasc(d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "");
			setCpf((aluno.cpf || "") as string);
			setEmail((aluno.email || "") as string);
			setTelefone((aluno.telefone || "") as string);
			setFoto((aluno.foto || "") as string);
			setCep((aluno.enderecoCep || "") as string);
			setLogradouro((aluno.enderecoLogradouro || "") as string);
			setNumero((aluno.enderecoNumero || "") as string);
			setComplemento((aluno.enderecoComplemento || "") as string);
			setBairro((aluno.enderecoBairro || "") as string);
			setCidade((aluno.enderecoCidade || "") as string);
			setUf((aluno.enderecoUf || "") as string);
			setObservacao((aluno.observacao || "") as string);
			setGenero((aluno.genero || undefined) as EditAluno["genero"] | undefined);
			setAlergias((aluno.alergias || "") as string);
			setRestricoes((aluno.restricoesMedicas || "") as string);
			setContatoNome((aluno.contatoEmergenciaNome || "") as string);
			setContatoTelefone((aluno.contatoEmergenciaTelefone || "") as string);
			setStatus(aluno.status || "ATIVO");
			setCodigoInterno((aluno.codigoInterno || "") as string);
			const resp = aluno.responsavel || null;
			if (resp) {
				setRespNome((resp.nome || "") as string);
				setRespCpf((resp.cpf || "") as string);
				setRespEmail((resp.email || "") as string);
				setRespTelefone((resp.telefone || "") as string);
				const re = resp.endereco || {};
				setRespCep((re.cep || "") as string);
				setRespLogradouro((re.logradouro || "") as string);
				setRespNumero((re.numero || "") as string);
				setRespComplemento((re.complemento || "") as string);
				setRespBairro((re.bairro || "") as string);
				setRespCidade((re.cidade || "") as string);
				setRespUf((re.uf || "") as string);
			} else {
				setRespNome(""); setRespCpf(""); setRespEmail(""); setRespTelefone("");
				setRespCep(""); setRespLogradouro(""); setRespNumero(""); setRespComplemento(""); setRespBairro(""); setRespCidade(""); setRespUf("");
			}
		}
	}, [aluno, open]);

	function digits(v: string) { return v.replace(/\D/g, ""); }
	function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
	function isUf(v: string) { return /^[A-Za-z]{2}$/.test(v); }
	function isCepDigits(v: string) { return /^\d{8}$/.test(v); }
	function isCpfDigits(v: string) { return /^\d{11}$/.test(v); }
	function isTelDigits(v: string) { return /^(\d{10}|\d{11})$/.test(v); }
	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!aluno) return;
		try {
			setSubmitting(true);
			const payload: Record<string, unknown> = {};
			if (nome.trim().length < 2) { toast.error("Nome muito curto"); setSubmitting(false); return; }
			if (nome.trim() && nome.trim() !== aluno.nome) payload.nome = nome.trim();
			if ((nomeSocial || "") !== (aluno.nomeSocial || "")) payload.nomeSocial = nomeSocial || null;
			if (dataNasc) payload.dataNasc = new Date(dataNasc).toISOString();
			const cpfD = digits(cpf);
			if (cpfD && !isCpfDigits(cpfD)) { toast.error("CPF inválido"); setSubmitting(false); return; }
			if (cpfD && cpfD !== (aluno.cpf || "")) payload.cpf = cpfD;
			if (email.trim()) {
				if (!isEmail(email.trim())) { toast.error("E-mail inválido"); setSubmitting(false); return; }
			}
			if (email.trim() !== (aluno.email || "")) payload.email = (email.trim() ? email.trim().toLowerCase() : undefined);
			const telDigits = digits(telefone);
			if (telDigits && !isTelDigits(telDigits)) { toast.error("Telefone inválido"); setSubmitting(false); return; }
			if (telDigits !== (aluno.telefone || "")) payload.telefone = telDigits || undefined;
			if ((foto || "") !== (aluno.foto || "")) payload.foto = foto || null;
			const end: Record<string, unknown> = {};
			const cepD = digits(cep);
			if (cepD && !isCepDigits(cepD)) { toast.error("CEP inválido"); setSubmitting(false); return; }
			if ((cep || "") !== (aluno.enderecoCep || "")) end.cep = cepD;
			if ((logradouro || "") !== (aluno.enderecoLogradouro || "")) end.logradouro = logradouro;
			if ((numero || "") !== (aluno.enderecoNumero || "")) end.numero = numero;
			if ((complemento || "") !== (aluno.enderecoComplemento || "")) end.complemento = complemento;
			if ((bairro || "") !== (aluno.enderecoBairro || "")) end.bairro = bairro;
			if ((cidade || "") !== (aluno.enderecoCidade || "")) end.cidade = cidade;
			if (uf && !isUf(uf)) { toast.error("UF inválida"); setSubmitting(false); return; }
			if ((uf || "") !== (aluno.enderecoUf || "")) end.uf = uf.toUpperCase();
			if (Object.keys(end).length > 0) payload.endereco = end;
			if ((observacao || "") !== (aluno.observacao || "")) payload.observacao = observacao || null;
			if ((genero || undefined) !== (aluno.genero || undefined)) payload.genero = genero || undefined;
			if ((alergias || "") !== (aluno.alergias || "")) payload.alergias = alergias || null;
			if ((restricoes || "") !== (aluno.restricoesMedicas || "")) payload.restricoesMedicas = restricoes || null;
			if ((contatoNome || "") !== (aluno.contatoEmergenciaNome || "")) payload.contatoEmergenciaNome = contatoNome || null;
			const contatoTel = digits(contatoTelefone);
			if (contatoTel && !isTelDigits(contatoTel)) { toast.error("Telefone de emergência inválido"); setSubmitting(false); return; }
			if (contatoTel !== (aluno.contatoEmergenciaTelefone || "")) payload.contatoEmergenciaTelefone = contatoTel || undefined;
			if (status !== aluno.status) payload.status = status;
			if ((codigoInterno || "") !== (aluno.codigoInterno || "")) payload.codigoInterno = codigoInterno || null;
			const resp: Record<string, unknown> = {};
			if (respNome.trim()) resp.nome = respNome.trim();
			const rcpf = digits(respCpf);
			if (rcpf && !isCpfDigits(rcpf)) { toast.error("CPF do responsável inválido"); setSubmitting(false); return; }
			if (rcpf) resp.cpf = rcpf;
			if (respEmail.trim()) {
				if (!isEmail(respEmail.trim())) { toast.error("E-mail do responsável inválido"); setSubmitting(false); return; }
				resp.email = respEmail.trim().toLowerCase();
			}
			const rtel = digits(respTelefone);
			if (rtel && !isTelDigits(rtel)) { toast.error("Telefone do responsável inválido"); setSubmitting(false); return; }
			if (rtel) resp.telefone = rtel;
			const re: Record<string, unknown> = {};
			const rcep = digits(respCep);
			if (rcep && !isCepDigits(rcep)) { toast.error("CEP do responsável inválido"); setSubmitting(false); return; }
			if (rcep) re.cep = rcep;
			if (respLogradouro) re.logradouro = respLogradouro;
			if (respNumero) re.numero = respNumero;
			if (respComplemento) re.complemento = respComplemento;
			if (respBairro) re.bairro = respBairro;
			if (respCidade) re.cidade = respCidade;
			if (respUf && !isUf(respUf)) { toast.error("UF do responsável inválida"); setSubmitting(false); return; }
			if (respUf) re.uf = respUf.toUpperCase();
			if (Object.keys(re).length > 0) resp.endereco = re;
			if (Object.keys(resp).length > 0) payload.responsavel = resp;
			const res = await fetch(`/api/alunos/${aluno.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
			if (!res.ok) {
				const data = await res.json().catch(() => ({ error: "Erro ao atualizar" }));
				toast.error(data.error || "Erro ao atualizar");
				return;
			}
			toast.success("Aluno atualizado");
			try { window.dispatchEvent(new CustomEvent("alunos:changed")); } catch (e) { if (process.env.NODE_ENV === 'development') console.debug(e); }
			onSaved?.();
			onOpenChange(false);
		} catch {
			toast.error("Erro de comunicação");
		} finally {
			setSubmitting(false);
		}
	}
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent data-testid="edit-aluno-dialog" title="Editar aluno">
				{aluno && (
					<form onSubmit={onSubmit} className="space-y-6">
						<div className="rounded-md border p-3 space-y-3">
							<span className="text-xs font-semibold text-slate-700">Identificação</span>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-1 md:col-span-2">
									<label className="text-xs text-slate-600">Nome</label>
									<Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">Nome social</label>
									<Input value={nomeSocial} onChange={(e) => setNomeSocial(e.target.value)} placeholder="Opcional" />
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">Data de nascimento</label>
									<Input type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">CPF</label>
									<IMaskInput mask="000.000.000-00" value={cpf} onAccept={(v: unknown) => setCpf(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="000.000.000-00" />
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">E-mail</label>
									<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">Telefone</label>
									<IMaskInput mask={["(00) 0000-0000", "(00) 00000-0000"]} value={telefone} onAccept={(v: unknown) => setTelefone(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="(00) 00000-0000" />
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">Status</label>
									<Select value={status} onValueChange={(v) => setStatus(v as StatusAluno)}>
										<SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="ATIVO">Ativo</SelectItem>
											<SelectItem value="INATIVO">Inativo</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<label className="text-xs text-slate-600">Código interno</label>
									<Input value={codigoInterno} onChange={(e) => setCodigoInterno(e.target.value)} placeholder="00001" />
								</div>
							</div>
						</div>
						<div className="rounded-md border p-3 space-y-3">
							<span className="text-xs font-semibold text-slate-700">Endereço do aluno</span>
							<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
								<div className="space-y-1"><label className="text-xs text-slate-600">CEP</label><IMaskInput mask="00000-000" value={cep} onAccept={(v: unknown) => setCep(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="00000-000" /></div>
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Logradouro</label><Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Rua/Av" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Número</label><Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Nº" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Complemento</label><Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Opcional" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Bairro</label><Input value={bairro} onChange={(e) => setBairro(e.target.value)} /></div>
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Cidade</label><Input value={cidade} onChange={(e) => setCidade(e.target.value)} /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">UF</label><Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0,2))} placeholder="UF" maxLength={2} /></div>
							</div>
						</div>
						<div className="rounded-md border p-3 space-y-3">
							<span className="text-xs font-semibold text-slate-700">Saúde e emergência</span>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Observações</label><textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3} className="w-full border rounded px-2 py-1 text-sm" placeholder="Notas gerais" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Gênero</label><Select value={genero || undefined} onValueChange={(v) => setGenero(v as EditAluno["genero"])}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="MASCULINO">Masculino</SelectItem><SelectItem value="FEMININO">Feminino</SelectItem><SelectItem value="NAO_BINARIO">Não-binário</SelectItem><SelectItem value="OUTRO">Outro</SelectItem><SelectItem value="PREFERE_NAO_INFORMAR">Prefere não informar</SelectItem></SelectContent></Select></div>
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Alergias</label><textarea value={alergias} onChange={(e) => setAlergias(e.target.value)} rows={2} className="w-full border rounded px-2 py-1 text-sm" /></div>
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Restrições médicas</label><textarea value={restricoes} onChange={(e) => setRestricoes(e.target.value)} rows={2} className="w-full border rounded px-2 py-1 text-sm" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Contato emergência - nome</label><Input value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Contato emergência - telefone</label><IMaskInput mask={["(00) 0000-0000", "(00) 00000-0000"]} value={contatoTelefone} onAccept={(v: unknown) => setContatoTelefone(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="(00) 00000-0000" /></div>
							</div>
						</div>
						<div className="rounded-md border p-3 space-y-3">
							<span className="text-xs font-semibold text-slate-700">Responsável principal</span>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-1 md:col-span-2"><label className="text-xs text-slate-600">Nome</label><Input value={respNome} onChange={(e) => setRespNome(e.target.value)} placeholder="Nome do responsável" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">CPF</label><IMaskInput mask="000.000.000-00" value={respCpf} onAccept={(v: unknown) => setRespCpf(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="000.000.000-00" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">E-mail</label><Input type="email" value={respEmail} onChange={(e) => setRespEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Telefone</label><IMaskInput mask={["(00) 0000-0000", "(00) 00000-0000"]} value={respTelefone} onAccept={(v: unknown) => setRespTelefone(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="(00) 00000-0000" /></div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
								<div className="space-y-1"><label className="text-xs text-slate-600">CEP</label><IMaskInput mask="00000-000" value={respCep} onAccept={(v: unknown) => setRespCep(String(v))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="00000-000" /></div>
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Logradouro</label><Input value={respLogradouro} onChange={(e) => setRespLogradouro(e.target.value)} /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Número</label><Input value={respNumero} onChange={(e) => setRespNumero(e.target.value)} /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Complemento</label><Input value={respComplemento} onChange={(e) => setRespComplemento(e.target.value)} placeholder="Opcional" /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">Bairro</label><Input value={respBairro} onChange={(e) => setRespBairro(e.target.value)} /></div>
								<div className="space-y-1 md:col-span-3"><label className="text-xs text-slate-600">Cidade</label><Input value={respCidade} onChange={(e) => setRespCidade(e.target.value)} /></div>
								<div className="space-y-1"><label className="text-xs text-slate-600">UF</label><Input value={respUf} onChange={(e) => setRespUf(e.target.value.toUpperCase().slice(0,2))} placeholder="UF" maxLength={2} /></div>
							</div>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button type="button" variant="outline" className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
							<Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white">{submitting ? "Salvando..." : "Salvar"}</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

export default AlunoEditDialog;
