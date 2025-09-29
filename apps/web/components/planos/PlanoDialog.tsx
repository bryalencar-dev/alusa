'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { planoFormSchema, type PlanoFormOutput, type PlanoPeriodicidade } from '@alusa/lib';
import {
  createPlanoRequest,
  updatePlanoRequest,
  type PlanoListItem,
  formatPlanoValorBRL,
} from '@/features/cadastro/planos/services/planos-service';
import { CustomToast } from '@/components/CustomToast';
import { toast } from 'sonner';

export interface PlanoDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  contaId: string;
  plano?: PlanoListItem | null;
  onOpenChange: (_open: boolean) => void;
  onSuccess?: (_plano: PlanoListItem) => void;
}

type FormState = {
  nome: string;
  descricao: string;
  periodicidade: PlanoPeriodicidade;
  valor: string; // string para facilitar digitação; converter ao salvar
};

const defaultState: FormState = {
  nome: '',
  descricao: '',
  periodicidade: 'MENSAL',
  valor: '',
};

export function PlanoDialog({
  open,
  mode,
  contaId,
  plano,
  onOpenChange,
  onSuccess,
}: PlanoDialogProps) {
  const [values, setValues] = useState<FormState>(defaultState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && plano) {
        setValues({
          nome: plano.nome,
          descricao: plano.descricao ?? '',
            periodicidade: plano.periodicidade,
          valor: plano.valor.toFixed(2),
        });
      } else {
        setValues(defaultState);
      }
      setErrors({});
      setSubmitting(false);
    } else {
      setValues(defaultState);
      setErrors({});
      setSubmitting(false);
    }
  }, [open, mode, plano]);

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    const parsed = planoFormSchema.safeParse({
      ...values,
      valor: values.valor,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key && typeof key === 'string') {
          next[key as keyof FormState] = issue.message;
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Converter valor para number usando replace vírgula
      const valorNumber = Number(String(values.valor).replace(',', '.'));
      const payload: PlanoFormOutput = {
        nome: values.nome.trim(),
        descricao: values.descricao.trim(),
        periodicidade: values.periodicidade,
        valor: valorNumber,
      } as PlanoFormOutput;

      let saved: PlanoListItem;
      if (mode === 'edit') {
        if (!plano) throw new Error('Plano não encontrado para edição.');
        saved = await updatePlanoRequest({
          id: plano.id,
          contaId,
          nome: payload.nome,
          descricao: payload.descricao,
          periodicidade: payload.periodicidade,
          valor: payload.valor,
        });
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Plano atualizado"
            description="As alterações foram salvas."
            onClose={() => toast.dismiss(t)}
          />
        ));
      } else {
        saved = await createPlanoRequest({
          contaId,
          nome: payload.nome,
          descricao: payload.descricao,
          periodicidade: payload.periodicidade,
          valor: payload.valor,
        });
        toast.custom((t) => (
          <CustomToast
            variant="success"
            title="Plano criado"
            description="O plano foi registrado."
            onClose={() => toast.dismiss(t)}
          />
        ));
      }
      onSuccess?.(saved);
      onOpenChange(false);
    } catch (err) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao salvar"
          description={(err as Error).message}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } finally {
      setSubmitting(false);
    }
  }

  const periodicidadeOptions: PlanoPeriodicidade[] = ['MENSAL', 'TRIMESTRAL', 'ANUAL'];

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="w-full max-w-xl overflow-hidden p-0">
        <div className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {mode === 'edit' ? 'Editar plano' : 'Novo plano'}
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-600">
            {mode === 'edit'
              ? 'Atualize os dados do plano.'
              : 'Cadastre um novo plano de cobrança.'}
          </p>
        </div>
        <div className="flex flex-col gap-6 px-6 py-6">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
            <header className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-slate-800">Dados do plano</h3>
              <p className="text-xs text-slate-500">Informe nome, valor e periodicidade.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600" htmlFor="plano-nome">
                  Nome
                </label>
                <Input
                  id="plano-nome"
                  value={values.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex.: Plano Mensal"
                  className={errors.nome && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'}
                />
                {errors.nome ? (
                  <p className="text-[11px] font-medium text-[#DC2626]">{errors.nome}</p>
                ) : null}
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600" htmlFor="plano-descricao">
                  Descrição
                </label>
                <Textarea
                  id="plano-descricao"
                  value={values.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  rows={3}
                  placeholder="Descrição breve do plano"
                />
                {errors.descricao ? (
                  <p className="text-[11px] font-medium text-[#DC2626]">{errors.descricao}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Periodicidade</label>
                <Select
                  value={values.periodicidade}
                  onValueChange={(val) => handleChange('periodicidade', val as PlanoPeriodicidade)}
                >
                  <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm data-[placeholder]:text-slate-400 focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodicidadeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {formatPeriodicidade(opt)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.periodicidade ? (
                  <p className="text-[11px] font-medium text-[#DC2626]">{errors.periodicidade}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600" htmlFor="plano-valor">
                  Valor (R$)
                </label>
                <Input
                  id="plano-valor"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={values.valor}
                  onChange={(e) => handleChange('valor', e.target.value)}
                />
                {errors.valor ? (
                  <p className="text-[11px] font-medium text-[#DC2626]">{errors.valor}</p>
                ) : null}
                {values.valor && !errors.valor ? (
                  <p className="text-[11px] text-slate-500">{formatPreviewValor(values.valor)}</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="min-w-[120px] border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="min-w-[136px] bg-brand-accent text-white shadow-none hover:bg-brand-accent/90"
          >
            {submitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Salvar plano'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatPeriodicidade(value: PlanoPeriodicidade) {
  switch (value) {
    case 'ANUAL':
      return 'Anual';
    case 'TRIMESTRAL':
      return 'Trimestral';
    default:
      return 'Mensal';
  }
}

function formatPreviewValor(raw: string) {
  const numeric = Number(raw.replace(',', '.'));
  if (!Number.isFinite(numeric)) return '';
  return `≈ ${formatPlanoValorBRL(numeric)}`;
}

export default PlanoDialog;