"use client";
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent } from '../../ui/dialog';
import { Button } from '@/components/ui/button';
import { AlunoWizard } from './AlunoWizard';

interface NovoAlunoModalProps {
  onCreated?: () => void; // callback opcional para refetch externo
  triggerLabel?: string;
}

export function NovoAlunoModal({ onCreated, triggerLabel = 'Novo Aluno' }: NovoAlunoModalProps) {
  const [open, setOpen] = useState(false);

  function handleFinish() {
    setOpen(false);
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
  </DialogTrigger>
  <DialogContent title="Preencha os dados do aluno" className="p-0">
        <AlunoWizard onFinish={handleFinish} />
      </DialogContent>
    </Dialog>
  );
}

