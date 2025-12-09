import { useMemo } from 'react';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { WizardContextValue } from '../types';

interface StepResumoProps {
  ctx: WizardContextValue;
}

export function StepResumo({ ctx }: StepResumoProps) {
  const { state, update } = ctx;
  const turmaId = state.turmaIds[0];
  const initials = useMemo(() => {
    if (!state.aluno?.nome) return '';
    return state.aluno.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [state.aluno?.nome]);

  const formatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    [],
  );

  const valorMensalidade = state.modoTurmas === 'COMBO'
    ? (state.comboValor ?? 0)
    : (state.planoValor ?? 0);

  const temMulta = Boolean(state.multaPercentual && state.multaPercentual > 0);
  const temJuros = Boolean(state.jurosMensal && state.jurosMensal > 0);
  const temDesconto = Boolean(state.descontoAntecipado && state.descontoAntecipado > 0);

  const handleConfirmacaoChange = (checked: boolean | 'indeterminate') => {
    update({ confirmacaoRevisao: checked === true });
  };

  const formaPagamentoLabel = (forma: string | undefined) => {
    if (!forma) return '—';
    const labels: Record<string, string> = {
      PIX: 'PIX',
      CARTAO: 'Cartão',
      BOLETO: 'Boleto',
      DINHEIRO: 'Dinheiro',
    };
    return labels[forma] ?? forma;
  };

  return (
    <SectionCard>
      <StepHeader title="Resumo" hint="Confirme os dados antes de finalizar a matrícula." />

      <div className="space-y-4">
        {/* Box Aluno + Plano */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Aluno */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                {initials || 'A'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {state.aluno?.nome ?? 'Aluno não selecionado'}
                </p>
                <div className="space-y-0.5 text-xs text-gray-500">
                  {state.aluno?.dataNasc && (
                    <p>Nascimento: {new Date(state.aluno.dataNasc).toLocaleDateString('pt-BR')}</p>
                  )}
                  {state.aluno?.email && <p>E-mail: {state.aluno.email}</p>}
                  {state.aluno?.telefone && <p>Telefone: {state.aluno.telefone}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Plano/Combo */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                {state.modoTurmas === 'COMBO' ? 'Combo selecionado' : 'Plano selecionado'}:{' '}
                <span className="font-semibold text-gray-900">
                  {state.modoTurmas === 'COMBO' ? state.comboLabel : state.planoLabel}
                </span>
              </p>
              <p className="text-gray-600">
                Pagamento: <span className="font-medium text-gray-900">{formaPagamentoLabel(state.formaPagamento)}</span>
              </p>
              {turmaId && (
                <p className="text-gray-600">
                  Turma: <span className="font-medium text-gray-900">{state.turmaLabel || turmaId}</span>
                </p>
              )}
              <p className="text-gray-600">
                Início: <span className="font-medium text-gray-900">{state.dataInicio ? new Date(state.dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</span>
              </p>
              {state.dataFimContrato && (
                <p className="text-gray-600">
                  Fim: <span className="font-medium text-gray-900">{new Date(state.dataFimContrato).toLocaleDateString('pt-BR')}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Box Taxa de Matrícula + Box Mensalidade */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Taxa de Matrícula */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Taxa de Matrícula</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                Valor:{' '}
                <span className="font-semibold text-gray-900">
                  {state.taxaIsenta ? 'Isenta' : formatter.format(state.taxaMatricula ?? 0)}
                </span>
              </p>
              {!state.taxaIsenta && state.formaPagamentoTaxa && (
                <p className="text-gray-600">
                  Pagamento: <span className="font-medium text-gray-900">{formaPagamentoLabel(state.formaPagamentoTaxa)}</span>
                </p>
              )}
              {state.taxaIsenta && state.taxaJustificativa && (
                <p className="text-gray-600">
                  Justificativa: <span className="font-medium text-gray-900">{state.taxaJustificativa}</span>
                </p>
              )}
            </div>
          </div>

          {/* Mensalidade */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Mensalidade</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                Valor:{' '}
                <span className="font-semibold text-gray-900">{formatter.format(valorMensalidade)}</span>
              </p>
              <p className="text-gray-600">
                Pagamento: <span className="font-medium text-gray-900">{formaPagamentoLabel(state.formaPagamento)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Box Configurações de Cobrança - só se houver */}
        {(temMulta || temJuros || temDesconto) && (
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Configurações de cobrança</h3>
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              {temMulta && (
                <p className="text-gray-600">
                  Multa: <span className="font-medium text-gray-900">{state.multaPercentual}%</span>
                </p>
              )}
              {temJuros && (
                <p className="text-gray-600">
                  Juros: <span className="font-medium text-gray-900">{state.jurosMensal}% a.m.</span>
                </p>
              )}
              {temDesconto && (
                <p className="text-gray-600">
                  Desconto:{' '}
                  <span className="font-medium text-gray-900">
                    {state.descontoTipo === 'PERCENTAGE'
                      ? `${state.descontoAntecipado}%`
                      : formatter.format(state.descontoAntecipado ?? 0)}
                    {state.prazoDesconto ? ` (${state.prazoDesconto}d)` : ''}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Checkbox de confirmação */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="confirmacao-revisao"
              checked={state.confirmacaoRevisao}
              onCheckedChange={handleConfirmacaoChange}
              className="mt-0.5"
            />
            <Label htmlFor="confirmacao-revisao" className="text-sm text-gray-700 cursor-pointer">
              Confirmo que revisei todas as informações da matrícula.
            </Label>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
