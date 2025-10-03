import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import AlunoWizardDialog from '@/components/alunos/AlunoWizardDialog';
import type { WizardContextValue, WizardAluno } from '../types';
import {
  alunoResponsavelSchema,
  type AlunoResponsavelFormData,
  calcularIdade,
} from '@/lib/validations/aluno-responsavel.schema';
import { maskCPF, maskPhone, unmask } from '@/lib/utils/masks';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface StepAlunoProps {
  ctx: WizardContextValue;
  contaId?: string;
}

export function StepAluno({ ctx, contaId }: StepAlunoProps) {
  const { state, update } = ctx;
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAlunoWizard, setShowAlunoWizard] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<AlunoResponsavelFormData>({
    resolver: zodResolver(alunoResponsavelSchema),
    defaultValues: {
      aluno: {
        nome: '',
        dataNasc: '',
        email: '',
        telefone: '',
        cpf: '',
        endereco: '',
      },
      responsavel: undefined,
      adicionarResponsavel: false,
    },
  });

  const alunoDataNasc = watch('aluno.dataNasc');
  const adicionarResponsavel = watch('adicionarResponsavel');

  // Calcular se é menor de idade
  const isMenorIdade = useMemo(() => {
    if (!alunoDataNasc) return false;
    try {
      const idade = calcularIdade(alunoDataNasc);
      return idade < 18;
    } catch {
      return false;
    }
  }, [alunoDataNasc]);

  // Debounce ref
  const debounceRef = useRef<number | null>(null);

  const fetchAlunos = useCallback(
    (term: string) => {
      if (!contaId) return;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        setLoading(true);
        const controller = new AbortController();
        try {
          const qp = new URLSearchParams({ contaId });
          if (term.trim()) qp.set('q', term.trim());
          const res = await fetch(`/api/alunos?${qp.toString()}`, { signal: controller.signal });
          const json = await res.json();
          const items: unknown[] = json?.items ?? [];
          setOptions(
            items.map((raw) => {
              const a = raw as Record<string, unknown>;
              return {
                value: String(a.id ?? ''),
                label: String(a.nome ?? 'Sem nome'),
                description: typeof a.cpf === 'string' ? a.cpf : undefined,
              };
            }),
          );
        } catch (e) {
          const name = (e as { name?: string } | null)?.name;
          if (name !== 'AbortError') setError('Falha ao carregar alunos');
        } finally {
          setLoading(false);
        }
      }, 250);
    },
    [contaId],
  );

  // Carrega inicial
  useEffect(() => {
    if (!showForm) {
      fetchAlunos('');
    }
  }, [fetchAlunos, showForm]);

  // Quando query muda, buscar no servidor (debounced)
  useEffect(() => {
    if (!showForm) {
      fetchAlunos(query);
    }
  }, [query, fetchAlunos, showForm]);

  const filtered = useMemo(() => options.slice(0, 25), [options]);

  const canShowDropdown = focused && query.trim().length > 0 && !showForm;

  const selectAluno = useCallback(
    async (o: Option) => {
      setFetchingDetail(true);
      try {
        const r = await fetch(`/api/alunos/${o.value}`);
        const det = await r.json();
        const aluno: WizardAluno = {
          id: o.value,
          nome: det?.nome ?? o.label,
          dataNasc: det?.dataNasc ?? det?.dataNascRaw,
          responsavel: det?.responsavel
            ? { id: det.responsavel.id, nome: det.responsavel.nome }
            : null,
          ativo: det?.status ? det.status === 'ATIVO' : true,
          cpf: typeof det?.cpf === 'string' ? det.cpf : undefined,
          foto: typeof det?.foto === 'string' ? det.foto : undefined,
        };
        update({ aluno });
        setQuery(o.label);
        setShowForm(false);
      } catch {
        update({ aluno: { id: o.value, nome: o.label } });
      } finally {
        setFetchingDetail(false);
      }
    },
    [update],
  );

  const menorIdade = useMemo(() => {
    if (!state.aluno?.dataNasc) return false;
    const nasc = new Date(state.aluno.dataNasc);
    const hoje = new Date();
    const idade =
      hoje.getFullYear() -
      nasc.getFullYear() -
      (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0);
    return idade < 18;
  }, [state.aluno]);

  // Validação de possibilidade de avançar
  const canContinue =
    !!state.aluno && (!menorIdade || !!state.aluno.responsavel) && state.aluno.ativo !== false;

  const initials = useMemo(() => {
    if (!state.aluno?.nome) return '';
    return state.aluno.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [state.aluno?.nome]);

  // Submit do formulário de cadastro
  const onSubmit = async (data: AlunoResponsavelFormData) => {
    if (!contaId) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro"
          description="Conta não identificada"
          onClose={() => toast.dismiss(t)}
        />
      ));
      return;
    }

    setSubmitting(true);
    try {
      // 1. Criar responsável se necessário
      let responsavelId: string | undefined;
      if (data.responsavel && (isMenorIdade || adicionarResponsavel)) {
        const respRes = await fetch('/api/responsaveis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data.responsavel,
            cpf: unmask(data.responsavel.cpf),
            telefone: unmask(data.responsavel.telefone || ''),
          }),
        });

        if (!respRes.ok) {
          const err = await respRes.json();
          throw new Error(err.error || 'Erro ao criar responsável');
        }

        const resp = await respRes.json();
        responsavelId = resp.id;
      }

      // 2. Criar aluno
      const alunoRes = await fetch('/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contaId,
          ...data.aluno,
          cpf: data.aluno.cpf ? unmask(data.aluno.cpf) : undefined,
          telefone: data.aluno.telefone ? unmask(data.aluno.telefone) : undefined,
          dataNasc: data.aluno.dataNasc,
        }),
      });

      if (!alunoRes.ok) {
        const err = await alunoRes.json();
        throw new Error(err.error || 'Erro ao criar aluno');
      }

      const aluno = await alunoRes.json();

      // 3. Vincular responsável ao aluno, se houver
      if (responsavelId) {
        await fetch('/api/alunos/responsavel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId: aluno.id,
            responsavelId,
            tipoVinculo: 'RESPONSAVEL',
          }),
        });
      }

      // 4. Atualizar wizard state
      const wizardAluno: WizardAluno = {
        id: aluno.id,
        nome: aluno.nome,
        dataNasc: aluno.dataNasc || aluno.dataNascRaw,
        responsavel: responsavelId ? { id: responsavelId, nome: data.responsavel!.nome } : null,
        ativo: true,
        cpf: aluno.cpf,
        foto: aluno.foto,
      };

      update({ aluno: wizardAluno });
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Sucesso"
          description="Aluno cadastrado com sucesso!"
          onClose={() => toast.dismiss(t)}
        />
      ));
      setShowForm(false);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar aluno';
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao cadastrar"
          description={message}
          onClose={() => toast.dismiss(t)}
        />
      ));
      console.error('[StepAluno]', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SectionCard>
        <StepHeader
          title="Selecione ou Cadastre o Aluno"
          hint="Busque por aluno existente ou crie um novo cadastro."
        />
        <div className="space-y-6">
          {!showForm && !state.aluno && (
            <div className="space-y-4">
              {/* Campo de busca */}
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setFocused(false);
                    }
                  }}
                  placeholder="Ex.: Maria Silva ou 123.456.789-00"
                  className="h-10 rounded-md border-gray-300 bg-white pl-11 text-sm text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                  aria-autocomplete="list"
                  aria-expanded={canShowDropdown}
                  aria-controls="aluno-suggestions"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
                {canShowDropdown && (
                  <div
                    id="aluno-suggestions"
                    role="listbox"
                    className="absolute z-40 mt-2 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                    data-testid="aluno-suggestions"
                  >
                    {filtered.length === 0 && !loading && (
                      <div className="select-none px-4 py-3 text-sm text-gray-500">
                        Nenhum aluno encontrado
                      </div>
                    )}
                    {loading && (
                      <div className="select-none px-4 py-3 text-sm text-gray-500">
                        Carregando...
                      </div>
                    )}
                    {filtered.map((o) => (
                      <button
                        key={o.value}
                        role="option"
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectAluno(o);
                          setFocused(false);
                        }}
                        className="cursor-pointer w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{o.label}</span>
                          {o.description && (
                            <span className="text-xs text-gray-500">{maskCPF(o.description)}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formulário de cadastro */}
          {showForm && !state.aluno && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados do Aluno */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Dados do Aluno</h3>

                <div>
                  <Label htmlFor="aluno-nome">Nome Completo *</Label>
                  <Input
                    id="aluno-nome"
                    {...register('aluno.nome')}
                    placeholder="Ex.: Maria Silva"
                    className="mt-1"
                  />
                  {errors.aluno?.nome && (
                    <p className="mt-1 text-xs text-red-600">{errors.aluno.nome.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="aluno-dataNasc">Data de Nascimento *</Label>
                  <Input
                    id="aluno-dataNasc"
                    {...register('aluno.dataNasc')}
                    type="date"
                    className="mt-1"
                  />
                  {errors.aluno?.dataNasc && (
                    <p className="mt-1 text-xs text-red-600">{errors.aluno.dataNasc.message}</p>
                  )}
                  {isMenorIdade && (
                    <p className="mt-1 text-xs text-amber-600 font-medium">
                      ⚠️ Menor de 18 anos — responsável obrigatório
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aluno-cpf">CPF</Label>
                    <Input
                      id="aluno-cpf"
                      {...register('aluno.cpf')}
                      placeholder="000.000.000-00"
                      onChange={(e) => {
                        const masked = maskCPF(e.target.value);
                        setValue('aluno.cpf', masked);
                      }}
                      className="mt-1"
                    />
                    {errors.aluno?.cpf && (
                      <p className="mt-1 text-xs text-red-600">{errors.aluno.cpf.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="aluno-telefone">Telefone</Label>
                    <Input
                      id="aluno-telefone"
                      {...register('aluno.telefone')}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => {
                        const masked = maskPhone(e.target.value);
                        setValue('aluno.telefone', masked);
                      }}
                      className="mt-1"
                    />
                    {errors.aluno?.telefone && (
                      <p className="mt-1 text-xs text-red-600">{errors.aluno.telefone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="aluno-email">Email</Label>
                  <Input
                    id="aluno-email"
                    {...register('aluno.email')}
                    type="email"
                    placeholder="email@exemplo.com"
                    className="mt-1"
                  />
                  {errors.aluno?.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.aluno.email.message}</p>
                  )}
                </div>
              </div>

              {/* Responsável (obrigatório se menor ou opcional via checkbox) */}
              {!isMenorIdade && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-responsavel"
                    checked={adicionarResponsavel}
                    onCheckedChange={(checked) => setValue('adicionarResponsavel', !!checked)}
                  />
                  <Label htmlFor="add-responsavel" className="text-sm cursor-pointer">
                    Adicionar responsável
                  </Label>
                </div>
              )}

              {(isMenorIdade || adicionarResponsavel) && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Dados do Responsável {isMenorIdade && <span className="text-red-600">*</span>}
                  </h3>

                  <div>
                    <Label htmlFor="resp-nome">Nome Completo *</Label>
                    <Input
                      id="resp-nome"
                      {...register('responsavel.nome')}
                      placeholder="Ex.: João Silva"
                      className="mt-1"
                    />
                    {errors.responsavel?.nome && (
                      <p className="mt-1 text-xs text-red-600">{errors.responsavel.nome.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resp-cpf">CPF *</Label>
                      <Input
                        id="resp-cpf"
                        {...register('responsavel.cpf')}
                        placeholder="000.000.000-00"
                        onChange={(e) => {
                          const masked = maskCPF(e.target.value);
                          setValue('responsavel.cpf', masked);
                        }}
                        className="mt-1"
                      />
                      {errors.responsavel?.cpf && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.responsavel.cpf.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="resp-telefone">Telefone *</Label>
                      <Input
                        id="resp-telefone"
                        {...register('responsavel.telefone')}
                        placeholder="(00) 00000-0000"
                        onChange={(e) => {
                          const masked = maskPhone(e.target.value);
                          setValue('responsavel.telefone', masked);
                        }}
                        className="mt-1"
                      />
                      {errors.responsavel?.telefone && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.responsavel.telefone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="resp-email">Email</Label>
                    <Input
                      id="resp-email"
                      {...register('responsavel.email')}
                      type="email"
                      placeholder="email@exemplo.com"
                      className="mt-1"
                    />
                    {errors.responsavel?.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.responsavel.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="resp-financeiro"
                      {...register('responsavel.financeiro')}
                      defaultChecked={true}
                    />
                    <Label htmlFor="resp-financeiro" className="text-sm cursor-pointer">
                      Responsável financeiro
                    </Label>
                  </div>
                </div>
              )}

              {errors.responsavel &&
                typeof errors.responsavel === 'object' &&
                'message' in errors.responsavel && (
                  <p className="text-xs text-red-600 font-medium">
                    {String(errors.responsavel.message)}
                  </p>
                )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Salvando...' : 'Salvar e Continuar'}
                </Button>
              </div>
            </form>
          )}

          {/* Aluno selecionado */}
          {state.aluno && (
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 relative">
              {state.aluno.foto ? (
                <img
                  src={state.aluno.foto}
                  alt={state.aluno.nome}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-[#4f2298]/30"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4f2298]/15 text-sm font-semibold text-[#4f2298]">
                  {initials || 'A'}
                </div>
              )}
              <div className="flex-1 space-y-1 text-sm text-gray-700">
                <p className="text-base font-semibold text-gray-900">{state.aluno.nome}</p>
                {state.aluno.cpf && (
                  <p className="text-xs font-medium text-gray-600 tracking-wide">
                    CPF: {maskCPF(state.aluno.cpf)}
                  </p>
                )}
                {state.aluno.responsavel && (
                  <p className="text-xs text-gray-600">
                    Responsável:{' '}
                    <span className="font-medium text-gray-800">
                      {state.aluno.responsavel.nome}
                    </span>
                  </p>
                )}
                {state.aluno.ativo === false && (
                  <p className="text-xs font-semibold text-red-600">Aluno inativo</p>
                )}
                {!state.aluno.responsavel && menorIdade && (
                  <p className="text-xs font-semibold text-red-600">
                    Necessário responsável (menor de idade)
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => update({ aluno: undefined })}
                className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-white/60"
                aria-label="Remover aluno selecionado"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          )}

          {/* Footer global controla o avanço */}
          <div
            data-step-aluno-can-continue={canContinue}
            data-step-aluno-loading={fetchingDetail || submitting}
          />
        </div>
      </SectionCard>

      {/* Botão cadastrar aluno renderizado no footer via Portal */}
      {!state.aluno &&
        typeof document !== 'undefined' &&
        document.getElementById('wizard-left-actions') &&
        createPortal(
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAlunoWizard(true)}
            className="w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Cadastrar aluno
          </Button>,
          document.getElementById('wizard-left-actions')!,
        )}

      {/* Dialog do wizard de alunos */}
      <AlunoWizardDialog
        open={showAlunoWizard}
        onOpenChange={setShowAlunoWizard}
        contaId={contaId ?? null}
        onFinish={() => {
          setShowAlunoWizard(false);
          // Recarrega a lista de alunos
          if (contaId) {
            fetchAlunos(query);
          }
        }}
      />
    </>
  );
}
