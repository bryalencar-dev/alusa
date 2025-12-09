'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTurmas } from '@/features/cadastro/turmas/hooks/use-turmas';
import { usePlanos } from '@/features/cadastro/planos/hooks/use-planos';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  FormaPagamentoValue,
  RematriculaElegivelItem,
} from '@/features/cadastro/rematriculas/services/rematriculas-service';
import {
  createRematriculaRequest,
  type CreateRematriculaInput,
} from '@/features/cadastro/rematriculas/services/rematriculas-service';
import { toast } from 'sonner';
import { CustomToast } from '@/components/CustomToast';

const HERDAR_FORMA_VALUE = 'HERDAR';

const formaPagamentoOptions: Array<{
  value: FormaPagamentoValue;
  label: string;
  helper: string;
}> = [
  {
    value: 'BOLETO',
    label: 'Boleto bancário',
    helper: 'Gera boleto compatível com carnê/recorrência Asaas',
  },
  {
    value: 'PIX',
    label: 'Pix recorrente',
    helper: 'Usa QR Code Asaas com reapresentação automática',
  },
  {
    value: 'CARTAO_CREDITO',
    label: 'Cartão de crédito',
    helper: 'Cria assinatura com tokenização segura Asaas',
  },
  {
    value: 'INDEFINIDO',
    label: 'Definir depois',
    helper: 'Mantém cobrança manual (valor aberto)',
  },
];

interface RematriculaDialogProps {
  open: boolean;
  contaId?: string;
  item: RematriculaElegivelItem | null;
  onOpenChange: (_open: boolean) => void;
  onCreated?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return dateFormatter.format(d);
}

// Classes de estilo consistentes com AlunoEditDialog
const controlClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30';
const textAreaClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30 resize-none';
const sectionClass = 'space-y-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4';
const labelClass = 'text-xs font-medium text-slate-600';

export function RematriculaDialog({
  open,
  contaId,
  item,
  onOpenChange,
  onCreated,
}: RematriculaDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  // Dados do contrato
  const [dataInicio, setDataInicio] = useState('');
  const [dataFimContrato, setDataFimContrato] = useState('');
  const [vencimentoDia, setVencimentoDia] = useState<number | ''>('');

  // Seleção de plano e turma
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [turmaId, setTurmaId] = useState<string | null>(null);

  // Forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState<string>(HERDAR_FORMA_VALUE);
  const [formaPagamentoTaxa, setFormaPagamentoTaxa] = useState<string>(HERDAR_FORMA_VALUE);

  // Taxa de matrícula
  const [taxaMatricula, setTaxaMatricula] = useState('');
  const [taxaIsenta, setTaxaIsenta] = useState(false);
  const [taxaJustificativa, setTaxaJustificativa] = useState('');
  const [gerarCobrancaTaxa, setGerarCobrancaTaxa] = useState(true);
  const [pagarTaxaAgora, setPagarTaxaAgora] = useState(false);

  // Regras de atraso
  const [multaPercentual, setMultaPercentual] = useState('');
  const [jurosMensal, setJurosMensal] = useState('');
  const [diasTolerancia, setDiasTolerancia] = useState('');

  // Desconto antecipado
  const [descontoAntecipado, setDescontoAntecipado] = useState('');
  const [prazoDesconto, setPrazoDesconto] = useState('');

  // Buscar turmas e planos disponíveis
  const { items: turmasDisponiveis, loading: turmasLoading } = useTurmas({ contaId });
  const { items: planosDisponiveis, loading: planosLoading } = usePlanos({ contaId });

  // Turmas ativas disponíveis
  const turmasFiltradas = useMemo(() => {
    return turmasDisponiveis.filter((turma) => turma.status === 'ATIVO');
  }, [turmasDisponiveis]);

  const turmaLotada = (turmaId: string | null) => {
    if (!turmaId) return false;
    const turma = turmasFiltradas.find((t) => t.id === turmaId);
    if (!turma) return false;
    return turma.vagasOcupadas >= turma.capacidade;
  };

  // Preencher valores iniciais quando item muda
  useEffect(() => {
    if (!item) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const toInput = (date: Date) => date.toISOString().substring(0, 10);
    setDataInicio(toInput(hoje));
    setDataFimContrato(toInput(new Date(item.dataFimContrato)));

    setPlanoId(item.plano?.id ?? null);
    setTurmaId(item.turma?.id ?? null);

    const financeiro = item.financeiro;
    setVencimentoDia(financeiro?.vencimentoDia ?? '');
    setFormaPagamento(financeiro?.formaPagamento ?? HERDAR_FORMA_VALUE);
    setFormaPagamentoTaxa(financeiro?.formaPagamentoTaxa ?? HERDAR_FORMA_VALUE);
    setTaxaMatricula(financeiro?.taxaMatricula != null ? String(financeiro.taxaMatricula) : '');
    setTaxaIsenta(Boolean(financeiro?.taxaIsenta));
    setTaxaJustificativa(financeiro?.taxaJustificativa ?? '');
    setGerarCobrancaTaxa(!financeiro?.taxaIsenta);
    setPagarTaxaAgora(false);
    setMultaPercentual(financeiro?.multaPercentual != null ? String(financeiro.multaPercentual) : '');
    setJurosMensal(financeiro?.jurosMensal != null ? String(financeiro.jurosMensal) : '');
    setDescontoAntecipado(
      financeiro?.descontoAntecipado != null ? String(financeiro.descontoAntecipado) : ''
    );
    setPrazoDesconto(financeiro?.prazoDesconto != null ? String(financeiro.prazoDesconto) : '');
    setDiasTolerancia(financeiro?.diasTolerancia != null ? String(financeiro.diasTolerancia) : '');
  }, [item]);

  useEffect(() => {
    if (!item) return;
    if (planoId && planoId !== item.plano?.id) {
      setTurmaId(null);
    }
  }, [planoId, item]);

  const validacaoDatas = useMemo(() => {
    if (!item || !dataInicio) return { valido: true, erro: null };

    const dataInicioDate = new Date(dataInicio);
    const dataFimContratoAtual = new Date(item.dataFimContrato);

    if (dataInicioDate < dataFimContratoAtual) {
      return {
        valido: false,
        erro: `A data de início deve ser igual ou posterior a ${formatDate(dataFimContratoAtual)}`,
      };
    }

    // dataFimContrato é obrigatória para definir endDate no Asaas
    if (!dataFimContrato) {
      return {
        valido: false,
        erro: 'A data de término do contrato é obrigatória para integração com Asaas',
      };
    }

    const dataFimContratoNovoDate = new Date(dataFimContrato);
    if (dataFimContratoNovoDate <= dataInicioDate) {
      return {
        valido: false,
        erro: 'A data de término do contrato deve ser posterior à data de início',
      };
    }

    return { valido: true, erro: null };
  }, [item, dataInicio, dataFimContrato]);

  const disabled =
    !contaId || !item || !item.podeRenovar || submitting || !validacaoDatas.valido || !planoId || !dataFimContrato;

  const descontosHerdados = useMemo(() => item?.financeiro.descontos ?? [], [item]);

  const parseDecimal = (value: string) => {
    if (!value || !value.trim()) return undefined;
    const normalized = value.replace(',', '.');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return undefined;
    return parsed;
  };

  const parseIntegerString = (value: string) => {
    if (!value || !value.trim()) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.trunc(parsed);
  };

  useEffect(() => {
    if (!taxaIsenta) return;
    setGerarCobrancaTaxa(false);
    setPagarTaxaAgora(false);
  }, [taxaIsenta]);

  useEffect(() => {
    if (gerarCobrancaTaxa) return;
    setPagarTaxaAgora(false);
  }, [gerarCobrancaTaxa]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!contaId || !item || !planoId) return;

    const payload: CreateRematriculaInput = {
      contaId,
      matriculaId: item.id,
      dataInicio: dataInicio ? new Date(dataInicio).toISOString() : new Date().toISOString(),
      dataFimContrato: dataFimContrato
        ? new Date(dataFimContrato).toISOString()
        : new Date(item.dataFimContrato).toISOString(),
      planoId: planoId !== item.plano?.id ? planoId : undefined,
      turmaId: turmaId || undefined,
    };

    if (vencimentoDia && typeof vencimentoDia === 'number') {
      payload.vencimentoDia = vencimentoDia;
    }

    if (formaPagamento !== HERDAR_FORMA_VALUE) {
      payload.formaPagamento = formaPagamento;
    }
    if (formaPagamentoTaxa !== HERDAR_FORMA_VALUE) {
      payload.formaPagamentoTaxa = formaPagamentoTaxa;
    }

    payload.taxaIsenta = taxaIsenta;

    const taxaValor = parseDecimal(taxaMatricula);
    if (taxaIsenta) {
      payload.taxaMatricula = 0;
    } else if (typeof taxaValor === 'number') {
      payload.taxaMatricula = Math.max(0, Number(taxaValor.toFixed(2)));
    }
    if (taxaJustificativa.trim()) {
      payload.taxaJustificativa = taxaJustificativa.trim();
    }

    payload.gerarCobrancaTaxa = !taxaIsenta && gerarCobrancaTaxa;
    payload.pagarTaxaAgora = !taxaIsenta && pagarTaxaAgora;

    const multaValor = parseDecimal(multaPercentual);
    if (typeof multaValor === 'number') {
      payload.multaPercentual = Math.min(10, Math.max(0, Number(multaValor.toFixed(2))));
    }

    const jurosValor = parseDecimal(jurosMensal);
    if (typeof jurosValor === 'number') {
      payload.jurosMensal = Math.min(5, Math.max(0, Number(jurosValor.toFixed(2))));
    }

    const descontoValor = parseDecimal(descontoAntecipado);
    if (typeof descontoValor === 'number') {
      payload.descontoAntecipado = Math.min(100, Math.max(0, Number(descontoValor.toFixed(2))));
    }

    const prazoValor = parseIntegerString(prazoDesconto);
    if (typeof prazoValor === 'number') {
      payload.prazoDesconto = Math.min(30, Math.max(0, prazoValor));
    }

    const toleranciaValor = parseIntegerString(diasTolerancia);
    if (typeof toleranciaValor === 'number') {
      payload.diasTolerancia = Math.min(30, Math.max(0, toleranciaValor));
    }

    if (descontosHerdados.length) {
      payload.descontos = descontosHerdados.map((desconto) => ({ id: desconto.id }));
    }

    try {
      setSubmitting(true);
      await createRematriculaRequest(payload);
      toast.custom((t) => (
        <CustomToast
          variant="success"
          title="Rematrícula criada"
          description="A nova matrícula foi criada com sucesso. A assinatura no Asaas será sincronizada automaticamente."
          onClose={() => toast.dismiss(t)}
        />
      ));
      onCreated?.();
      onOpenChange(false);
    } catch (error) {
      toast.custom((t) => (
        <CustomToast
          variant="error"
          title="Erro ao rematricular"
          description={(error as Error).message || 'Não foi possível concluir a rematrícula.'}
          onClose={() => toast.dismiss(t)}
        />
      ));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="rematricula-dialog"
        className="w-[95vw] max-w-5xl gap-0 overflow-hidden p-0"
        aria-describedby="rematricula-description"
      >
        {item && (
          <form onSubmit={handleSubmit} className="flex h-full max-h-[85vh] flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 px-8 py-6">
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Rematricular aluno
              </DialogTitle>
              <p id="rematricula-description" className="mt-2 text-sm text-slate-600">
                Configure o novo período e as condições de pagamento para a rematrícula.
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6 overflow-y-auto px-8 py-6">
              {/* Dados do Aluno (Read-only) */}
              <div className={sectionClass}>
                <span className="text-sm font-semibold text-slate-700">Dados do aluno</span>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className={labelClass}>Nome</label>
                    <Input
                      value={item.aluno.nome || ''}
                      disabled
                      className="h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>CPF</label>
                    <Input
                      value={formatCpf(item.aluno.cpf)}
                      disabled
                      className="h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Contrato anterior</label>
                    <Input
                      value={`${formatDate(item.dataInicio)} — ${formatDate(item.dataFimContrato)}`}
                      disabled
                      className="h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Plano e Turma */}
              <div className={sectionClass}>
                <span className="text-sm font-semibold text-slate-700">Plano e turma</span>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Plano *</label>
                    <Select
                      value={planoId ?? 'null'}
                      onValueChange={(v) => setPlanoId(v === 'null' ? null : v)}
                      disabled={planosLoading}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {planosDisponiveis
                          .filter((plano) => plano.status === 'ATIVO')
                          .map((plano) => (
                            <SelectItem key={plano.id} value={plano.id}>
                              {plano.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      O plano determina o valor da mensalidade e a modalidade.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Turma</label>
                    <Select
                      value={turmaId ?? 'null'}
                      onValueChange={(v) => setTurmaId(v === 'null' ? null : v)}
                      disabled={turmasLoading}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30">
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Sem turma definida</SelectItem>
                        {turmasFiltradas.map((turma) => {
                          const lotada = turma.vagasOcupadas >= turma.capacidade;
                          const vagasRestantes = Math.max(
                            0,
                            turma.capacidade - turma.vagasOcupadas,
                          );
                          return (
                            <SelectItem key={turma.id} value={turma.id} disabled={lotada}>
                              {turma.nome} — {turma.diasSemana?.join(', ') || 'Horário flexível'} ·{' '}
                              {turma.vagasOcupadas}/{turma.capacidade} vagas
                              {lotada ? ' (lotada)' : vagasRestantes === 1 ? ' (1 vaga)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {turmaLotada(turmaId) && (
                      <p className="text-xs text-red-600">Esta turma está sem vagas disponíveis.</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Selecione uma turma ativa disponível.
                    </p>
                  </div>
                </div>
              </div>

              {/* Período do Contrato */}
              <div className={sectionClass}>
                <span className="text-sm font-semibold text-slate-700">Período do contrato</span>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Data de início *</label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className={`h-10 rounded-lg border px-3 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 ${
                        !validacaoDatas.valido
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-slate-200 bg-white focus:border-[#A94DFF] focus:ring-[#A94DFF]/30'
                      }`}
                    />
                    <p className="text-xs text-slate-500">
                      Padrão: hoje. Não pode ser anterior ao fim do contrato atual.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>
                      Término do contrato <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={dataFimContrato}
                      onChange={(e) => setDataFimContrato(e.target.value)}
                      required
                      className={`${controlClass} ${!dataFimContrato ? 'border-amber-300' : ''}`}
                    />
                    <p className="text-xs text-slate-500">
                      Obrigatório. Define quando a assinatura no Asaas expirará.
                    </p>
                  </div>
                </div>
                {!validacaoDatas.valido && validacaoDatas.erro && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">⚠️</span> {validacaoDatas.erro}
                    </p>
                  </div>
                )}
              </div>

              {/* Condições de Pagamento */}
              <div className={sectionClass}>
                <span className="text-sm font-semibold text-slate-700">Condições de pagamento</span>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className={labelClass}>Forma de pagamento</label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={HERDAR_FORMA_VALUE}>Manter atual</SelectItem>
                        {formaPagamentoOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      {formaPagamento === HERDAR_FORMA_VALUE
                        ? 'Usará a forma configurada na matrícula atual.'
                        : formaPagamentoOptions.find((o) => o.value === formaPagamento)?.helper}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Dia de vencimento</label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={vencimentoDia === '' ? '' : String(vencimentoDia)}
                      onChange={(e) => {
                        const parsed = Number(e.target.value);
                        if (!Number.isFinite(parsed)) {
                          setVencimentoDia('');
                          return;
                        }
                        setVencimentoDia(Math.min(28, Math.max(1, parsed)));
                      }}
                      placeholder="1–28"
                      className={controlClass}
                    />
                    <p className="text-xs text-slate-500">Entre 1 e 28 (limite Asaas).</p>
                  </div>
                </div>
                {descontosHerdados.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600">
                    <span className="font-medium">
                      {descontosHerdados.length} desconto(s) serão herdados:
                    </span>
                    {descontosHerdados.map((d) => (
                      <span
                        key={d.id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700"
                      >
                        {d.nome}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Taxa de Matrícula */}
              <div className={sectionClass}>
                <span className="text-sm font-semibold text-slate-700">Taxa de matrícula</span>
                <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <Checkbox
                    id="taxa-isenta"
                    checked={taxaIsenta}
                    onCheckedChange={(checked) => setTaxaIsenta(Boolean(checked))}
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="taxa-isenta" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Isentar taxa nesta rematrícula
                    </label>
                    <p className="text-xs text-slate-500">
                      Nenhuma cobrança será enviada ao responsável.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Valor (R$)</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={taxaMatricula}
                      onChange={(e) => setTaxaMatricula(e.target.value)}
                      disabled={taxaIsenta}
                      placeholder="0,00"
                      className={`${controlClass} disabled:bg-slate-100 disabled:opacity-60`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Forma de pagamento da taxa</label>
                    <Select
                      value={formaPagamentoTaxa}
                      onValueChange={setFormaPagamentoTaxa}
                      disabled={taxaIsenta}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm focus:border-[#A94DFF] focus:outline-none focus:ring-2 focus:ring-[#A94DFF]/30 disabled:bg-slate-100 disabled:opacity-60">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={HERDAR_FORMA_VALUE}>Manter atual</SelectItem>
                        {formaPagamentoOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Justificativa (opcional)</label>
                  <textarea
                    value={taxaJustificativa}
                    onChange={(e) => setTaxaJustificativa(e.target.value)}
                    placeholder="Motivo da isenção ou observação..."
                    rows={2}
                    className={textAreaClass}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <Checkbox
                      id="gerar-cobranca-taxa"
                      checked={!taxaIsenta && gerarCobrancaTaxa}
                      onCheckedChange={(checked) => setGerarCobrancaTaxa(Boolean(checked))}
                      disabled={taxaIsenta}
                    />
                    <div>
                      <label
                        htmlFor="gerar-cobranca-taxa"
                        className="text-sm font-medium text-slate-700 cursor-pointer"
                      >
                        Gerar cobrança automaticamente
                      </label>
                      <p className="text-xs text-slate-500">Cria cobrança da taxa no Asaas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <Checkbox
                      id="pagar-taxa-agora"
                      checked={!taxaIsenta && pagarTaxaAgora}
                      onCheckedChange={(checked) => setPagarTaxaAgora(Boolean(checked))}
                      disabled={taxaIsenta || !gerarCobrancaTaxa}
                    />
                    <div>
                      <label
                        htmlFor="pagar-taxa-agora"
                        className="text-sm font-medium text-slate-700 cursor-pointer"
                      >
                        Abrir checkout imediatamente
                      </label>
                      <p className="text-xs text-slate-500">Redireciona para pagamento.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regras Financeiras (Asaas) */}
              <div className={sectionClass}>
                <span className="text-sm font-semibold text-slate-700">Regras financeiras (Asaas)</span>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className={labelClass}>Multa por atraso (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={multaPercentual}
                      onChange={(e) => setMultaPercentual(e.target.value)}
                      placeholder="0–10"
                      className={controlClass}
                    />
                    <p className="text-xs text-slate-500">fine.value no Asaas (máx 10%).</p>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Juros mensais (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={jurosMensal}
                      onChange={(e) => setJurosMensal(e.target.value)}
                      placeholder="0–5"
                      className={controlClass}
                    />
                    <p className="text-xs text-slate-500">interest.value no Asaas (máx 5%).</p>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Dias de tolerância</label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={diasTolerancia}
                      onChange={(e) => setDiasTolerancia(e.target.value)}
                      placeholder="0–30"
                      className={controlClass}
                    />
                    <p className="text-xs text-slate-500">Antes de aplicar multa/juros.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className={labelClass}>Desconto antecipado (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={descontoAntecipado}
                      onChange={(e) => setDescontoAntecipado(e.target.value)}
                      placeholder="0–100"
                      className={controlClass}
                    />
                    <p className="text-xs text-slate-500">discount.value no Asaas.</p>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Dias antes do vencimento</label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={prazoDesconto}
                      onChange={(e) => setPrazoDesconto(e.target.value)}
                      placeholder="0–30"
                      className={controlClass}
                    />
                    <p className="text-xs text-slate-500">discount.dueDateLimitDays.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-8 py-4">
              <Button
                type="button"
                variant="outline"
                className="min-w-[140px] border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={disabled}
                className="min-w-[160px] bg-brand-accent text-white shadow-none hover:bg-brand-accent/90"
              >
                {submitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
