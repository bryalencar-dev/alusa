'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MatriculaCreatedPayload } from '@/features/cadastro/matriculas/services/matriculas-service';
import { useMatriculaWizard } from './wizard/hooks/useMatriculaWizard';
import { Progress } from '@/components/ui/progress';
import { StepAluno } from './wizard/steps/StepAluno';
import { StepTurmasCombo } from './wizard/steps/StepTurmasCombo';
import { StepPlano } from './wizard/steps/StepPlano';
import { StepFinanceiro } from './wizard/steps/StepFinanceiro';
import { StepResumo } from './wizard/steps/StepResumo';

interface MatriculaWizardDialogProps {
  open: boolean;
  contaId?: string;
  onOpenChange: (_open: boolean) => void;
  onCreated?: (_payload: MatriculaCreatedPayload) => void; // futuro
}

export default function MatriculaWizardDialog({
  open,
  contaId,
  onOpenChange,
}: MatriculaWizardDialogProps) {
  const wizard = useMatriculaWizard(contaId);
  const { reset } = wizard;
  const prevOpenRef = useRef<boolean>(open);
  const prevContaRef = useRef<string | undefined>(contaId);

  // Reset somente quando o modal é ABERTO (transição false->true) ou quando a conta muda enquanto aberto.
  useEffect(() => {
    const abriuAgora = open && !prevOpenRef.current;
    const contaMudouEnquantoAberto = open && prevContaRef.current !== contaId;
    if (abriuAgora || contaMudouEnquantoAberto) {
      reset({ contaId: contaId ?? '' });
    }
    prevOpenRef.current = open;
    prevContaRef.current = contaId;
  }, [open, contaId, reset]);

  const renderStep = () => {
    switch (wizard.step) {
      case 'aluno':
        return <StepAluno ctx={wizard} contaId={contaId} />;
      case 'turmasCombo':
        return <StepTurmasCombo ctx={wizard} contaId={contaId} />;
      case 'plano':
        return <StepPlano ctx={wizard} contaId={contaId} />;
      case 'financeiro':
        return <StepFinanceiro ctx={wizard} />;
      case 'resumo':
        return <StepResumo ctx={wizard} />;
      default:
        return (
          <div className="text-sm text-gray-500 py-10 text-center">
            Passo em construção (fase 2).
          </div>
        );
    }
  };

  const stepIndex = wizard.steps.indexOf(wizard.step);
  const progress = ((stepIndex + 1) / wizard.steps.length) * 100;

  // Helpers para avaliar se pode avançar de cada step (além de 'aluno').
  const canAdvanceFromAluno = () => {
    return !!(
      wizard.state.aluno &&
      (!wizard.state.aluno.dataNasc ||
        wizard.state.aluno.responsavel ||
        (() => {
          const nasc = wizard.state.aluno?.dataNasc ? new Date(wizard.state.aluno.dataNasc) : null;
          if (!nasc) return true;
          const hoje = new Date();
          const idade =
            hoje.getFullYear() -
            nasc.getFullYear() -
            (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0);
          return idade >= 18;
        })()) &&
      wizard.state.aluno.ativo !== false
    );
  };

  const readBooleanData = (attr: string) => {
    if (typeof document === 'undefined') return false;
    const el = document.querySelector(`[data-${attr}]`);
    if (!el) return false;
    const val = el.getAttribute(`data-${attr}`);
    return val === 'true';
  };

  const applyFinanceiroValuesIfNeeded = useCallback(() => {
    if (wizard.step !== 'financeiro') return;
    if (typeof document === 'undefined') return;
    const el = document.querySelector('[data-step-financeiro-values]');
    if (!el) return;
    try {
      const json = el.getAttribute('data-step-financeiro-values');
      if (!json) return;
      const parsed = JSON.parse(json) as {
        taxaMatricula?: string;
        descontoTipo?: string;
        descontoValor?: string;
        vencimentoDia?: string;
        dataInicio?: string;
      };
      wizard.update({
        taxaMatricula: parsed.taxaMatricula
          ? Number(parsed.taxaMatricula.replace(',', '.')) || 0
          : undefined,
        descontoTipo: parsed.descontoTipo as 'FIXO' | 'PERCENTUAL' | undefined,
        descontoValor: parsed.descontoValor
          ? Number(parsed.descontoValor.replace(',', '.')) || 0
          : undefined,
        vencimentoDia: parsed.vencimentoDia ? Number(parsed.vencimentoDia) || 5 : undefined,
        dataInicio: parsed.dataInicio,
      });
    } catch {
      // silencioso: se parsing falhar, apenas ignoramos e não aplicamos valores
    }
  }, [wizard]);

  const buildResumoPayload = () => {
    if (typeof document === 'undefined') return null;
    const el = document.querySelector('[data-step-resumo-payload]');
    if (!el) return null;
    try {
      const json = el.getAttribute('data-step-resumo-payload');
      if (!json) return null;
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const canAdvance = (() => {
    switch (wizard.step) {
      case 'aluno':
        return canAdvanceFromAluno();
      case 'turmasCombo':
        return readBooleanData('step-turmas-can-continue');
      case 'plano':
        return readBooleanData('step-plano-can-continue');
      case 'financeiro':
        return readBooleanData('step-financeiro-can-continue');
      case 'resumo':
        return readBooleanData('step-resumo-can-submit');
      default:
        return false;
    }
  })();

  const onNext = async () => {
    if (!canAdvance) return;
    if (wizard.step === 'financeiro') applyFinanceiroValuesIfNeeded();
    if (wizard.step === 'resumo') {
      const payload = buildResumoPayload();
      if (!payload) return;
      try {
        const r = await fetch('/api/matriculas', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error('Falha ao salvar');
        onOpenChange(false);
        wizard.reset({ contaId: contaId ?? '' });
      } catch (e) {
        // Poderia adicionar toast
        console.error(e);
      }
      return;
    }
    wizard.goNext();
  };

  const onBack = () => {
    if (wizard.step === 'aluno') return; // sem voltar inicial (opcional)
    wizard.goBack();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Cadastrar matrícula"
        className="max-w-5xl w-full overflow-hidden p-0 bg-slate-50"
        data-testid="matricula-wizard"
      >
        <div className="relative border-b border-slate-200 bg-slate-50 p-4 md:p-6">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />
          <DialogTitle className="text-xl font-semibold text-slate-900 tracking-tight">
            Cadastrar matrícula
          </DialogTitle>
          <DialogDescription asChild>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Preencha os dados da matrícula em etapas.
            </p>
          </DialogDescription>
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/50">
              <Progress
                value={progress}
                className="h-2 bg-transparent [&>div]:bg-gradient-to-r [&>div]:from-brand-accent [&>div]:to-brand-accent/70"
                aria-label="Progresso do cadastro de matrícula"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              />
            </div>
            <div className="mt-2 text-xs font-medium text-slate-600" aria-live="polite">
              Etapa {stepIndex + 1} de {wizard.steps.length}
            </div>
          </div>
        </div>
        <div className="flex max-h-[78vh] flex-col overflow-x-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-slate-50">
            <div className="mx-auto w-full max-w-5xl space-y-6">{renderStep()}</div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-4 md:p-6">
            <div className="flex items-center gap-2">
              {wizard.step !== 'aluno' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="h-10 min-w-[140px] border-slate-200 text-slate-600 bg-white hover:bg-slate-100 shadow-none"
                >
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="h-10 px-5 min-w-[160px] bg-brand-accent text-white shadow-none hover:bg-brand-accent/90"
                disabled={!canAdvance}
                onClick={onNext}
              >
                {wizard.step === 'resumo' ? 'Concluir' : 'Avançar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
