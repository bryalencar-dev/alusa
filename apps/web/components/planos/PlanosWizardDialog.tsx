'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CustomToast } from '@/components/CustomToast';
import { toast } from 'sonner';
import StepDadosBasicos from './steps/StepDadosBasicos';
import StepFinanceiro from './steps/StepFinanceiro';
import StepStatusResumo from './steps/StepStatusResumo';
import {
  createPlanoRequest,
  updatePlanoRequest,
  type PlanoListItem,
} from '@/features/cadastro/planos/services/planos-service';

const wizardSchema = z.object({
  contaId: z.string().min(1, 'Conta é obrigatória'),
  nome: z.string().min(3, 'Informe ao menos 3 caracteres').max(120, 'Máximo de 120 caracteres'),
  descricao: z.union([z.string(), z.null(), z.undefined()]).transform((value) => {
    if (typeof value === 'undefined') return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }),
  periodicidade: z.enum(['MENSAL', 'QUINZENAL', 'SEMANAL', 'TRIMESTRAL', 'ANUAL']),
  valor: z.union([z.string(), z.number()]),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
});

export type PlanosWizardValues = z.infer<typeof wizardSchema>;

interface PlanosWizardDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  contaId: string;
  plano?: PlanoListItem | null;
  onSaved?: (_plano: PlanoListItem) => void;
}

const STEP_FIELDS: Record<number, Array<keyof PlanosWizardValues>> = {
  1: ['nome', 'descricao'],
  2: ['periodicidade', 'valor'],
};

export function PlanosWizardDialog({
  open,
  onOpenChange,
  contaId,
  plano,
  onSaved,
}: PlanosWizardDialogProps) {
  const steps = React.useMemo(
    () => [
      { id: 1, title: 'Dados básicos' },
      { id: 2, title: 'Financeiro' },
      { id: 3, title: 'Status e resumo' },
    ],
    [],
  );
  const maxStep = steps.length;
  const isEdit = Boolean(plano);

  const methods = useForm<PlanosWizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      contaId,
      nome: plano?.nome ?? '',
      descricao: plano?.descricao ?? '',
      periodicidade: plano?.periodicidade ?? 'MENSAL',
      valor: plano ? plano.valorDecimal : '',
      status: plano?.status ?? 'ATIVO',
    },
  });

  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      methods.reset({
        contaId,
        nome: plano?.nome ?? '',
        descricao: plano?.descricao ?? '',
        periodicidade: plano?.periodicidade ?? 'MENSAL',
        valor: plano ? plano.valorDecimal : '',
        status: plano?.status ?? 'ATIVO',
      });
      setStep(1);
      setSubmitting(false);
    }
  }, [open, plano, contaId, methods]);

  const pct = (step / maxStep) * 100;
  const activeStep = steps.find((item) => item.id === step)?.title ?? '';

  async function focusFirstError(fields: Array<keyof PlanosWizardValues>) {
    const fieldWithError = fields.find((field) => methods.formState.errors[field]);
    if (!fieldWithError) return;
    const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${String(fieldWithError)}"]`,
    );
    element?.focus();
  }

  async function handleNext() {
    const fields = STEP_FIELDS[step] ?? [];
    if (!fields.length) {
      setStep((prev) => Math.min(maxStep, prev + 1));
      return;
    }
    const valid = await methods.trigger(fields as (keyof PlanosWizardValues)[]);
    if (!valid) {
      await focusFirstError(fields);
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Campos obrigatórios"
          description="Revise os campos destacados antes de avançar."
          onClose={() => toast.dismiss(t)}
        />
      ));
      return;
    }
    setStep((prev) => Math.min(maxStep, prev + 1));
  }

  const handleSubmit = methods.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        contaId,
        nome: values.nome.trim(),
        descricao: values.descricao === undefined ? undefined : values.descricao?.trim() || null,
        periodicidade: values.periodicidade,
        valor: values.valor,
        status: values.status ?? 'ATIVO',
      };

      let result: PlanoListItem;
      if (isEdit && plano) {
        result = await updatePlanoRequest({ id: plano.id, payload });
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Plano atualizado"
            description="As alterações foram salvas."
            onClose={() => toast.dismiss(t)}
          />
        ));
      } else {
        result = await createPlanoRequest(payload);
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Plano criado"
            description="O plano foi cadastrado com sucesso."
            onClose={() => toast.dismiss(t)}
          />
        ));
      }

      onSaved?.(result);
      onOpenChange(false);
    } catch (error) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Não foi possível salvar"
          description={(error as Error).message}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        title={isEdit ? 'Editar plano' : 'Novo plano'}
        data-testid="planos-wizard"
      >
        <DialogTitle className="text-xl font-semibold text-slate-800">
          {isEdit ? 'Editar plano' : 'Novo plano'}
        </DialogTitle>
        <FormProvider {...methods}>
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <Progress value={pct} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">
                  Etapa {step} de {maxStep}
                </span>
                {activeStep ? <span className="text-slate-500">/ {activeStep}</span> : null}
              </div>
            </div>
            <div className="min-h-[240px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {step === 1 && <StepDadosBasicos />}
                  {step === 2 && <StepFinanceiro />}
                  {step === 3 && <StepStatusResumo />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                  disabled={step === 1 || submitting}
                >
                  Voltar
                </Button>
              </div>
              {step < maxStep ? (
                <Button
                  onClick={() => void handleNext()}
                  disabled={submitting}
                  data-testid="wizard-next"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  data-testid="salvar-plano"
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              )}
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
