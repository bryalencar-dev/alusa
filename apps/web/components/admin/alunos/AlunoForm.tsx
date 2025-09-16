"use client";
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { alunoCreateSchema } from '@alusa/lib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface Endereco { cep: string; logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; uf: string }
interface Responsavel { nome?: string; cpf?: string; email?: string; telefone?: string; endereco?: Partial<Endereco>; financeiro?: boolean }
interface AlunoPartial { id?: string; nome?: string; email?: string; telefone?: string; dataNasc?: string; endereco?: Endereco }
interface Props { aluno?: AlunoPartial; onClose: () => void; onSaved: () => void }

interface FormValues {
	contaId: string;
	nome: string;
	nomeSocial?: string;
	dataNasc: Date;
	cpf?: string;
	email?: string;
	telefone?: string;
	endereco: Endereco;
	observacao?: string;
	genero?: 'MASCULINO' | 'FEMININO' | 'NAO_BINARIO' | 'OUTRO' | 'PREFERE_NAO_INFORMAR';
	modalidadePrincipal?: string;
	nivel?: string;
	alergias?: string;
	restricoesMedicas?: string;
	contatoEmergenciaNome?: string;
	contatoEmergenciaTelefone?: string;
	origemCadastro?: string;
	bolsaDescontoPercent?: number;
	isentoTaxaMatricula?: boolean;
	consentimentoImagem?: boolean;
	dataConsentimentoImagem?: Date;
	consentimentoComunicacoes?: boolean;
	tamanhoCamiseta?: string;
	tamanhoCalcado?: string;
	codigoInterno?: string;
	tags?: string[];
	responsavel?: Responsavel;
	copiarEnderecoResponsavel?: boolean;
	status?: 'ATIVO' | 'INATIVO';
	foto?: string;
}

export function AlunoForm({ aluno, onClose, onSaved }: Props) {
	const form = useForm<FormValues>({
		defaultValues: aluno
			? {
					contaId: 'conta-default',
					nome: aluno.nome || '',
					email: aluno.email,
					telefone: aluno.telefone,
					dataNasc: aluno.dataNasc ? new Date(aluno.dataNasc) : new Date(),
					endereco: aluno.endereco || { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' },
					consentimentoComunicacoes: true,
				} as Partial<FormValues>
			: {
					contaId: 'conta-default',
					nome: '',
					dataNasc: new Date(),
					telefone: undefined,
					email: undefined,
					endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' },
					consentimentoComunicacoes: true,
				},
	});

	const [cepLoading, setCepLoading] = useState(false);

	async function handleCepAutoFill() {
		const raw = form.getValues('endereco.cep');
		if (!raw) return;
		const cep = (raw || '').replace(/\D/g, '');
		if (cep.length !== 8) return;
		try {
			setCepLoading(true);
			const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
			if (!res.ok) throw new Error('Falha ao consultar CEP');
			const data = await res.json();
			if (data.erro) {
				toast.error('CEP não encontrado');
				return;
			}
			form.setValue('endereco.logradouro', data.logradouro || '');
			form.setValue('endereco.bairro', data.bairro || '');
			form.setValue('endereco.cidade', data.localidade || '');
			form.setValue('endereco.uf', (data.uf || '').toUpperCase());
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : 'Erro no CEP';
				toast.error(msg);
		} finally {
			setCepLoading(false);
		}
	}

	const dataNasc = form.watch('dataNasc');
	const isMinor = dataNasc ? localCalcIdade(dataNasc) < 18 : false;

	async function onSubmit(values: FormValues) {
			// Sanitiza campos antes de validar
			const toDigits = (v?: string) => (v ? v.replace(/\D/g, '') : v);
			const payload: FormValues & { [k: string]: unknown } = { ...(values as FormValues) };
			payload.telefone = toDigits(payload.telefone);
			payload.cpf = toDigits(payload.cpf);
			if (payload.responsavel) {
				payload.responsavel = { ...payload.responsavel };
				payload.responsavel.telefone = toDigits(payload.responsavel.telefone);
				payload.responsavel.cpf = toDigits(payload.responsavel.cpf);
			}
			payload.endereco = { ...payload.endereco, cep: toDigits(payload.endereco?.cep) || '' };
			if (payload.consentimentoImagem && !payload.dataConsentimentoImagem) {
				payload.dataConsentimentoImagem = new Date();
			}
			// Usa schema para validar manualmente
			const parsed = alunoCreateSchema.safeParse(payload);
		if (!parsed.success) {
			toast.error('Verifique os campos.');
			return;
		}
		try {
			const res = await fetch(aluno ? `/api/alunos/${aluno.id}` : '/api/alunos', {
				method: aluno ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(parsed.data)
			});
			if (!res.ok) throw new Error('Erro');
			toast.success('Aluno salvo');
			onSaved();
			onClose();
		} catch {
			toast.error('Erro ao salvar aluno');
		}
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-xl shadow p-6 w-[420px]">
				<h2 className="text-lg font-semibold mb-4">{aluno ? 'Editar Aluno' : 'Novo Aluno'}</h2>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
					<div className="grid grid-cols-1 gap-3">
						<Input placeholder="Nome*" {...form.register('nome')} />
								<Input placeholder="Nome Social" {...form.register('nomeSocial')} />
								<Input placeholder="CPF" {...form.register('cpf', { onChange: (e) => {
									const digits = e.target.value.replace(/\D/g, '').slice(0,11);
									let f = digits;
									if (digits.length > 3) f = digits.slice(0,3)+'.'+digits.slice(3);
									if (digits.length > 6) f = f.slice(0,7)+'.'+f.slice(7);
									if (digits.length > 9) f = f.slice(0,11)+'-'+f.slice(11,13);
									form.setValue('cpf', f, { shouldDirty: true });
								} })} />
										<Input placeholder="E-mail" {...form.register('email')} />
										<Input placeholder="Telefone" {...form.register('telefone', {
											onChange: (e) => {
												const digits = e.target.value.replace(/\D/g, '').slice(0,11);
												let formatted = digits;
												if (digits.length > 2) formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
												if (digits.length >= 7) {
													const base = digits.length === 11 ? digits.slice(2,7) + '-' + digits.slice(7,11) : digits.slice(2,6) + '-' + digits.slice(6,10);
													formatted = `(${digits.slice(0,2)}) ${base}`;
												}
												form.setValue('telefone', formatted, { shouldDirty: true });
											}
										})} />
						<Input type="date" placeholder="Data de Nascimento" {...form.register('dataNasc', { valueAsDate: true })} />
						<FotoUpload value={form.watch('foto')} onChange={(url)=> form.setValue('foto', url, { shouldDirty: true })} />
					</div>

					<fieldset className="border border-gray-200 rounded-md p-3 space-y-3">
						<legend className="text-xs font-semibold px-1">Classificação</legend>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<select className="border rounded px-2 py-1 text-sm" {...form.register('genero')}>
								<option value="">Gênero</option>
								<option value="MASCULINO">Masculino</option>
								<option value="FEMININO">Feminino</option>
								<option value="NAO_BINARIO">Não-binário</option>
								<option value="OUTRO">Outro</option>
								<option value="PREFERE_NAO_INFORMAR">Prefere não informar</option>
							</select>
							<Input placeholder="Modalidade Principal" {...form.register('modalidadePrincipal')} />
							<Input placeholder="Nível" {...form.register('nivel')} />
							<Input placeholder="Origem Cadastro" {...form.register('origemCadastro')} />
						</div>
					</fieldset>

					<fieldset className="border border-gray-200 rounded-md p-3 space-y-3">
						<legend className="text-xs font-semibold px-1">Saúde</legend>
						<div className="grid grid-cols-1 gap-2 text-sm">
							<Input placeholder="Alergias" {...form.register('alergias')} />
							<Input placeholder="Restrições Médicas" {...form.register('restricoesMedicas')} />
						</div>
					</fieldset>

					<fieldset className="border border-gray-200 rounded-md p-3 space-y-3">
						<legend className="text-xs font-semibold px-1">Emergência</legend>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<Input placeholder="Contato Emergência" {...form.register('contatoEmergenciaNome')} />
							<Input placeholder="Telefone Emergência" {...form.register('contatoEmergenciaTelefone', { onChange: (e) => {
								const d = e.target.value.replace(/\D/g,'').slice(0,11);
								let f = d;
								if (d.length > 2) f = `(${d.slice(0,2)}) ${d.slice(2)}`;
								if (d.length >=7) {
									const base = d.length === 11 ? d.slice(2,7)+'-'+d.slice(7,11) : d.slice(2,6)+'-'+d.slice(6,10);
									f = `(${d.slice(0,2)}) ${base}`;
								}
								form.setValue('contatoEmergenciaTelefone', f, { shouldDirty: true });
							} })} />
						</div>
					</fieldset>

					<fieldset className="border border-gray-200 rounded-md p-3 space-y-3">
						<legend className="text-xs font-semibold px-1">Financeiro / Regras</legend>
						<div className="grid grid-cols-2 gap-2 text-sm">
							<Input type="number" step="0.01" placeholder="% Bolsa/Desc" {...form.register('bolsaDescontoPercent', { valueAsNumber: true })} />
							<label className="flex items-center gap-2 text-xs font-medium">
								<input type="checkbox" {...form.register('isentoTaxaMatricula')} /> Isento Taxa
							</label>
							<Input placeholder="Tam. Camiseta" {...form.register('tamanhoCamiseta')} />
							<Input placeholder="Tam. Calçado" {...form.register('tamanhoCalcado')} />
						</div>
					</fieldset>

					<fieldset className="border border-gray-200 rounded-md p-3 space-y-3">
						<legend className="text-xs font-semibold px-1">Consentimentos</legend>
						<div className="flex flex-col gap-2 text-xs">
							<label className="flex items-center gap-2">
								<input type="checkbox" {...form.register('consentimentoImagem', { onChange: (e) => {
									if (e.target.checked) {
										form.setValue('dataConsentimentoImagem', new Date(), { shouldDirty: true });
									} else {
										form.setValue('dataConsentimentoImagem', undefined, { shouldDirty: true });
									}
								} })} /> Uso de imagem
							</label>
							<label className="flex items-center gap-2">
								<input type="checkbox" {...form.register('consentimentoComunicacoes')} /> Comunicados / Marketing
							</label>
							{form.watch('dataConsentimentoImagem') && (
								<span className="text-[10px] text-green-600">Data: {form.watch('dataConsentimentoImagem')?.toLocaleDateString()}</span>
							)}
						</div>
					</fieldset>

					<fieldset className="border border-gray-200 rounded-md p-3 space-y-2">
						<legend className="text-xs font-semibold px-1">Endereço</legend>
						<div className="grid grid-cols-3 gap-2 text-sm">
							<div className="relative">
								<Input placeholder="CEP" {...form.register('endereco.cep', { onBlur: handleCepAutoFill, onChange: (e) => {
									const digits = e.target.value.replace(/\D/g, '').slice(0,8);
									const formatted = digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits;
									form.setValue('endereco.cep', formatted, { shouldDirty: true });
								} })} />
								{cepLoading && (
									<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 animate-pulse">CEP...</span>
								)}
							</div>
							<div className="col-span-2"><Input placeholder="Logradouro" {...form.register('endereco.logradouro')} /></div>
							<Input placeholder="Número" {...form.register('endereco.numero')} />
							<Input placeholder="Compl." {...form.register('endereco.complemento')} />
							<Input placeholder="Bairro" {...form.register('endereco.bairro')} />
							<Input placeholder="Cidade" {...form.register('endereco.cidade')} />
							<Input placeholder="UF" maxLength={2} {...form.register('endereco.uf')} />
						</div>
					</fieldset>

					{isMinor && (
						<fieldset className="border border-gray-200 rounded-md p-3 space-y-2">
							<legend className="text-xs font-semibold px-1">Responsável</legend>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<Input placeholder="Nome" {...form.register('responsavel.nome')} />
								<Input placeholder="CPF" {...form.register('responsavel.cpf', { onChange: (e) => {
									const digits = e.target.value.replace(/\D/g, '').slice(0,11);
									let formatted = digits;
									if (digits.length > 3) formatted = digits.slice(0,3) + '.' + digits.slice(3);
									if (digits.length > 6) formatted = formatted.slice(0,7) + '.' + formatted.slice(7);
									if (digits.length > 9) formatted = formatted.slice(0,11) + '-' + formatted.slice(11,13);
									form.setValue('responsavel.cpf', formatted, { shouldDirty: true });
								} })} />
								<Input placeholder="Email" {...form.register('responsavel.email')} />
								<Input placeholder="Telefone" {...form.register('responsavel.telefone', { onChange: (e) => {
									const digits = e.target.value.replace(/\D/g, '').slice(0,11);
									let formatted = digits;
									if (digits.length > 2) formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
									if (digits.length >= 7) {
										const base = digits.length === 11 ? digits.slice(2,7) + '-' + digits.slice(7,11) : digits.slice(2,6) + '-' + digits.slice(6,10);
										formatted = `(${digits.slice(0,2)}) ${base}`;
									}
									form.setValue('responsavel.telefone', formatted, { shouldDirty: true });
								} })} />
							</div>
						</fieldset>
					)}

					<textarea placeholder="Observação" rows={3} {...form.register('observacao')} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm" />

					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
						<Button type="submit">Salvar</Button>
					</div>
				</form>
			</div>
        <TagInput value={form.watch('tags')||[]} onChange={(vals)=> form.setValue('tags', vals, { shouldDirty: true })} />
		</div>

);
}

function localCalcIdade(d: Date) {
	return Math.floor((Date.now() - d.getTime()) / 31557600000);
}

interface TagInputProps { value: string[]; onChange: (_v: string[])=>void }
function TagInput({ value, onChange }: TagInputProps) {
	const [draft, setDraft] = useState('');
	const add = () => {
		const t = draft.trim();
		if (!t) return; if (value.includes(t)) { setDraft(''); return; }
		onChange([...value, t]); setDraft('');
	};
	const remove = (tag: string) => onChange(value.filter(v => v !== tag));
	return (
		<div className="space-y-1">
			<label className="text-xs font-semibold text-gray-600">Tags</label>
			<div className="flex flex-wrap gap-1">
				{value.map(t => (
					<span key={t} className="px-2 py-0.5 bg-gray-200 rounded-full text-[11px] flex items-center gap-1">
						{t}
						<button type="button" onClick={()=> remove(t)} className="text-gray-500 hover:text-red-600">×</button>
					</span>
				))}
			</div>
			<div className="flex gap-2">
				<input value={draft} onChange={e=> setDraft(e.target.value)} onKeyDown={e=> { if (e.key==='Enter') { e.preventDefault(); add(); } }} placeholder="Nova tag" className="flex-1 border rounded px-2 py-1 text-xs" />
				<button type="button" onClick={add} className="text-xs px-2 py-1 rounded bg-gray-800 text-white">Add</button>
			</div>
		</div>
	);
}

interface FotoUploadProps { value?: string; onChange: (_url: string|undefined)=>void }
function FotoUpload({ value, onChange }: FotoUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [preview, setPreview] = useState<string|undefined>(value);

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith('image/')) { toast.error('Formato inválido'); return; }
		if (file.size > 2*1024*1024) { toast.error('Máx 2MB'); return; }
		const formData = new FormData();
		formData.append('file', file);
		try {
			setUploading(true);
			const res = await fetch('/api/upload', { method: 'POST', body: formData });
			if (!res.ok) throw new Error('Falha upload');
			const json = await res.json();
			setPreview(json.url);
			onChange(json.url);
			} catch {
				toast.error('Erro no upload');
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="flex items-center gap-3">
			<div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-300">
						{preview ? (
							<img src={preview} alt="foto" className="w-full h-full object-cover" />
				) : (
					<span className="text-xs text-gray-500">Sem foto</span>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<label className="text-xs font-medium text-gray-600">Foto (até 2MB)</label>
				<input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="text-xs" />
				{uploading && <span className="text-[10px] text-gray-500 animate-pulse">Enviando...</span>}
				{preview && (
					<button type="button" onClick={() => { setPreview(undefined); onChange(undefined); }} className="text-[10px] text-red-500 underline">Remover</button>
				)}
			</div>
		</div>
	);
}
