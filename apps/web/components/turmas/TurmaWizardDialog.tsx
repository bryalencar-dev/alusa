'use client';
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';
import {
  turmaSchema,
  type TurmaCreateInput,
} from '../../../../packages/lib/src/schemas/turma.schema';
// Reuso de componentes de UI padronizados do wizard de alunos
// Components dos steps importados individualmente
import StepDadosBasicos from './steps/StepDadosBasicos';
import StepAgenda from './steps/StepAgenda';
import StepRestricoes from './steps/StepRestricoes';
import StepProfessores from './steps/StepProfessores';
import StepResumo from './steps/StepResumo';
import { useSession } from 'next-auth/react';
import { LookupsProvider } from './steps/lookups-context';
import { invalidateTurmaLookupsCache, useTurmaLookups } from '@/hooks/use-turma-lookups';
import {
  invalidateProfessoresLookupCache,
  useProfessoresLookup,
} from '@/hooks/use-professores-lookup';
import type { Modalidade, Sala, Professor } from './types';

// (Dias agora definidos dentro do StepAgenda extraído)

type WizardValues = Omit<TurmaCreateInput, 'contaId'> & { contaId: string };

interface Props {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  contaId: string;
  onSaved?: (_id: string) => void;
}

export default function TurmaWizardDialog({ open, onOpenChange, contaId, onSaved }: Props) {
  // Alerta interno (toast inline) exibido dentro do wizard
  type InlineAlert = { type: 'error' | 'warning' | 'info'; message: string };
  const [inlineAlert, setInlineAlert] = React.useState<InlineAlert | null>(null);
  const alertTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const topRef = React.useRef<HTMLDivElement | null>(null);

  function showInlineAlert(
    message: string,
    type: InlineAlert['type'] = 'error',
    autoHideMs = 6500,
  ) {
    setInlineAlert({ message, type });
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    if (autoHideMs > 0) {
      alertTimerRef.current = setTimeout(() => setInlineAlert(null), autoHideMs);
    }
    // rola suavemente para o topo do wizard onde está o alerta
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  const steps = React.useMemo(
    () => [
      { id: 1, title: 'Dados Básicos', key: 'basicos' },
      { id: 2, title: 'Agenda & Horário', key: 'agenda' },
      { id: 3, title: 'Restrições & Observações', key: 'restricoes' },
      { id: 4, title: 'Professores', key: 'professores' },
      { id: 5, title: 'Resumo', key: 'resumo' },
    ],
    [],
  );
  const maxStep = steps.length;
  const [step, setStep] = React.useState(1);
  const [confirmClose, setConfirmClose] = React.useState(false);
  const { data: session } = useSession();
  const effectiveContaId = React.useMemo(
    () =>
      contaId || (session?.user as { contaId?: string } | undefined)?.contaId || 'conta-default',
    [contaId, session],
  );
  const defaultValues = React.useMemo(
    () =>
      ({
        nome: '',
        modalidadeId: '',
        salaId: '',
        diasSemana: [],
        horaInicio: '',
        horaFim: '',
        capacidade: 10,
        status: 'ATIVO',
        observacao: '',
        contaId: effectiveContaId,
      }) as WizardValues,
    [effectiveContaId],
  );
  const methods = useForm<WizardValues>({
    // turmaSchema já tipado, cast mínimo para compat devido a campos opcionais dinâmicos
    resolver: zodResolver(turmaSchema as unknown as Parameters<typeof zodResolver>[0]),
    defaultValues,
    mode: 'onChange',
  });
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      methods.reset(defaultValues);
    } else {
      // Ao abrir: invalida caches para garantir dados frescos
      invalidateTurmaLookupsCache(effectiveContaId);
      invalidateProfessoresLookupCache(effectiveContaId);
    }
  }, [open, defaultValues, methods, effectiveContaId]);

  React.useEffect(() => {
    methods.setValue('contaId', effectiveContaId, { shouldDirty: false });
  }, [methods, effectiveContaId]);

  const turmaLookups = useTurmaLookups(effectiveContaId);
  const professoresLookup = useProfessoresLookup(effectiveContaId);

  const lookupsValue = {
    modalidades: turmaLookups.modalidades,
    salas: turmaLookups.salas,
    professores: professoresLookup.professores,
    loading: {
      modalidades: turmaLookups.loading,
      salas: turmaLookups.loading,
      professores: professoresLookup.loading,
      any: turmaLookups.loading || professoresLookup.loading,
    },
    reloadModalidades: turmaLookups.reloadModalidades,
    reloadSalas: turmaLookups.reloadSalas,
    reloadProfessores: professoresLookup.reloadProfessores,
  } as const;

  // Confirmação de saída caso haja alterações
  // Guard para fechamento: intercepta tentativa de fechar quando dirty
  const originalOnOpenChange = onOpenChange;
  const guardedOnOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && methods.formState.isDirty) {
        setConfirmClose(true);
        return;
      }
      originalOnOpenChange(next);
    },
    [methods.formState.isDirty, originalOnOpenChange],
  );

  const pct = (step / maxStep) * 100;
  const active = steps.find((s) => s.id === step);

  async function submitAll(data: WizardValues) {
    try {
      // Log detalhado do payload para debug
      const resolvedContaId =
        data.contaId ||
        (session?.user as { contaId?: string } | undefined)?.contaId ||
        effectiveContaId;
      if (!data.contaId) {
        // garante que form tenha contaId para consistência
        methods.setValue('contaId', resolvedContaId, { shouldDirty: false });
      }
      const payload = {
        ...data,
        contaId: resolvedContaId,
        professoresIds: Array.isArray(data.professoresIds)
          ? [...new Set(data.professoresIds.filter(Boolean))]
          : [],
      };
      console.log('[TurmaWizard] Enviando payload:', JSON.stringify(payload, null, 2));
      const res = await fetch('/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        const code = json?.error || json?.code || json?.status || '';
        const detail: string | undefined = json?.detail;
        type Issue = { path?: (string | number)[]; message?: string };
        const issues = json?.issues as Issue[] | undefined;
        let userMsg = 'Erro ao salvar turma.';
        switch (code) {
          case 'CONFLITO_HORARIO_SALA':
            userMsg = detail
              ? `${detail} Ajuste os horários ou dias.`
              : 'Conflito de horário: ajuste os horários ou dias.';
            // marca campos de horário como erro visual
            methods.setError('horaInicio' as keyof WizardValues, {
              type: 'manual',
              message: 'Conflito',
            });
            methods.setError('horaFim' as keyof WizardValues, {
              type: 'manual',
              message: 'Conflito',
            });
            // volta para etapa 2 para o usuário editar imediatamente
            setStep(2);
            break;
          case 'MODALIDADE_FORA_CONTA':
            userMsg = 'Modalidade não pertence a esta conta.';
            break;
          case 'SALA_FORA_CONTA':
            userMsg = 'Sala não pertence a esta conta.';
            break;
          case 'PROFESSOR_INVALIDO_OU_FORA_CONTA':
            userMsg = 'Professor inválido ou fora da conta.';
            break;
          case 'HORARIO_INVALIDO':
            userMsg = 'Horário inválido: hora inicial deve ser antes da final.';
            methods.setError('horaInicio' as keyof WizardValues, {
              type: 'manual',
              message: 'Horário inválido',
            });
            methods.setError('horaFim' as keyof WizardValues, {
              type: 'manual',
              message: 'Horário inválido',
            });
            setStep(2);
            break;
          case 'IDADE_INVALIDA':
            userMsg = 'Faixa etária inválida (mínima maior que máxima).';
            break;
          case 'DUPLICIDADE_NOME':
            userMsg =
              'Já existe uma turma com este nome nesta conta. Escolha outro nome ou altere ligeiramente.';
            break;
          case 'VALIDACAO':
            if (issues?.length) {
              const first = issues[0];
              userMsg =
                `Campo inválido: ${first?.path?.join?.('.') || ''} - ${first?.message || 'verifique os dados.'}`.trim();
              const joined = (first?.path || []).join('.') || '';
              if (/horaInicio|horaFim|diasSemana/.test(joined)) setStep(2);
              // Se houver múltiplos erros, sumariza quantidade
              if (issues.length > 1) {
                userMsg += ` (+${issues.length - 1} outro${issues.length - 1 > 1 ? 's' : ''})`;
              }
            } else {
              userMsg = detail || 'Dados inválidos. Verifique os campos.';
            }
            break;
          default:
            if (detail) userMsg = detail;
        }
        // eslint-disable-next-line no-console
        console.error('[TurmaWizard] Falha ao criar turma', {
          status: res.status,
          code,
          json,
          payload,
        });
        showInlineAlert(userMsg, 'error');
        return;
      }
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Turma criada"
          description="As informações foram salvas com sucesso."
          onClose={() => toast.dismiss(t)}
        />
      ));
      const newId = json?.data?.id || json?.id;
      if (newId) onSaved?.(newId);
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent('turmas:changed'));
    } catch {
      showInlineAlert('Falha de comunicação. Tente novamente.', 'error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={guardedOnOpenChange}>
      <DialogContent
        title="Cadastrar turma"
        className="max-w-5xl w-full overflow-x-hidden"
        data-testid="turma-wizard"
      >
        <div className="mb-2">
          <DialogTitle className="text-xl md:text-2xl font-medium tracking-tight">
            Cadastrar turma
          </DialogTitle>
        </div>
        <FormProvider {...methods}>
          <div ref={topRef} className="flex max-h-[78vh] flex-col overflow-x-hidden">
            {inlineAlert && (
              <div
                role="alert"
                aria-live="assertive"
                className={`mb-3 flex items-start gap-3 rounded-md border px-3 py-2 text-xs sm:text-sm font-medium shadow-sm
                  ${inlineAlert.type === 'error' ? 'border-red-300 bg-red-50 text-red-700' : ''}
                  ${inlineAlert.type === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-800' : ''}
                  ${inlineAlert.type === 'info' ? 'border-violet-300 bg-violet-50 text-violet-800' : ''}`}
              >
                <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-current text-[10px] leading-none">
                  !
                </span>
                <span className="flex-1 leading-snug pr-2">{inlineAlert.message}</span>
                <button
                  type="button"
                  aria-label="Fechar aviso"
                  onClick={() => setInlineAlert(null)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/5 text-[11px]"
                >
                  ✕
                </button>
              </div>
            )}
            {/* Barra de progresso e info de etapa */}
            <div className="space-y-4 pt-1 pb-3">
              <div className="rounded-full bg-slate-200">
                <Progress value={pct} className="h-2" />
              </div>
              <div className="flex flex-wrap items-center justify-start gap-2 text-xs">
                <span className="font-medium text-slate-600">
                  Etapa {step} de {maxStep}
                </span>
                {active?.title && <span className="text-slate-500">/ {active.title}</span>}
              </div>
            </div>

            {/* Conteúdo animado */}
            <LookupsProvider value={lookupsValue}>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="space-y-6 pb-8 w-full overflow-x-hidden"
                  >
                    {step === 1 && <StepDadosBasicos contaId={effectiveContaId} />}
                    {step === 2 && <StepAgenda />}
                    {step === 3 && <StepRestricoes />}
                    {step === 4 && <StepProfessores />}
                    {step === 5 && <StepResumo />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </LookupsProvider>

            {/* Footer / Navegação */}
            <div className="sticky bottom-0 mt-auto flex items-center justify-between gap-4 border-t bg-white/90 px-0 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70">
              <div className="px-6 flex w-full items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                  className="h-10 px-4 border border-gray-300 text-slate-700 bg-white hover:bg-gray-50 shadow-none"
                  data-testid="wizard-prev"
                >
                  Etapa Anterior
                </Button>
                {step < maxStep ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      const fields = stepFieldMap[step as StepNumber] || [];
                      const ok = await (fields.length
                        ? methods.trigger(fields as (keyof WizardValues)[])
                        : methods.trigger());
                      if (!ok) {
                        focusFirstError(methods);
                        showInlineAlert(
                          'Existem campos inválidos nesta etapa. Revise os campos destacados.',
                          'error',
                        );
                        return;
                      }
                      setStep((s) => Math.min(maxStep, s + 1));
                    }}
                    className="h-10 px-4 bg-violet-600 text-white hover:bg-violet-700 shadow-none"
                    data-testid="wizard-next"
                  >
                    Próxima Etapa
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={methods.handleSubmit(submitAll)}
                    className="h-10 px-4 bg-violet-600 text-white hover:bg-violet-700 shadow-none"
                    data-testid="turma-concluir"
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          </div>
        </FormProvider>
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
      </DialogContent>
    </Dialog>
  );
}

// util para foco no primeiro erro
function focusFirstError(methods: ReturnType<typeof useForm<WizardValues>>) {
  const errors = methods.formState.errors as Record<string, unknown>;
  const queue: string[] = Object.keys(errors);
  if (queue.length === 0) return;
  const first = queue[0];
  const el = document.querySelector(`[name="${first}"]`) as HTMLElement | null;
  if (el && typeof el.focus === 'function') {
    el.focus();
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

type StepNumber = 1 | 2 | 3 | 4 | 5;
const stepFieldMap: Record<StepNumber, (keyof WizardValues)[]> = {
  1: ['nome', 'modalidadeId', 'salaId', 'capacidade'],
  2: ['diasSemana', 'horaInicio', 'horaFim'],
  3: ['idadeMin', 'idadeMax', 'observacao'],
  4: ['professoresIds'],
  5: [],
};

export type { Modalidade, Sala, Professor };
