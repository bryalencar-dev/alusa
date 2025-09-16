"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const steps = [
  { label: "Identificação" },
  { label: "Endereço" },
  { label: "Saúde" },
  { label: "Emergência" },
  { label: "Responsável" },
];

export function AlunoWizard() {
  const [step, setStep] = useState(0);
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Novo Aluno</Button>
      </DialogTrigger>

  <DialogContent title="Preencha os dados do aluno">
        {/* Barra de progresso */}
        <div className="mb-6">
          <Progress value={progress} className="h-3 rounded-full" />
          <div className="mt-2 text-sm text-gray-600">
            Etapa {step + 1} de {steps.length} ({Math.round(progress)}%)
          </div>
        </div>

        {/* Conteúdo do step */}
        <div className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-1">
                <label htmlFor="nome" className="text-xs font-medium text-neutral-700">Nome</label>
                <Input id="nome" placeholder="Nome" />
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium text-neutral-700">Email</label>
                <Input id="email" placeholder="Email" />
              </div>
            </>
          )}
          {step === 1 && (
            <div className="space-y-1">
              <label htmlFor="endereco" className="text-xs font-medium text-neutral-700">Endereço</label>
              <Input id="endereco" placeholder="Endereço" />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-1">
              <label htmlFor="saude" className="text-xs font-medium text-neutral-700">Informações de saúde</label>
              <Input id="saude" placeholder="Informações de saúde" />
            </div>
          )}
          {step === 3 && (
            <div className="space-y-1">
              <label htmlFor="emergencia" className="text-xs font-medium text-neutral-700">Contato de emergência</label>
              <Input id="emergencia" placeholder="Contato de emergência" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-1">
              <label htmlFor="responsavel" className="text-xs font-medium text-neutral-700">Responsável</label>
              <Input id="responsavel" placeholder="Responsável" />
            </div>
          )}
        </div>

        {/* Navegação */}
        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={back} disabled={step === 0} aria-disabled={step === 0}>
            Voltar
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next}>Próximo</Button>
          ) : (
            <Button type="button">Concluir</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
