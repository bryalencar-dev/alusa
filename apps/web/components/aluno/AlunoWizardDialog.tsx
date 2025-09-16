"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AlunoWizard, type AlunoWizardProps } from "./AlunoWizard";

type Props = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  trigger?: React.ReactNode;
  onFinish?: () => void;
} & Pick<AlunoWizardProps, "contaId">;

export function AlunoWizardDialog({ open, onOpenChange, trigger, contaId, onFinish }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent title="Preencha os dados do aluno">
        {/* Render condicional ajuda o E2E a detectar desmontagem */}
        {open && (
          <AlunoWizard
            contaId={contaId}
            onFinish={() => {
              onFinish?.();
              onOpenChange(false); // fecha o dialog programaticamente
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AlunoWizardDialog;
