'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useForm, FormProvider } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageCropDialog } from '../shared/ImageCropDialog';
import { alunoSchema, type AlunoInput } from '../../../../prisma/zod/aluno';
// UI e steps extraídos
import { StepHeader, SectionCard } from './wizard/ui';
import IdentificacaoFields from './wizard/steps/IdentificacaoFields';
import EnderecoFields from './wizard/steps/EnderecoFields';
import SaudeFields from './wizard/steps/SaudeFields';
import PerfilFields from './wizard/steps/PerfilFields';
import FotoFields from './wizard/steps/FotoFields';
import ResponsavelFields from './wizard/steps/ResponsavelFields';
import ConfirmacaoSection from './wizard/steps/ConfirmacaoSection';
import {
  digits,
  parseMaybeDate,
  yearsDiff,
  buildStepFieldMap,
  focusFirstError,
} from './wizard/utils';

type StepId =
  | 'identificacao'
  | 'endereco'
  | 'saude'
  | 'perfil'
  | 'foto'
  | 'responsavel'
  | 'confirmar';
type WizardData = AlunoInput;

// ------------------------ componente principal ------------------------
export interface AlunoWizardDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onFinish?: () => void;
  contaId?: string | null;
}

export default function AlunoWizardDialog({
  open,
  onOpenChange,
  onFinish,
  contaId,
}: AlunoWizardDialogProps) {
  const resolvedContaId = React.useMemo(() => {
    if (typeof contaId === 'string' && contaId.trim().length > 0) {
      return contaId;
    }
    return null;
  }, [contaId]);
  const methods = useForm<WizardData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      status: 'ATIVO',
      responsavel: null,
    } as Partial<WizardData>,
    mode: 'onBlur',
  });

  // Controle de confirmação de saída
  const [confirmClose, setConfirmClose] = React.useState(false);
  // Sempre perguntar (requisito atual) — podemos depois condicionar a isDirty
  function requestClose(next: boolean) {
    if (next === false && open) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(next);
  }
  // ESC dentro do overlay de confirmação
  React.useEffect(() => {
    if (!confirmClose) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setConfirmClose(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmClose]);

  // Foto local
  const [foto, setFoto] = React.useState<string>('');
  const [cropSource, setCropSource] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const missingContaWarnedRef = React.useRef(false);

  // Idade → responsável condicional
  const dataNascWatch = methods.watch('dataNasc');
  const birth = parseMaybeDate(dataNascWatch);
  const isMinor = birth ? yearsDiff(birth) < 18 : false;

  // Steps dinâmicos
  const steps: { id: StepId; label: string }[] = React.useMemo(() => {
    const base: { id: StepId; label: string }[] = [
      { id: 'identificacao', label: 'IDENTIFICAÇÃO' },
      { id: 'endereco', label: 'Endereço' },
      { id: 'saude', label: 'SAÚDE & EMERGÊNCIA' },
      { id: 'perfil', label: 'PERFIL' },
      { id: 'foto', label: 'Foto' },
    ];
    if (isMinor) base.push({ id: 'responsavel', label: 'RESPONSÁVEL' });
    base.push({ id: 'confirmar', label: 'Confirmação' });
    return base;
  }, [isMinor]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeStep = steps[activeIndex]?.id ?? 'identificacao';
  const [submitting, setSubmitting] = React.useState(false);
  const [minorToastShown, setMinorToastShown] = React.useState(false);
  // Crop dialog state (foto)
  const [cropOpen, setCropOpen] = React.useState(false);

  // Reset ao abrir
  React.useEffect(() => {
    if (!open) return;
    methods.reset({
      contaId: resolvedContaId ?? undefined,
      status: 'ATIVO',
      responsavel: null,
    } as Partial<WizardData>);
    setFoto('');
    setCropSource(null);
    setCropOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveIndex(0);
    setMinorToastShown(false);
  }, [open, methods, resolvedContaId]);

  React.useEffect(() => {
    if (!resolvedContaId) {
      return;
    }
    methods.setValue('contaId', resolvedContaId, { shouldDirty: false });
  }, [resolvedContaId, methods]);

  const notifyError = React.useCallback((message: string) => {
    try {
      window.dispatchEvent(new CustomEvent('toast:error', { detail: { message } }));
    } catch {
      /* noop */
    }
  }, []);

  React.useEffect(() => {
    if (!open) {
      missingContaWarnedRef.current = false;
      return;
    }
    if (resolvedContaId) {
      missingContaWarnedRef.current = false;
      return;
    }
    if (!missingContaWarnedRef.current) {
      notifyError(
        'Não foi possível identificar a conta ativa. Faça login novamente e tente de novo.',
      );
      missingContaWarnedRef.current = true;
    }
  }, [open, resolvedContaId, notifyError]);

  // Aviso para menor de idade via evento de toast
  React.useEffect(() => {
    if (isMinor && !minorToastShown) {
      try {
        window.dispatchEvent(
          new CustomEvent('toast:info', {
            detail: { message: 'Aluno menor de 18 anos. Será necessário informar um responsável.' },
          }),
        );
      } catch {
        /* noop */
      }
      setMinorToastShown(true);
    }
  }, [isMinor, minorToastShown]);

  // Campos por step (validação incremental extraída)
  const stepFields = React.useMemo(() => buildStepFieldMap(isMinor), [isMinor]);

  function canGoPrev() {
    return activeIndex > 0;
  }
  function goPrev() {
    if (canGoPrev()) setActiveIndex((i) => i - 1);
  }
  async function goNext() {
    const id = activeStep;
    const fields = stepFields[id] as unknown as (keyof WizardData)[];
    if (fields.length > 0) {
      const ok = await methods.trigger(fields);
      if (!ok) {
        focusFirstError(methods.formState.errors);
        return;
      }
    }
    setActiveIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  async function submitAll() {
    if (!resolvedContaId) {
      notifyError('Não foi possível identificar a conta do cadastro.');
      return;
    }
    const ok = await methods.trigger();
    if (!ok) {
      setActiveIndex(0);
      focusFirstError(methods.formState.errors);
      return;
    }
    const values = methods.getValues();
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        ...values,
        contaId: resolvedContaId,
        cpf: digits(values.cpf),
        telefone: digits(values.telefone),
        contatoEmergenciaTelefone: digits(values.contatoEmergenciaTelefone),
        enderecoCep: digits(values.enderecoCep),
      };
      if (foto) {
        payload.foto = foto;
      }
      const res = await fetch('/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao salvar' }));
        notifyError(data.error || 'Erro ao salvar');
        return;
      }
      try {
        window.dispatchEvent(
          new CustomEvent('toast:success', { detail: { message: 'Aluno cadastrado com sucesso' } }),
        );
      } catch {
        /* noop */
      }
      try {
        window.dispatchEvent(new CustomEvent('alunos:changed'));
      } catch {
        /* noop */
      }
      onFinish?.();
      setTimeout(() => onOpenChange(false), 60);
    } catch {
      notifyError('Erro de comunicação');
    } finally {
      setSubmitting(false);
    }
  }

  const handleFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const MAX_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        notifyError('Arquivo excede o limite de 5MB.');
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) {
          notifyError('Não foi possível carregar a foto.');
          return;
        }
        setCropSource(result);
        setCropOpen(true);
      };
      reader.onerror = () => {
        notifyError('Não foi possível carregar a foto.');
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    [notifyError],
  );

  const handlePickPhoto = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleEditPhoto = React.useCallback(() => {
    if (!foto) {
      handlePickPhoto();
      return;
    }
    setCropSource(foto);
    setCropOpen(true);
  }, [foto, handlePickPhoto]);

  const handleRemovePhoto = React.useCallback(() => {
    setFoto('');
    setCropSource(null);
    setCropOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCropApply = React.useCallback((dataUrl: string) => {
    setFoto(dataUrl);
    setCropSource(null);
    setCropOpen(false);
  }, []);

  const handleCropClose = React.useCallback(() => {
    setCropOpen(false);
    setCropSource(null);
  }, []);

  const nomeWatch = methods.watch('nome');
  const nomeSocialWatch = methods.watch('nomeSocial');
  const avatarFallback = React.useMemo(() => {
    const base = (nomeWatch || nomeSocialWatch || '').trim();
    if (!base) return 'AL';
    const parts = base.split(/\s+/).filter(Boolean);
    const [first, second] = parts;
    const initials = `${first?.[0] ?? ''}${second?.[0] ?? ''}`.toUpperCase();
    if (initials) return initials;
    return (first?.[0] ?? 'A').toUpperCase();
  }, [nomeWatch, nomeSocialWatch]);

  // Persistência local (draft) em localStorage com debounce
  React.useEffect(() => {
    type W = Window & { __alunoDraftTimer?: number };
    const subscription = methods.watch(() => {
      const w = window as W;
      if (w.__alunoDraftTimer) clearTimeout(w.__alunoDraftTimer);
      w.__alunoDraftTimer = window.setTimeout(() => {
        try {
          const values = methods.getValues();
          const draft: Record<string, unknown> = { ...values };
          if (foto) {
            draft.__fotoDataUrl = foto;
          } else {
            delete draft.__fotoDataUrl;
          }
          localStorage.setItem('alunoWizardDraft', JSON.stringify(draft));
        } catch {
          /* noop */
        }
      }, 300);
    });
    return () => subscription.unsubscribe();
  }, [methods, foto]);

  // ------------------------ render ------------------------
  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent
        title="Cadastrar aluno"
        className="max-w-5xl w-full overflow-x-hidden"
        data-testid="aluno-wizard"
      >
        {/* Cabeçalho do modal */}
        <div className="mb-2">
          <DialogTitle className="text-xl md:text-2xl font-medium tracking-tight">
            Cadastrar aluno
          </DialogTitle>
        </div>
        <FormProvider {...methods}>
          <div className="flex max-h-[78vh] flex-col overflow-x-hidden">
            {/* Top (progress + header) */}
            <div className="space-y-4 pt-1 pb-3">
              <div className="rounded-full bg-slate-200">
                <Progress value={((activeIndex + 1) / steps.length) * 100} className="h-2" />
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 text-xs">
                <span className="font-medium text-slate-600">
                  Etapa {activeIndex + 1} de {steps.length}
                </span>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="space-y-6 pb-8 w-full overflow-x-hidden"
                >
                  {activeStep === 'identificacao' && (
                    <SectionCard>
                      <StepHeader title="Identificação" />
                      <IdentificacaoFields />
                    </SectionCard>
                  )}
                  {activeStep === 'endereco' && (
                    <SectionCard>
                      <StepHeader title="Endereço" />
                      <EnderecoFields />
                    </SectionCard>
                  )}
                  {activeStep === 'saude' && (
                    <SectionCard>
                      <StepHeader title="Saúde & Emergência" />
                      <SaudeFields />
                    </SectionCard>
                  )}
                  {activeStep === 'perfil' && (
                    <SectionCard>
                      <StepHeader
                        title="Perfil & Classificação"
                        hint="Campos de categorização interna e consentimentos."
                      />
                      <PerfilFields />
                    </SectionCard>
                  )}
                  {activeStep === 'foto' && (
                    <SectionCard>
                      <StepHeader
                        title="Foto do aluno"
                        hint="Opcional — ajuda na rápida identificação em listas e matrículas."
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                      <FotoFields
                        fotoPreview={foto ? foto : null}
                        avatarFallback={avatarFallback}
                        onEdit={handleEditPhoto}
                        onReplace={handlePickPhoto}
                        onRemove={handleRemovePhoto}
                      />
                    </SectionCard>
                  )}
                  {activeStep === 'responsavel' && isMinor && (
                    <SectionCard>
                      <StepHeader title="Responsável" hint="Obrigatório para menores de 18 anos." />
                      <ResponsavelFields />
                    </SectionCard>
                  )}
                  {activeStep === 'confirmar' && (
                    <SectionCard>
                      <StepHeader
                        title="Confirmar dados"
                        hint="Revise cuidadosamente antes de concluir."
                      />
                      <ConfirmacaoSection all={methods.getValues()} fotoPreview={foto || null} />
                    </SectionCard>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-4 border-t bg-white/90 px-0 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70">
              <div className="px-6 flex w-full items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrev}
                  disabled={!canGoPrev() || submitting}
                  className="h-10 px-4 border border-gray-300 text-slate-700 bg-white hover:bg-gray-50 shadow-none"
                  data-testid="wizard-prev"
                >
                  Etapa Anterior
                </Button>
                {activeStep !== 'confirmar' ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    disabled={submitting}
                    className="h-10 px-4 bg-violet-600 text-white hover:bg-violet-700 shadow-none"
                    data-testid="wizard-next"
                  >
                    Próxima Etapa
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={submitAll}
                    disabled={submitting}
                    className="h-10 px-4 bg-violet-600 text-white hover:bg-violet-700 shadow-none"
                    data-testid="aluno-concluir"
                  >
                    {submitting ? 'Salvando...' : 'Concluir'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </FormProvider>
        {/* Modal interno de confirmação */}
        {confirmClose && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/65 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
              <h4 className="text-sm font-semibold text-slate-800">Descartar cadastro?</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Existem informações não salvas. Se você sair agora, todos os dados digitados serão
                perdidos.
              </p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  autoFocus
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => setConfirmClose(false)}
                >
                  Continuar preenchendo
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => {
                    setConfirmClose(false);
                    onOpenChange(false);
                  }}
                >
                  Descartar
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Dialog de Crop */}
        <ImageCropDialog
          src={cropSource}
          open={cropOpen && Boolean(cropSource)}
          onClose={handleCropClose}
          onApply={handleCropApply}
          aspect={1}
          title="Ajustar corte"
        />
      </DialogContent>
    </Dialog>
  );
}
