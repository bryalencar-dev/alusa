'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { MatriculaCreatedPayload } from '@/features/cadastro/matriculas/services/matriculas-service';
import { MatriculaWizardFlow } from './MatriculaWizardFlow';

interface MatriculaWizardDialogProps {
  open: boolean;
  contaId?: string;
  onOpenChange: (_open: boolean) => void;
  onCreated?: (_payload: MatriculaCreatedPayload) => void;
}

export default function MatriculaWizardDialog({
  open,
  contaId,
  onOpenChange,
  onCreated,
}: MatriculaWizardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-5xl overflow-hidden bg-slate-50 p-0 transition-all duration-300"
        data-testid="matricula-wizard"
      >
        <DialogTitle className="sr-only">Cadastrar matrícula</DialogTitle>
        <MatriculaWizardFlow
          contaId={contaId}
          open={open}
          variant="dialog"
          onClose={() => onOpenChange(false)}
          onCompleted={onCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
