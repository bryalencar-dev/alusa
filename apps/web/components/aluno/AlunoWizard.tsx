"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useForm, FormProvider, useWatch, useFormContext, type FieldErrors, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { alunoCreateSchema, type AlunoCreateInput } from "@alusa/lib";
import { Button } from "@/components/ui/button";
// (Removido ícone X interno; usamos botão externo do dialog)
import { CustomToast } from "@/components/CustomToast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

// Props do Wizard
export type AlunoWizardProps = {
  onDirtyChange?: (_dirty: boolean) => void;
  onFinish?: () => void;
  contaId?: string;
};

export function AlunoWizard({ onFinish, contaId, onDirtyChange }: AlunoWizardProps) {
  const form = useForm<AlunoCreateInput>({
    resolver: zodResolver(alunoCreateSchema),
    defaultValues: {
      contaId: contaId || "conta-default",
      nome: "",
      dataNasc: undefined,
      status: "ATIVO",
      consentimentoComunicacoes: true,
      consentimentoImagem: false,
      foto: undefined,
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        uf: "",
      },
      responsavel: undefined,
      copiarEnderecoResponsavel: false,
    },
  });

  // menor de idade?
  const dataNasc = useWatch({ control: form.control, name: "dataNasc" });
  const isMinor = useMemo(() => {
    try {
      if (!dataNasc) return false;
      const d = dataNasc instanceof Date ? dataNasc : new Date(String(dataNasc));
      if (Number.isNaN(d.getTime())) return false;
      const now = new Date();
      let a = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
      return a < 18;
    } catch {
      return false;
    }
  }, [dataNasc]);

  // cálculo data válida para banner
  const hasValidDate = useMemo(() => {
    if (!dataNasc) return false;
    const d = dataNasc instanceof Date ? dataNasc : new Date(String(dataNasc));
    return !Number.isNaN(d.getTime());
  }, [dataNasc]);
  const showResponsavelBanner = !hasValidDate || isMinor; // usado no passo Identificação

  // passos
  const steps = [
    { label: "Identificação" },
    { label: "Foto" },
    { label: "Endereço" },
    { label: "Saúde" },
    { label: "Emergência" },
    ...(isMinor ? [{ label: "Responsável" }] : []),
    { label: "Preferências" },
    { label: "Confirmação" },
  ];
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // popup/fechamento agora é responsabilidade do Dialog pai
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Estados do modal de crop (movidos para cima para uso em effects)
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  // notifica o pai sobre mudanças de "sujo"
  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

  // Lógica de saída é tratada pelo Dialog pai via onOpenChange; sem listeners globais aqui

  // (Removido listener global; agora usamos onKeyDownCapture no container principal)
  const progress = ((idx + 1) / steps.length) * 100;

  // foto (upload local + preview)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoUploading, setFotoUploading] = useState(false);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [fotoOversize, setFotoOversize] = useState(false);

  type Area = { x: number; y: number; width: number; height: number };
  function onCropComplete(_area: Area, areaPixels: Area) {
    setCroppedAreaPixels(areaPixels);
  }

  async function getCroppedBlob(src: string, area: { width: number; height: number; x: number; y: number }) {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = area.width;
    canvas.height = area.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context");
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

    // Resize máximo 1200px mantendo proporção
    const maxSide = 1200;
    let targetW = canvas.width;
    let targetH = canvas.height;
    if (Math.max(targetW, targetH) > maxSide) {
      const ratio = targetW > targetH ? maxSide / targetW : maxSide / targetH;
      targetW = Math.round(targetW * ratio);
      targetH = Math.round(targetH * ratio);
      const tmp = document.createElement("canvas");
      tmp.width = targetW; tmp.height = targetH;
      const tctx = tmp.getContext("2d");
      if (!tctx) throw new Error("Canvas ctx");
      tctx.drawImage(canvas, 0, 0, targetW, targetH);
      return await new Promise<Blob>((r) => tmp.toBlob((b) => r(b as Blob), "image/jpeg", 0.85));
    }
    return await new Promise<Blob>((r) => canvas.toBlob((b) => r(b as Blob), "image/jpeg", 0.85));
  }

  async function handleSelectFoto(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.custom(() => <CustomToast title="Formato inválido" description="Envie JPG ou PNG" variant="error" />);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // Não abre modal; mostra aviso inline
      setFotoOversize(true);
      return;
    }
    setFotoOversize(false);
    // abrir modal de crop
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function removerFoto() {
    if (fotoPreview && fotoPreview.startsWith("/uploads/")) {
      try { await fetch("/api/upload", { method: "DELETE", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ url: fotoPreview }) }); } catch {/* ignore */}
    }
    setFotoPreview(null);
    form.setValue("foto" as Path<AlunoCreateInput>, undefined as unknown as never, { shouldDirty: true });
  }
  // loading ViaCEP
  const [cepAlunoLoading, setCepAlunoLoading] = useState(false);
  const [cepRespLoading, setCepRespLoading] = useState(false);

  // efeitos auxiliares
  useEffect(() => {
    const sub = form.watch((values, { name, type }) => {
      // consentimento de imagem => setar data automaticamente
      if (name === "consentimentoImagem" && type === "change") {
        const v = values?.consentimentoImagem;
        if (v) {
          // Sempre gerar nova data quando consentimento é marcado
          form.setValue("dataConsentimentoImagem", new Date(), { shouldDirty: true });
        } else {
          form.setValue("dataConsentimentoImagem" as Path<AlunoCreateInput>, undefined as unknown as never, { shouldDirty: true });
        }
      }
      // copiar endereço do aluno para responsável
      if (name === "copiarEnderecoResponsavel" && type === "change") {
        const v = values?.copiarEnderecoResponsavel;
        if (v) {
          const e = values?.endereco;
          if (e) {
            form.setValue("responsavel.endereco.cep", e.cep || "");
            form.setValue("responsavel.endereco.logradouro", e.logradouro || "");
            form.setValue("responsavel.endereco.numero", e.numero || "");
            form.setValue("responsavel.endereco.complemento", e.complemento || "");
            form.setValue("responsavel.endereco.bairro", e.bairro || "");
            form.setValue("responsavel.endereco.cidade", e.cidade || "");
            form.setValue("responsavel.endereco.uf", e.uf || "");
          }
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // (removido: aviso via toast; agora banner inline)

  async function handleStep() {
    // campos obrigatórios por passo (apenas campos realmente necessários)
    const requiredByStep: Record<string, (keyof AlunoCreateInput | string)[]> = {
      Identificação: ["nome", "dataNasc"], // email, cpf, telefone são opcionais
      Foto: [], // foto é opcional
      Endereço: [
        "endereco.cep",
        "endereco.logradouro", 
        "endereco.numero",
        "endereco.bairro",
        "endereco.cidade",
        "endereco.uf",
      ],
      Saúde: [], // todos campos de saúde são opcionais
      Emergência: [], // campos de emergência são opcionais
      Responsável: isMinor
        ? ["responsavel.nome", "responsavel.cpf", "responsavel.email", "responsavel.telefone"]
        : [], // se menor, responsável é obrigatório
      Preferências: [], // todas preferências são opcionais
    };

    const label = steps[idx].label;
    const fields = requiredByStep[label] || [];
    
    // Validar apenas campos obrigatórios do passo atual
    if (fields.length) {
      // @ts-expect-error lista dinâmica
      const ok = await form.trigger(fields);
      if (!ok) {
        // Mostrar toast específico para campos obrigatórios
        toast.custom(() => <CustomToast 
          title="Campos obrigatórios" 
          description="Preencha todos os campos obrigatórios para continuar" 
          variant="error" 
        />);
        return;
      }
    }

    if (idx < steps.length - 1) {
      setIdx((s) => s + 1);
      return;
    }

    // último passo: validar tudo e enviar
    setSubmitting(true);
    
    // Limpar campos opcionais vazios antes da validação
    const currentVals = form.getValues();
    
    // Limpar strings vazias para undefined nos campos opcionais de texto
    if (currentVals.nomeSocial === '') form.setValue('nomeSocial', undefined);
    if (currentVals.email === '') form.setValue('email', undefined);
    if (currentVals.cpf === '') form.setValue('cpf', undefined);
    if (currentVals.telefone === '') form.setValue('telefone', undefined);
    if (currentVals.foto === '') form.setValue('foto', undefined);
    if (currentVals.observacao === '') form.setValue('observacao', undefined);
    if (currentVals.alergias === '') form.setValue('alergias', undefined);
    if (currentVals.restricoesMedicas === '') form.setValue('restricoesMedicas', undefined);
    if (currentVals.contatoEmergenciaNome === '') form.setValue('contatoEmergenciaNome', undefined);
    if (currentVals.contatoEmergenciaTelefone === '') form.setValue('contatoEmergenciaTelefone', undefined);
    if (currentVals.origemCadastro === '') form.setValue('origemCadastro', undefined);
    if (currentVals.codigoInterno === '') form.setValue('codigoInterno', undefined);
    
    // Garantir data de consentimento se consentimento for true
    if (currentVals.consentimentoImagem && !currentVals.dataConsentimentoImagem) {
      form.setValue('dataConsentimentoImagem', new Date());
    }
    
    // Limpar dados do responsável se não menor de idade
    if (!isMinor) {
      form.setValue('responsavel', undefined);
    }
    
    // Validar todos os campos
    const okAll = await form.trigger();
    if (!okAll) {
      // encontrar primeiro erro e levar o usuário ao passo correspondente
      const errors = form.formState.errors as FieldErrors<AlunoCreateInput>;
      function firstPath(obj: unknown, prefix = ""): string | null {
        if (!obj || typeof obj !== "object" || obj === null) return null;
        for (const k of Object.keys(obj as Record<string, unknown>)) {
          const node = (obj as Record<string, unknown>)[k];
          const path = prefix ? `${prefix}.${k}` : k;
          if (node && typeof node === "object" && "message" in node && (node as { message?: unknown }).message) return path;
          const deeper = firstPath(node, path);
          if (deeper) return deeper;
        }
        return null;
      }
      const path = firstPath(errors) || "";
      const fieldToStep = (p: string): string => {
        if (!p) return "Identificação";
        if (p.startsWith("endereco.")) return "Endereço";
        if (p.startsWith("responsavel.")) return "Responsável";
        if (p.includes("alergias") || p.includes("restricoesMedicas")) return "Saúde";
        if (p.includes("contatoEmergencia")) return "Emergência";
        if (p.includes("consentimento") || p.includes("tags") || p.includes("tamanho")) return "Preferências";
        const identificacao = ["nome", "dataNasc", "email", "telefone", "nomeSocial", "cpf", "genero"];
        if (identificacao.some(f => p === f || p.startsWith(f+"."))) return "Identificação";
        return "Confirmação";
      };
      const stepLabel = fieldToStep(path);
      const targetIdx = steps.findIndex(s => s.label === stepLabel);
      if (targetIdx >= 0) setIdx(targetIdx);
      
      console.log('Erro de validação:', { path, errors });
      toast.custom(() => <CustomToast 
        title="Validação" 
        description="Revise os campos destacados em vermelho" 
        variant="error" 
      />);
      setSubmitting(false);
      return;
    }

    // Preparar dados para envio
    const vals = form.getValues();
    const dn = vals.dataNasc instanceof Date ? vals.dataNasc : new Date(String(vals.dataNasc));
    
    // Normalizar máscaras -> somente dígitos onde aplicável
    type Mutable<T> = { -readonly [K in keyof T]: T[K] };
    const norm = { ...(vals as Mutable<AlunoCreateInput>) } as Mutable<AlunoCreateInput>;
    
    // Normalizar CPF e telefones
    if (norm.cpf) norm.cpf = String(norm.cpf).replace(/\D/g, "");
    if (norm.telefone) norm.telefone = String(norm.telefone).replace(/\D/g, "");
    if (norm.contatoEmergenciaTelefone) norm.contatoEmergenciaTelefone = String(norm.contatoEmergenciaTelefone).replace(/\D/g, "");
    
    // Normalizar dados do responsável
    if (norm.responsavel?.cpf) norm.responsavel.cpf = String(norm.responsavel.cpf).replace(/\D/g, "");
    if (norm.responsavel?.telefone) norm.responsavel.telefone = String(norm.responsavel.telefone).replace(/\D/g, "");
    
    // Normalizar CEPs
    if (norm.endereco?.cep) norm.endereco.cep = String(norm.endereco.cep).replace(/\D/g, "");
    if (norm.responsavel?.endereco?.cep) norm.responsavel.endereco.cep = String(norm.responsavel.endereco.cep).replace(/\D/g, "");
    
    // Garantir data de consentimento
    if (norm.consentimentoImagem && !norm.dataConsentimentoImagem) {
      norm.dataConsentimentoImagem = new Date();
    }

    // Normalizar dados para API
    console.log('Dados finais para API:', norm);
    
    // Construir payload final limpo
    const payload: AlunoCreateInput = {
      contaId: norm.contaId,
      nome: norm.nome.trim(),
      dataNasc: dn,
      endereco: norm.endereco,
      status: norm.status || 'ATIVO',
      consentimentoComunicacoes: norm.consentimentoComunicacoes ?? true,
      consentimentoImagem: norm.consentimentoImagem ?? false,
      // Campos opcionais apenas se preenchidos
      ...(norm.nomeSocial && { nomeSocial: norm.nomeSocial.trim() }),
      ...(norm.cpf && { cpf: norm.cpf }),
      ...(norm.email && { email: norm.email.trim().toLowerCase() }),
      ...(norm.telefone && { telefone: norm.telefone }),
      ...(norm.foto && { foto: norm.foto }),
      ...(norm.observacao && { observacao: norm.observacao.trim() }),
      ...(norm.genero && { genero: norm.genero }),
      ...(norm.modalidadePrincipal && { modalidadePrincipal: norm.modalidadePrincipal.trim() }),
      ...(norm.nivel && { nivel: norm.nivel.trim() }),
      ...(norm.alergias && { alergias: norm.alergias.trim() }),
      ...(norm.restricoesMedicas && { restricoesMedicas: norm.restricoesMedicas.trim() }),
      ...(norm.contatoEmergenciaNome && { contatoEmergenciaNome: norm.contatoEmergenciaNome.trim() }),
      ...(norm.contatoEmergenciaTelefone && { contatoEmergenciaTelefone: norm.contatoEmergenciaTelefone }),
      ...(norm.origemCadastro && { origemCadastro: norm.origemCadastro.trim() }),
      ...(norm.bolsaDescontoPercent && { bolsaDescontoPercent: norm.bolsaDescontoPercent }),
      ...(typeof norm.isentoTaxaMatricula !== 'undefined' && { isentoTaxaMatricula: norm.isentoTaxaMatricula }),
      ...(norm.dataConsentimentoImagem && { dataConsentimentoImagem: norm.dataConsentimentoImagem }),
      ...(norm.tamanhoCamiseta && { tamanhoCamiseta: norm.tamanhoCamiseta }),
      ...(norm.tamanhoCalcado && { tamanhoCalcado: norm.tamanhoCalcado }),
      ...(norm.codigoInterno && { codigoInterno: norm.codigoInterno }),
      ...(norm.tags?.length && { tags: norm.tags }),
      ...(norm.responsavel && { responsavel: norm.responsavel }),
    };

    try {
      console.log('📤 Enviando dados do aluno:', {
        nome: payload.nome,
        cpf: payload.cpf ? `${payload.cpf.slice(0,3)}***` : 'não informado',
        temEmail: !!payload.email,
        temFoto: !!payload.foto,
        consentimentoImagem: payload.consentimentoImagem,
        temResponsavel: !!payload.responsavel,
      });
      
      const res = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro de comunicação' }));
        console.error('❌ Erro da API:', errorData);
        
        // Mostrar erro específico se disponível
        const message = errorData.error || 'Erro interno do servidor';
        toast.custom(() => <CustomToast 
          title="Erro ao salvar" 
          description={message} 
          variant="error" 
        />);
        setSubmitting(false);
        return;
      }
      
      const createdAluno = await res.json();
      console.log('✅ Aluno criado com sucesso:', createdAluno.id);
      
      // Notificar outros componentes sobre mudança
      try {
        window.dispatchEvent(new CustomEvent('alunos:changed'));
      } catch { /* noop */ }
      
      toast.custom(() => <CustomToast 
        title="Sucesso!" 
        description="Aluno cadastrado com sucesso" 
        variant="success" 
      />);
      
      onFinish?.();
      
    } catch (error) {
      console.error('❌ Erro de comunicação:', error);
      toast.custom(() => <CustomToast 
        title="Erro de comunicação" 
        description="Verifique sua conexão e tente novamente" 
        variant="error" 
      />);
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    void handleStep();
  }
  function back() {
    setIdx((s) => Math.max(0, s - 1));
  }

  return (
    <>
      <FormProvider {...form}>
      <div
        ref={rootRef}
        data-testid="wizard-aluno"
        className="w-full rounded-2xl bg-white border border-slate-200 relative transition duration-150"
      >
        <div className="px-6 pt-4 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-6">
              <Progress value={progress} className="h-2 rounded-full mb-4" />
              <div data-testid="aluno-step-label" className="text-sm font-semibold text-gray-700">{steps[idx].label}</div>
            </div>
          </div>
        </div>

  <div className={`px-6 pb-2`}> 
          {steps[idx].label === "Identificação" && (
            <div className="text-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field name="nome" label="Nome" placeholder="Nome completo" />
                <Field name="email" label="Email" type="email" placeholder="email@exemplo.com" />
                <MaskedField kind="phone" name="telefone" label="Telefone" placeholder="(00) 00000-0000" />
                <DateField name="dataNasc" label="Data de nascimento" />
                <Field name="nomeSocial" label="Nome social" placeholder="Opcional" />
                <MaskedField kind="cpf" name="cpf" label="CPF" placeholder="000.000.000-00" />
                <SelectField
                  name="genero"
                  label="Gênero"
                  placeholder="Selecione"
                  options={[
                    { value: "MASCULINO", label: "Masculino" },
                    { value: "FEMININO", label: "Feminino" },
                    { value: "NAO_BINARIO", label: "Não binário" },
                    { value: "OUTRO", label: "Outro" },
                    { value: "PREFERE_NAO_INFORMAR", label: "Prefere não informar" },
                  ]}
                />
              </div>
              {showResponsavelBanner && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 text-xs mb-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
                  <span>Menores de 18 anos precisam de um responsável no cadastro.</span>
                </div>
              )}
            </div>
          )}
          {steps[idx].label === "Foto" && (
            <div className="text-sm">
              <div className="rounded-[10px] border border-slate-200 bg-white px-8 py-7">
                <p className="text-[14px] leading-relaxed text-slate-600 max-w-3xl mb-6">Envie uma imagem nítida e recente. Isso ajuda na identificação rápida em listas e relatórios.</p>
                <div className="flex flex-col gap-8 md:flex-row md:items-start">
                  {/* Preview */}
                  <div className="flex flex-col gap-3 items-start">
                    <div className="relative w-[148px] h-[184px] rounded-lg bg-slate-200 border border-slate-500 flex items-center justify-center overflow-hidden">
                      {fotoPreview && <img src={fotoPreview} alt="Prévia" className="h-full w-full object-cover" />}
                      {!fotoPreview && <span className="text-[11px] text-slate-500 px-2 text-center leading-4">Sem foto</span>}
                      {fotoUploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Ações */}
                  <div className="flex flex-col gap-3 w-[160px]">
                    <input ref={inputFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleSelectFoto(e.target.files?.[0] || null)} />
                    <button
                      type="button"
                      onClick={() => inputFileRef.current?.click()}
                      disabled={fotoUploading}
                      className="h-10 rounded-md border border-[#2563EB] text-[#2563EB] text-[12px] font-semibold flex items-center justify-center disabled:opacity-60"
                    >
                      {fotoUploading ? "Carregando..." : (fotoPreview ? "Trocar foto" : "Adicione uma foto")}
                    </button>
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={removerFoto}
                        disabled={fotoUploading}
                        className="h-10 rounded-md border border-[#E55D5D] text-[#E55D5D] text-[12px] font-semibold flex items-center justify-center disabled:opacity-60"
                      >
                        Remover foto
                      </button>
                    )}
                    <p className="text-[11px] text-[#66758B] leading-4">Você pode remover e enviar outra a qualquer momento antes de concluir.</p>
                  </div>
                  {/* Observações + aviso */}
                  <div className="flex flex-col gap-3">
                    <div className="w-[205px] rounded-md border border-slate-300 bg-[#F6F8F9] px-[22px] py-4">
                      <div className="text-[11px] text-slate-600 font-normal mb-2">Observações</div>
                      <ul className="text-[10px] text-[#6E7E96] leading-4 space-y-1 list-disc list-inside">
                        <li>Envie uma foto 3x4</li>
                        <li>Fundo neutro</li>
                        <li>Boa iluminação</li>
                        <li>JPG ou PNG, até 5 MB</li>
                      </ul>
                    </div>
                    {fotoOversize && (
                      <div className="w-[205px] rounded-md border border-amber-300 bg-amber-50 flex items-center gap-2 px-3 py-2 text-[10px] font-medium text-[#AE4032]">
                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Imagem ultrapassa os 5 MB
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {cropModalOpen && cropSrc && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-white rounded-xl w-full max-w-lg p-4 shadow-lg flex flex-col gap-4">
                <div className="text-sm font-medium text-slate-700">Ajuste o recorte</div>
                <div className="relative w-full h-72 rounded-md overflow-hidden bg-slate-100">
                  <Cropper
                    image={cropSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={3/4}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => { setCropModalOpen(false); setCropSrc(null); }}>Cancelar</Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!cropSrc || !croppedAreaPixels) return;
                      try {
                        setFotoUploading(true);
                        const blob = await getCroppedBlob(cropSrc, croppedAreaPixels);
                        // remover foto temporária anterior
                        if (fotoPreview && fotoPreview.startsWith('/uploads/')) {
                          try { await fetch('/api/upload', { method: 'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: fotoPreview }) }); } catch (e) { if (process.env.NODE_ENV === 'development') console.debug('Falha remover foto antiga', e); }
                        }
                        const formData = new FormData();
                        formData.append('file', new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        if (!res.ok) throw new Error('Falha no upload');
                        const json = await res.json() as { url: string };
                        setFotoPreview(json.url);
                        form.setValue('foto', json.url, { shouldDirty: true });
                        toast.custom(() => <CustomToast title="Foto atualizada" variant="success" />);
                        setCropModalOpen(false); setCropSrc(null);
                      } catch (e) {
                        toast.custom(() => <CustomToast title="Erro" description={(e as Error).message} variant="error" />);
                      } finally {
                        setFotoUploading(false);
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {steps[idx].label === "Endereço" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <MaskedField
                  kind="cep"
                  name="endereco.cep"
                  label="CEP"
                  placeholder="00000-000"
                  onBlurDigits={async (digits) => {
                    if (digits.length === 8) {
                      setCepAlunoLoading(true);
                      const data = await viaCepLookup(digits);
                      if (data) {
                        form.setValue("endereco.logradouro", data.logradouro || "");
                        form.setValue("endereco.bairro", data.bairro || "");
                        form.setValue("endereco.cidade", data.localidade || "");
                        form.setValue("endereco.uf", data.uf || "");
                      }
                      setCepAlunoLoading(false);
                    }
                  }}
                />
                {cepAlunoLoading && <div className="text-[10px] text-slate-500 mt-1">Buscando endereço…</div>}
              </div>
              <Field name="endereco.logradouro" label="Logradouro" placeholder="Rua" />
              <Field name="endereco.numero" label="Número" placeholder="Nº" />
              <Field name="endereco.complemento" label="Compl." placeholder="Apto/Bloco" />
              <Field name="endereco.bairro" label="Bairro" />
              <Field name="endereco.cidade" label="Cidade" />
              <UFField name="endereco.uf" label="UF" />
            </div>
          )}

          {steps[idx].label === "Saúde" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <TextArea name="alergias" label="Alergias" rows={3} />
              <TextArea name="restricoesMedicas" label="Restrições médicas" rows={3} />
            </div>
          )}

          {steps[idx].label === "Emergência" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field name="contatoEmergenciaNome" label="Contato de emergência - Nome" />
              <MaskedField kind="phone" name="contatoEmergenciaTelefone" label="Contato de emergência - Telefone" placeholder="(00) 00000-0000" />
            </div>
          )}

          {steps[idx].label === "Responsável" && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field name="responsavel.nome" label="Responsável - Nome" />
                <MaskedField kind="cpf" name="responsavel.cpf" label="Responsável - CPF" placeholder="000.000.000-00" />
                <Field name="responsavel.email" label="Responsável - Email" type="email" />
                <MaskedField kind="phone" name="responsavel.telefone" label="Responsável - Telefone" placeholder="(00) 00000-0000" />
                <Checkbox name="responsavel.financeiro" label="Responsável financeiro" />
                <Checkbox name="copiarEnderecoResponsavel" label="Copiar endereço do aluno para o responsável" />
              </div>
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-2">Endereço do responsável (opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <MaskedField
                      kind="cep"
                      name="responsavel.endereco.cep"
                      label="CEP"
                      placeholder="00000-000"
                      onBlurDigits={async (digits) => {
                        if (digits.length === 8) {
                          setCepRespLoading(true);
                          const data = await viaCepLookup(digits);
                          if (data) {
                            form.setValue("responsavel.endereco.logradouro", data.logradouro || "");
                            form.setValue("responsavel.endereco.bairro", data.bairro || "");
                            form.setValue("responsavel.endereco.cidade", data.localidade || "");
                            form.setValue("responsavel.endereco.uf", data.uf || "");
                          }
                          setCepRespLoading(false);
                        }
                      }}
                    />
                    {cepRespLoading && <div className="text-[10px] text-slate-500 mt-1">Buscando endereço…</div>}
                  </div>
                  <Field name="responsavel.endereco.logradouro" label="Logradouro" placeholder="Rua" />
                  <Field name="responsavel.endereco.numero" label="Número" placeholder="Nº" />
                  <Field name="responsavel.endereco.complemento" label="Compl." placeholder="Apto/Bloco" />
                  <Field name="responsavel.endereco.bairro" label="Bairro" />
                  <Field name="responsavel.endereco.cidade" label="Cidade" />
                  <UFField name="responsavel.endereco.uf" label="UF" />
                </div>
              </div>
            </div>
          )}

          {steps[idx].label === "Preferências" && (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Campos de matrícula foram removidos: origemCadastro, desconto%, isentoTaxa, codigoInterno */}
                <SelectField
                  name="status"
                  label="Status do aluno"
                  placeholder="Selecione"
                  options={[
                    { value: "ATIVO", label: "Ativo" },
                    { value: "INATIVO", label: "Inativo" },
                  ]}
                />
                <SelectField
                  name="tamanhoCamiseta"
                  label="Tamanho camiseta"
                  placeholder="Selecione"
                  options={[
                    { value: "PP", label: "PP" },
                    { value: "P", label: "P" },
                    { value: "M", label: "M" },
                    { value: "G", label: "G" },
                    { value: "GG", label: "GG" },
                  ]}
                />
                <SelectField
                  name="tamanhoCalcado"
                  label="Tamanho calçado"
                  placeholder="Selecione"
                  options={[
                    { value: "33", label: "33" },
                    { value: "34", label: "34" },
                    { value: "35", label: "35" },
                    { value: "36", label: "36" },
                    { value: "37", label: "37" },
                    { value: "38", label: "38" },
                    { value: "39", label: "39" },
                    { value: "40", label: "40" },
                    { value: "41", label: "41" },
                    { value: "42", label: "42" },
                    { value: "43", label: "43" },
                    { value: "44", label: "44" },
                    { value: "45", label: "45" },
                  ]}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4">
                  <Checkbox name="consentimentoImagem" label="Consentimento de imagem" />
                  <Field name="dataConsentimentoImagem" label="Data do consentimento" type="date" />
                </div>
                <Checkbox name="consentimentoComunicacoes" label="Consentimento de comunicações" />
              </div>
              <TagsField name="tags" label="Tags" placeholder="Ex.: manhã, turma A" />
              <TextArea name="observacao" label="Observações" rows={4} />
            </div>
          )}

          {steps[idx].label === "Confirmação" && <ConfirmacaoSummary fotoPreview={fotoPreview} />}
        </div>

  <div className={`px-6 py-4 border-t border-slate-200 flex justify-end gap-2`}> 
          <Button type="button" variant="outline" className="text-slate-700 border-slate-300 hover:bg-slate-50" disabled={idx === 0} onClick={back}>
            Voltar
          </Button>
          {idx < steps.length - 1 ? (
            <Button type="button" onClick={next} disabled={submitting}>Próximo</Button>
          ) : (
            <Button type="button" data-testid="aluno-concluir" onClick={next} disabled={submitting}>{submitting ? "Salvando..." : "Concluir"}</Button>
          )}
        </div>
        {/* Popup de confirmação removido: agora o Dialog pai controla via onOpenChange */}
      </div>
    </FormProvider>
    </>
  );
}

// --------- Inputs helpers ---------
function Field({ name, label, type = "text", placeholder }: { name: Path<AlunoCreateInput>; label: string; type?: string; placeholder?: string }) {
  const { register, formState: { errors } } = useFormContext<AlunoCreateInput>();
  const err = getError(errors as FieldErrors<AlunoCreateInput>, name as string);
  const testId = `aluno-${String(name).replace(/\./g, '-')}`;
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input {...register(name)} type={type} placeholder={placeholder} data-testid={testId} className={`h-9 px-3 rounded-md border text-sm bg-white ${err ? "border-red-300" : "border-slate-300"}`} />
      {err && <span className="text-[10px] text-red-500 font-medium">{err}</span>}
    </div>
  );
}

function DateField({ name, label }: { name: "dataNasc"; label: string }) {
  const { setValue, watch, formState: { errors } } = useFormContext<AlunoCreateInput>();
  const raw = watch("dataNasc") as string | Date | undefined;
  const initial = useMemo(() => {
    if (!raw) return "";
    const d = raw instanceof Date ? raw : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, [raw]);
  const [text, setText] = useState(initial);
  // Se valor externo mudar (ex: reset), sincroniza
  useEffect(() => { setText(initial); }, [initial]);

  const err = getError(errors as FieldErrors<AlunoCreateInput>, name);

  function formatMasked(v: string) {
    // Remove tudo que não é dígito
    const digits = v.replace(/\D/g, '').slice(0,8); // ddmmYYYY
    let out = '';
    if (digits.length <= 2) out = digits; else if (digits.length <= 4) out = `${digits.slice(0,2)}/${digits.slice(2)}`; else out = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
    return out;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const masked = formatMasked(v);
    setText(masked);
    // Quando completo 8 dígitos tenta converter
    const digits = masked.replace(/\D/g, '');
    if (digits.length === 8) {
      const dd = parseInt(digits.slice(0,2), 10);
      const mm = parseInt(digits.slice(2,4), 10);
      const yyyy = parseInt(digits.slice(4), 10);
      const date = new Date(yyyy, mm - 1, dd);
      const valid = date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
      if (valid) {
        setValue("dataNasc", date, { shouldDirty: true });
      } else {
        // mantém somente texto inválido sem setar form value (evita limpar)
      }
    } else {
      // Enquanto incompleto, não sobrescreve valor existente no form, permitindo digitação gradual
    }
  }

  function handleBlur() {
    // Se ao sair estiver incompleto (<10 chars) e não vazio, mantém texto mas não seta form; dev decide se quer limpar.
    // Opcional: poderíamos limpar parcial, porém pedido foi não apagar enquanto digita.
  }

  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        data-testid="aluno-dataNasc"
        className={`h-9 px-3 rounded-md border text-sm bg-white font-sans tracking-wide ${err ? "border-red-300" : "border-slate-300"}`}
      />
      {err && <span className="text-[10px] text-red-500 font-medium">{err}</span>}
    </div>
  );
}

function TextArea({ name, label, rows = 3 }: { name: Path<AlunoCreateInput>; label: string; rows?: number }) {
  const { register } = useFormContext<AlunoCreateInput>();
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <textarea {...register(name)} rows={rows} className="px-3 py-2 rounded-md border border-slate-300 text-sm bg-white" />
    </div>
  );
}

function Checkbox({ name, label }: { name: Path<AlunoCreateInput>; label: string }) {
  const { register } = useFormContext<AlunoCreateInput>();
  return (
    <label className="flex items-center gap-2 text-[12px] font-medium select-none text-gray-700">
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register(name)} /> {label}
    </label>
  );
}

function getError(errors: FieldErrors<AlunoCreateInput>, path: string) {
  const parts = path.split(".");
  let cur: unknown = errors;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return (cur as { message?: string } | undefined)?.message as string | undefined;
}

// --------- UFField (apenas letras, 2 caracteres) ---------
function UFField({ name, label }: { name: Path<AlunoCreateInput>; label: string }) {
  const { setValue, watch, formState: { errors } } = useFormContext<AlunoCreateInput>();
  const val = (watch(name) as string | undefined) || "";
  const err = getError(errors as FieldErrors<AlunoCreateInput>, name as string);
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input
        value={val}
        onChange={(e) => {
          const up = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
          setValue(name, up as unknown as string, { shouldDirty: true });
        }}
        placeholder="UF"
        data-testid={`aluno-${String(name).replace(/\./g, '-')}`}
        className={`h-9 px-3 rounded-md border text-sm bg-white ${err ? "border-red-300" : "border-slate-300"}`}
      />
      {err && <span className="text-[10px] text-red-500 font-medium">{err}</span>}
    </div>
  );
}

// --------- SelectField ---------
type Option = { value: string; label: string };
function SelectField({ name, label, placeholder, options }: { name: Path<AlunoCreateInput>; label: string; placeholder?: string; options: Option[] }) {
  const { setValue, watch, formState: { errors } } = useFormContext<AlunoCreateInput>();
  const val = watch(name) as string | undefined;
  const err = getError(errors as FieldErrors<AlunoCreateInput>, name as string);
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <Select value={val} onValueChange={(v) => setValue(name, v as unknown as string, { shouldDirty: true })}>
        <SelectTrigger data-testid={`aluno-${String(name).replace(/\./g, '-')}`} className={`h-9 ${err ? "border-red-300" : "border-slate-300"}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {err && <span className="text-[10px] text-red-500 font-medium">{err}</span>}
    </div>
  );
}

// --------- TagsField (chips simples separados por vírgula) ---------
function TagsField({ name, label, placeholder }: { name: Path<AlunoCreateInput>; label: string; placeholder?: string }) {
  const { setValue, watch } = useFormContext<AlunoCreateInput>();
  const arr = (watch(name) as string[] | undefined) || [];
  const text = arr.join(", ");
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input
        type="text"
        value={text}
        onChange={(e) => {
          const list = e.target.value
            .split(/,|;/)
            .map((s) => s.trim())
            .filter(Boolean);
          setValue(name, list as unknown as string[], { shouldDirty: true });
        }}
        placeholder={placeholder}
        className="h-9 px-3 rounded-md border text-sm bg-white border-slate-300"
      />
      <span className="text-[10px] text-slate-500 mt-1">Separe por vírgula ou ponto e vírgula</span>
    </div>
  );
}

// --------- MaskedField ---------
function MaskedField({
  name,
  label,
  placeholder,
  kind,
  onBlurDigits,
}: {
  name: Path<AlunoCreateInput>;
  label: string;
  placeholder?: string;
  kind: "cpf" | "cep" | "phone";
  onBlurDigits?: (_digits: string) => void | Promise<void>;
}) {
  const { setValue, watch, formState: { errors } } = useFormContext<AlunoCreateInput>();
  const raw = (watch(name) as string) || "";
  const formatted = useMemo(() => {
    const digits = raw.replace(/\D/g, "");
    if (kind === "cpf") {
      return digits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    if (kind === "cep") {
      return digits.slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
    }
    // phone: (00) 00000-0000
    if (kind === "phone") {
      if (digits.length <= 10) {
        return digits
          .slice(0, 10)
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
      }
      return digits
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
    }
    return raw;
  }, [raw, kind]);
  const err = getError(errors as FieldErrors<AlunoCreateInput>, name as string);
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input
        value={formatted}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setValue(name, digits as unknown as string, { shouldDirty: true });
        }}
        onBlur={async (e) => {
          if (onBlurDigits) {
            const digits = e.currentTarget.value.replace(/\D/g, "");
            await onBlurDigits(digits);
          }
        }}
        placeholder={placeholder}
        data-testid={`aluno-${String(name).replace(/\./g, '-')}`}
        className={`h-9 px-3 rounded-md border text-sm bg-white ${err ? "border-red-300" : "border-slate-300"}`}
      />
      {err && <span className="text-[10px] text-red-500 font-medium">{err}</span>}
    </div>
  );
}

// --------- FotoUpload com preview e upload real ---------

// --------- Resumo da Confirmação ---------
function ConfirmacaoSummary({ fotoPreview }: { fotoPreview: string | null }) {
  const { getValues } = useFormContext<AlunoCreateInput>();
  const v = getValues();
  const endereco: Partial<AlunoCreateInput["endereco"]> = v.endereco || {};
  const resp: Partial<NonNullable<AlunoCreateInput["responsavel"]>> = v.responsavel || {};
  const respEnd: Partial<NonNullable<typeof resp["endereco"]>> = resp.endereco || {};
  return (
    <div className="text-sm text-slate-700 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
          {fotoPreview ? <img src={fotoPreview} alt="Prévia" className="h-full w-full object-cover" /> : <div className="text-[10px] text-slate-500">Sem foto</div>}
        </div>
        <div>
          <div className="font-semibold">{v.nome}</div>
          <div className="text-xs text-slate-500">{v.email || "—"} • {v.telefone || "—"}</div>
        </div>
      </div>

      <Section title="Identificação">
        <Grid2>
          <Item label="Nome social" value={v.nomeSocial} />
          <Item label="CPF" value={v.cpf} />
          <Item label="Gênero" value={v.genero} />
          <Item label="Nascimento" value={v.dataNasc?.toLocaleDateString?.() || String(v.dataNasc || "")} />
        </Grid2>
      </Section>

      <Section title="Endereço do aluno">
        <Grid2>
          <Item label="CEP" value={endereco.cep} />
          <Item label="Logradouro" value={endereco.logradouro} />
          <Item label="Número" value={endereco.numero} />
          <Item label="Compl." value={endereco.complemento} />
          <Item label="Bairro" value={endereco.bairro} />
          <Item label="Cidade/UF" value={`${endereco.cidade || ""}${endereco.uf ? `/${endereco.uf}` : ""}`} />
        </Grid2>
      </Section>

      {v.responsavel && (
        <Section title="Responsável">
          <Grid2>
            <Item label="Nome" value={resp.nome} />
            <Item label="CPF" value={resp.cpf} />
            <Item label="Email" value={resp.email} />
            <Item label="Telefone" value={resp.telefone} />
            <Item label="Financeiro" value={resp.financeiro ? "Sim" : "Não"} />
          </Grid2>
          <div className="mt-3">
            <div className="text-[11px] text-slate-500 mb-1">Endereço do responsável</div>
            <Grid2>
              <Item label="CEP" value={respEnd.cep} />
              <Item label="Logradouro" value={respEnd.logradouro} />
              <Item label="Número" value={respEnd.numero} />
              <Item label="Compl." value={respEnd.complemento} />
              <Item label="Bairro" value={respEnd.bairro} />
              <Item label="Cidade/UF" value={`${respEnd.cidade || ""}${respEnd.uf ? `/${respEnd.uf}` : ""}`} />
            </Grid2>
          </div>
        </Section>
      )}

      <Section title="Preferências e consentimentos">
        <Grid2>
          <Item label="Status do aluno" value={v.status} />
          <Item label="Camisa" value={v.tamanhoCamiseta} />
          <Item label="Calçado" value={v.tamanhoCalcado} />
          <Item label="Consent. imagem" value={v.consentimentoImagem ? "Sim" : "Não"} />
          <Item label="Data consent." value={v.dataConsentimentoImagem ? String(v.dataConsentimentoImagem) : "—"} />
          <Item label="Consent. comunicações" value={v.consentimentoComunicacoes ? "Sim" : "Não"} />
          <Item label="Tags" value={Array.isArray(v.tags) && v.tags.length ? v.tags.join(", ") : "—"} />
        </Grid2>
        {v.observacao && (
          <div className="mt-2 text-xs text-slate-600">
            <div className="font-medium">Observações</div>
            <div className="mt-1 whitespace-pre-wrap">{v.observacao}</div>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-h-[38px] rounded-md border border-slate-200 bg-white p-2">
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-[13px] text-slate-800 break-words">{value || "—"}</div>
    </div>
  );
}

// --------- Util: ViaCEP ---------
async function viaCepLookup(
  cepDigits: string
): Promise<{
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
} | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as { erro?: boolean } & Record<string, string>;
    if (data.erro) return null;
    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
    };
  } catch {
    return null;
  }
}

export default AlunoWizard;