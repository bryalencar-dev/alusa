'use client';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard, StepHeader } from '../../alunos/wizard/ui';
import { Button } from '@/components/ui/button';
import ModalidadeWizardDialog from '../../modalidades/ModalidadeWizardDialog';
import SalaWizardDrawer from '../../salas/SalaWizardDrawer';
import { useLookups } from './lookups-context';
interface Props {
  contaId: string;
}

interface WizardValues {
  nome: string;
  modalidadeId: string;
  salaId: string;
  capacidade: number;
  contaId: string;
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
  status: string;
  observacao: string;
}

export default function StepDadosBasicos({ contaId }: Props) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<WizardValues>();
  const { modalidades, salas, loading, reloadModalidades, reloadSalas } = useLookups();
  const isLoading = loading.any;
  const [search, setSearch] = React.useState('');
  const [creatingModalidade, setCreatingModalidade] = React.useState(false);
  const [creatingSala, setCreatingSala] = React.useState(false);
  // contaId agora vem sempre do wizard (não depender de sessão aqui para consistência)

  const modalidadeId = watch('modalidadeId');
  const salaId = watch('salaId');

  // Filtragem local das modalidades por nome
  const filteredModalidades = React.useMemo(() => {
    if (!search.trim()) return modalidades;
    const q = search.toLowerCase();
    return modalidades.filter((m) => m.nome.toLowerCase().includes(q));
  }, [modalidades, search]);

  return (
    <SectionCard>
      <StepHeader title="Dados Básicos" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Nome</label>
          <Input
            placeholder="Nome da turma"
            id="turma-nome"
            {...register('nome')}
            aria-invalid={!!errors.nome || undefined}
            aria-describedby={errors.nome ? 'err-nome' : undefined}
          />
          {errors.nome && (
            <p id="err-nome" className="text-xs text-red-600">
              {String(errors.nome.message)}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-slate-600">Modalidade</label>
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-2 py-0 text-[10px] font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50"
              onClick={() => setCreatingModalidade(true)}
            >
              + criar modalidade
            </Button>
          </div>
          <div className="relative">
            <Select value={modalidadeId} onValueChange={(v) => setValue('modalidadeId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" id="modalidadeId" />
              </SelectTrigger>
              <SelectContent className="max-h-72 p-0">
                <div className="p-2 border-b sticky top-0 bg-white">
                  <Input
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                  />
                </div>
                {isLoading && (
                  <div className="space-y-2 p-2">
                    <div className="h-3 rounded bg-slate-200 animate-pulse" />
                    <div className="h-3 rounded bg-slate-200 animate-pulse w-2/3" />
                  </div>
                )}
                {!isLoading && filteredModalidades.length === 0 && (
                  <div className="px-2 py-1 text-xs text-slate-500">Nenhuma modalidade</div>
                )}
                {!isLoading &&
                  filteredModalidades.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {errors.modalidadeId && (
            <p id="err-modalidadeId" className="text-xs text-red-600">
              Informe a modalidade
            </p>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-slate-600" id="lbl-sala">
              Sala
            </label>
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-2 py-0 text-[10px] font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50"
              onClick={() => setCreatingSala(true)}
            >
              + criar sala
            </Button>
          </div>
          <Select value={salaId} onValueChange={(v) => setValue('salaId', v)}>
            <SelectTrigger aria-labelledby="lbl-sala">
              <SelectValue placeholder="Selecione" id="salaId" />
            </SelectTrigger>
            <SelectContent>
              {isLoading && (
                <div className="space-y-2 p-2">
                  <div className="h-3 rounded bg-slate-200 animate-pulse" />
                  <div className="h-3 rounded bg-slate-200 animate-pulse w-1/2" />
                </div>
              )}
              {!isLoading && salas.length === 0 && (
                <div className="px-2 py-1 text-xs text-slate-500">Nenhuma sala</div>
              )}
              {!isLoading &&
                salas.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              <div className="border-t my-1" />
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-2 py-1 text-left text-[11px] font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                onClick={() => setCreatingSala(true)}
              >
                + Criar nova sala
              </Button>
            </SelectContent>
          </Select>
          {errors.salaId && (
            <p id="err-salaId" className="text-xs text-red-600">
              Informe a sala
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Capacidade</label>
          <Input
            type="number"
            min={1}
            id="capacidade"
            {...register('capacidade', { valueAsNumber: true })}
            aria-invalid={!!errors.capacidade || undefined}
            aria-describedby={errors.capacidade ? 'err-capacidade' : undefined}
          />
          {errors.capacidade && (
            <p id="err-capacidade" className="text-xs text-red-600">
              Capacidade inválida
            </p>
          )}
        </div>
      </div>
      <ModalidadeWizardDialog
        open={creatingModalidade}
        onOpenChange={(isOpen) => {
          setCreatingModalidade(isOpen);
          if (!isOpen) {
            setSearch('');
            reloadModalidades().catch(() => undefined);
          }
        }}
        contaId={contaId}
        onSaved={async (id) => {
          setSearch('');
          await reloadModalidades();
          setValue('modalidadeId', id, { shouldDirty: true });
        }}
      />
      <SalaWizardDrawer
        inline
        open={creatingSala}
        contaId={contaId}
        onOpenChange={(isOpen) => {
          setCreatingSala(isOpen);
          if (!isOpen) reloadSalas().catch(() => undefined);
        }}
        onSaved={async (id) => {
          await reloadSalas();
          if (id) setValue('salaId', id, { shouldDirty: true });
        }}
      />
    </SectionCard>
  );
}
