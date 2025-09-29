"use client";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel, IMaskControlled } from "../ui";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
function toastError(msg: string) {
  try {
    // Se compilação reconhecer toast.error em runtime continuará funcionando
  // @ts-expect-error compat
    if (typeof toast.error === 'function') return toast.error(msg);
    return toast.custom(() => <div className="text-sm font-medium text-red-600">{msg}</div>);
  } catch {
    /* noop */
  }
}
import { useEffect, useRef, useState } from "react";
import type { AlunoInput } from "../../../../../../prisma/zod/aluno";

// Mantém comportamento original (busca CEP aluno)
async function lookupCep(rawCep: string) {
  const cep = rawCep.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;
    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
    };
  } catch {
    return null;
  }
}

export default function EnderecoFields() {
  const { register, watch, setValue } = useFormContext<AlunoInput>();
  const cepVal = watch("enderecoCep");
  const [loading, setLoading] = useState(false);
  const lastCepRef = useRef<string>("");
  useEffect(() => {
    const raw = (cepVal || "").replace(/\D/g, "");
    if (raw.length === 8 && raw !== lastCepRef.current) {
      lastCepRef.current = raw;
      setLoading(true);
      lookupCep(raw)
        .then((r) => {
          if (r) {
            setValue("enderecoLogradouro", r.logradouro, { shouldDirty: true });
            setValue("enderecoBairro", r.bairro, { shouldDirty: true });
            setValue("enderecoCidade", r.cidade, { shouldDirty: true });
            setValue("enderecoUf", r.uf, { shouldDirty: true });
          } else {
            toastError("CEP não encontrado");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [cepVal, setValue]);
  return (
    <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6">
      <div>
        <FieldLabel htmlFor="aluno-endereco-cep" required>CEP</FieldLabel>
  <IMaskControlled id="aluno-endereco-cep" data-testid="aluno-endereco-cep" name="enderecoCep" mask="00000-000" placeholder="00000-000" ariaLabel="CEP" />
        <FieldError name="enderecoCep" />
        {loading && <div className="mt-1 text-[10px] text-violet-600 animate-pulse">Buscando CEP...</div>}
      </div>
      <div className="md:col-span-3">
        <FieldLabel htmlFor="aluno-endereco-logradouro">Endereço</FieldLabel>
  <Input id="aluno-endereco-logradouro" data-testid="aluno-endereco-logradouro" {...register("enderecoLogradouro")} placeholder="Rua/Av., travessa..." disabled={loading} className="h-10 border-gray-300 bg-white shadow-none placeholder:text-gray-400" />
      </div>
      <div>
        <FieldLabel htmlFor="aluno-endereco-numero">Número</FieldLabel>
  <Input id="aluno-endereco-numero" data-testid="aluno-endereco-numero" {...register("enderecoNumero")} placeholder="Nº" className="h-10 border-gray-300 bg-white shadow-none placeholder:text-gray-400" />
      </div>
      <div>
        <FieldLabel htmlFor="aluno-endereco-complemento">Complemento</FieldLabel>
  <Input id="aluno-endereco-complemento" {...register("enderecoComplemento")} placeholder="Apto, bloco..." className="h-10 border-gray-300 bg-white shadow-none placeholder:text-gray-400" />
      </div>
      <div>
        <FieldLabel htmlFor="aluno-endereco-bairro">Bairro</FieldLabel>
  <Input id="aluno-endereco-bairro" data-testid="aluno-endereco-bairro" {...register("enderecoBairro")} placeholder="Ex.: Centro" className="h-10 border-gray-300 bg-white shadow-none placeholder:text-gray-400" />
      </div>
      <div className="md:col-span-3">
        <FieldLabel htmlFor="aluno-endereco-cidade">Cidade</FieldLabel>
  <Input id="aluno-endereco-cidade" data-testid="aluno-endereco-cidade" {...register("enderecoCidade")} placeholder="Ex.: Recife" className="h-10 border-gray-300 bg-white shadow-none placeholder:text-gray-400" />
      </div>
      <div>
        <FieldLabel htmlFor="aluno-endereco-uf">UF</FieldLabel>
  <Input id="aluno-endereco-uf" data-testid="aluno-endereco-uf" maxLength={2} {...register("enderecoUf")} placeholder="PE" className="h-10 border-gray-300 bg-white shadow-none placeholder:text-gray-400" />
        <FieldError name="enderecoUf" />
      </div>
      <div className="md:col-span-6">
        <FieldLabel htmlFor="aluno-observacao">Observação (geral)</FieldLabel>
        <textarea
          id="aluno-observacao"
          {...register("observacao")}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-0 focus-visible:shadow-none placeholder:text-gray-400"
          placeholder="Notas gerais sobre o aluno (opcional)"
        />
      </div>
    </div>
  );
}
