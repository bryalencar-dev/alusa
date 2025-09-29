"use client";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldError,
  FieldLabel,
  IMaskControlled,
  DateMaskControlled,
} from "../ui";
import { Calendar } from "@/components/icons/icons";
import type { AlunoInput } from "../../../../../../prisma/zod/aluno";

export default function IdentificacaoFields() {
  const { control, register } = useFormContext<AlunoInput>();

  const baseInputClasses =
    "h-10 px-3 bg-white border border-gray-300 placeholder:text-gray-400 text-gray-900 shadow-none";

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <div className="md:col-span-2">
        <FieldLabel htmlFor="aluno-nome" required>
          Nome completo
        </FieldLabel>
        <Input
          id="aluno-nome"
          data-testid="aluno-nome"
          {...register("nome")}
          placeholder="Digite o nome completo"
          className={baseInputClasses}
        />
        <FieldError name="nome" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-nome-social">Nome social</FieldLabel>
        <Input
          id="aluno-nome-social"
          {...register("nomeSocial")}
          placeholder="Opcional"
          className={baseInputClasses}
        />
        <FieldError name="nomeSocial" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-data-nasc" required>
          Data de nascimento
        </FieldLabel>
        <DateMaskControlled
          name="dataNasc"
          id="aluno-data-nasc"
          ariaLabel="Data de nascimento"
          rightIcon={<Calendar className="h-4 w-4 text-gray-600" aria-hidden="true" />}
          inputClassName={baseInputClasses}
        />
        <FieldError name="dataNasc" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-cpf" required>
          CPF
        </FieldLabel>
        <IMaskControlled
          id="aluno-cpf"
          name="cpf"
          mask="000.000.000-00"
          placeholder="000.000.000-00"
          ariaLabel="CPF"
          inputClassName={baseInputClasses}
        />
        <FieldError name="cpf" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-email" required>
          Email
        </FieldLabel>
        <Input
          id="aluno-email"
          type="email"
          {...register("email")}
          placeholder="email@exemplo.com"
          className={baseInputClasses}
        />
        <FieldError name="email" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-telefone" required>
          Telefone
        </FieldLabel>
        <IMaskControlled
          id="aluno-telefone"
          name="telefone"
          mask={["(00) 0000-0000", "(00) 00000-0000"]}
          placeholder="(00) 00000-0000"
          ariaLabel="Telefone"
          inputClassName={baseInputClasses}
        />
        <FieldError name="telefone" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-genero">Gênero</FieldLabel>
        <Controller
          control={control}
          name="genero"
          render={({ field }) => (
            <Select
              value={field.value ?? undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="aluno-genero"
                className={baseInputClasses}
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
                <SelectItem value="NAO_BINARIO">Não-binário</SelectItem>
                <SelectItem value="OUTRO">Outro</SelectItem>
                <SelectItem value="PREFERE_NAO_INFORMAR">
                  Prefere não informar
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError name="genero" />
      </div>

      <div>
        <FieldLabel htmlFor="aluno-status">Status</FieldLabel>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              value={field.value ?? "ATIVO"}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="aluno-status"
                className={baseInputClasses}
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativo</SelectItem>
                <SelectItem value="INATIVO">Inativo</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldError name="status" />
      </div>
    </div>
  );
}
