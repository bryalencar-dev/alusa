"use client";

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MatriculaCreatedPayload } from '@/features/cadastro/matriculas/services/matriculas-service';
import { useMatriculaWizard } from './wizard/hooks/useMatriculaWizard';
import { StepAluno } from './wizard/steps/StepAluno';
import { StepTurmasCombo } from './wizard/steps/StepTurmasCombo';

interface MatriculaWizardDialogProps {
  open: boolean;
  contaId?: string;
  onOpenChange: (_open: boolean) => void;
  onCreated?: (_payload: MatriculaCreatedPayload) => void; // reservado para uso futuro (submit final)
}

export default function MatriculaWizardDialog({ open, contaId, onOpenChange }: MatriculaWizardDialogProps) {
  const wizard = useMatriculaWizard(contaId);

  // Reset do estado sempre que o diálogo abre (garante limpeza ao abrir novamente)
  useEffect(() => {
    if (open) wizard.reset({ contaId: contaId ?? '' });
  }, [open, contaId, wizard]);

  const renderStep = () => {
    switch (wizard.step) {
      case 'aluno':
        return <StepAluno ctx={wizard} contaId={contaId} />;
      case 'turmasCombo':
        return <StepTurmasCombo ctx={wizard} contaId={contaId} />;
      // Passos futuros (fase 2/3): plano, financeiro, resumo
      default:
        return <div className="text-sm text-gray-500 py-10 text-center">Passo em construção (fase 2).</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-semibold text-gray-900">Nova matrícula</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">Siga os passos para concluir a matrícula.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
            <span>Passo {wizard.steps.indexOf(wizard.step) + 1} de {wizard.steps.length}</span>
            <span className="font-medium capitalize">{wizard.step}</span>
          </div>
          {renderStep()}
          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
