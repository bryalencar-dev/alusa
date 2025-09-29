'use client';
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { modalidadeSchema } from '@alusa/lib';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StepDadosBasicos from './steps/StepDadosBasicos';
import StepStatus from './steps/StepStatus';
import StepResumo from './steps/StepResumo';

type WizardValues = { nome: string; descricao?: string; status?: string; contaId: string };

interface Props {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  contaId: string;
  onSaved?: (_id: string) => void;
}

export default function ModalidadeWizardDialog({ open, onOpenChange, contaId, onSaved }: Props) {
  const steps = React.useMemo(
    () => [
      { id: 1, title: 'Dados Básicos' },
      { id: 2, title: 'Status' },
      { id: 3, title: 'Resumo' },
    ],
    [],
  );
  const maxStep = steps.length;
  const [step, setStep] = React.useState(1);
  const methods = useForm<WizardValues>({
    resolver: zodResolver(modalidadeSchema),
    defaultValues: { nome: '', descricao: '', status: 'ATIVO', contaId },
    mode: 'onChange',
  });
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      methods.reset({ nome: '', descricao: '', status: 'ATIVO', contaId });
    }
  }, [open, contaId, methods]);
  const pct = (step / maxStep) * 100;
  const active = steps.find((s) => s.id === step);

  async function submitAll(data: WizardValues) {
    try {
      const res = await fetch('/api/modalidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message || 'Erro ao salvar');
        return;
      }
      toast.success('Modalidade criada');
      onSaved?.(json.data.id);
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent('modalidades:changed'));
    } catch {
      toast.error('Falha de comunicação');
    }
  }

  function focusFirstError() {
    const err = methods.formState.errors;
    const keys = Object.keys(err);
    if (!keys.length) return;
    const el = document.querySelector(`[name="${keys[0]}"]`) as HTMLElement | null;
    el?.focus();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full" title="Nova modalidade">
        <DialogTitle className="text-xl font-medium">Nova modalidade</DialogTitle>
        <FormProvider {...methods}>
          <div className="flex flex-col">
            <div className="space-y-4 pt-1 pb-3">
              <div className="rounded-full bg-slate-200">
                <Progress value={pct} className="h-2" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-slate-600">
                  Etapa {step} de {maxStep}
                </span>
                {active?.title && <span className="text-slate-500">/ {active.title}</span>}
              </div>
            </div>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6 pb-4"
                >
                  {step === 1 && <StepDadosBasicos />}
                  {step === 2 && <StepStatus />}
                  {step === 3 && <StepResumo />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between border-t pt-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
              >
                Anterior
              </Button>
              {step < maxStep ? (
                <Button
                  onClick={async () => {
                    const ok = await methods.trigger(step === 1 ? ['nome'] : []);
                    if (!ok) {
                      focusFirstError();
                      toast.error('Corrija os campos');
                      return;
                    }
                    setStep((s) => Math.min(maxStep, s + 1));
                  }}
                >
                  Próxima
                </Button>
              ) : (
                <Button onClick={methods.handleSubmit(submitAll)}>Concluir</Button>
              )}
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
