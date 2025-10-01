'use client';

import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MatriculaCreatedPayload } from '@/features/cadastro/matriculas/services/matriculas-service';
import { useMatriculaWizard } from './wizard/hooks/useMatriculaWizard';
import { StepAluno } from './wizard/steps/StepAluno';
import { StepTurmasCombo } from './wizard/steps/StepTurmasCombo';
import { StepPlano } from './wizard/steps/StepPlano';
import { StepFinanceiro } from './wizard/steps/StepFinanceiro';
import { StepResumo } from './wizard/steps/StepResumo';

interface MatriculaWizardDialogProps {
  open: boolean;
  contaId?: string;
  onOpenChange: (_open: boolean) => void;
  onCreated?: (_payload: MatriculaCreatedPayload) => void; // reservado para uso futuro (submit final)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-semibold text-gray-900">Nova matrícula</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Siga os passos para concluir a matrícula.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
            <span>
              Passo {wizard.steps.indexOf(wizard.step) + 1} de {wizard.steps.length}
            </span>
            <span className="font-medium capitalize">{wizard.step}</span>
          </div>
          {renderStep()}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
