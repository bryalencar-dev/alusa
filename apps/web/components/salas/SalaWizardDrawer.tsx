'use client';
import * as React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salaSchema } from '@alusa/lib';
import toast from 'react-hot-toast';
import StepDadosBasicos from './steps/StepDadosBasicos';
import StepStatus from './steps/StepStatus';
import StepResumo from './steps/StepResumo';

interface Props {
  open: boolean;
  onOpenChange: (_: boolean) => void;
  contaId: string;
  onSaved?: (_id: string) => void;
  inline?: boolean; // variant inline para uso dentro de outro wizard (combobox create)
  title?: string;
}

interface WizardValues {
  nome: string;
  descricao?: string;
  capacidade: number;
  status?: 'ATIVO' | 'INATIVO';
  contaId: string;
}

export default function SalaWizardDrawer({
  open,
  onOpenChange,
  contaId,
  onSaved,
  inline,
  title,
}: Props) {
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
    resolver: zodResolver(salaSchema),
    defaultValues: { nome: '', descricao: '', capacidade: 1, status: 'ATIVO', contaId },
    mode: 'onChange',
  });
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      methods.reset({ nome: '', descricao: '', capacidade: 1, status: 'ATIVO', contaId });
    }
  }, [open, contaId, methods]);
  const pct = (step / maxStep) * 100;
  const active = steps.find((s) => s.id === step);

  async function submitAll(data: WizardValues) {
    try {
      const res = await fetch('/api/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          capacidade:
            typeof data.capacidade === 'string' ? Number(data.capacidade) : data.capacidade,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message || 'Erro ao salvar');
        return;
      }
      toast.success('Sala criada');
      onSaved?.(json.data.id);
      onOpenChange(false);
      window.dispatchEvent(new CustomEvent('salas:changed'));
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

  const heading = title || 'Nova sala';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={'w-full p-0 flex flex-col ' + (inline ? 'max-w-md' : 'max-w-xl')}
        title={heading}
        data-panel
      >
        <div className="p-5 border-b">
          <DialogTitle className="text-xl font-medium">{heading}</DialogTitle>
          <div className="mt-4 space-y-2">
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
        </div>
        <FormProvider {...methods}>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {step === 1 && <StepDadosBasicos />}
            {step === 2 && <StepStatus />}
            {step === 3 && <StepResumo />}
          </div>
          <div className="border-t p-4 flex items-center justify-between">
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
                  const triggers: Record<number, (keyof WizardValues)[]> = {
                    1: ['nome', 'capacidade'],
                    2: [],
                  };
                  const fields = triggers[step] || [];
                  const ok = await (fields.length ? methods.trigger(fields) : methods.trigger());
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
