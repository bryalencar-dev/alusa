import { useMemo } from 'react';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { WizardContextValue } from '../types';

interface StepResumoProps {
  ctx: WizardContextValue;
}

export function StepResumo({ ctx }: StepResumoProps) {
  const { state } = ctx;
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

  const idade = useMemo(() => {
    if (!state.aluno?.dataNasc) return null;
    const nasc = new Date(state.aluno.dataNasc);
    if (Number.isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let age = hoje.getFullYear() - nasc.getFullYear();
    const monthDiff = hoje.getMonth() - nasc.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && hoje.getDate() < nasc.getDate())) age -= 1;
    return age;
  }, [state.aluno?.dataNasc]);

  const formatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    [],
  );

  const planoValor = state.planoValor ?? 0;
  const descontoValor = state.descontoValor ?? 0;
  const descontoAplicado =
    state.descontoTipo === 'PERCENTUAL' ? (planoValor * descontoValor) / 100 : descontoValor;
  const mensalidadeFinal = Math.max(planoValor - descontoAplicado, 0);

  const statusTaxaResumo = state.taxaIsenta
    ? 'Isenta'
    : state.gerarCobrancaTaxa
      ? 'Cobrança será gerada imediatamente'
      : 'Cobrança aguardará validação do cartão';

  return (
    <SectionCard>
      <StepHeader title="Resumo" hint="Confirme os dados antes de finalizar a matrícula." />
      <div className="space-y-6 text-sm text-gray-700">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
              {initials || 'A'}
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900">
                {state.aluno?.nome ?? 'Aluno não selecionado'}
                {idade != null && (
                  <span className="ml-2 text-sm font-medium text-gray-500">{idade} anos</span>
                )}
              </p>
              {state.aluno?.dataNasc && (
                <p className="text-xs text-gray-500">
                  Nascimento: {new Date(state.aluno.dataNasc).toLocaleDateString()}
                </p>
              )}
              {state.aluno?.responsavel && (
                <p className="text-sm text-gray-600">
                  Responsável:{' '}
                  <span className="font-medium text-gray-800">{state.aluno.responsavel.nome}</span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-600">Plano selecionado</p>
            <p className="mt-1 text-base font-semibold text-gray-900">{state.planoLabel}</p>
            <p className="mt-2 text-sm text-gray-600">
              Forma de pagamento:{' '}
              <span className="font-medium text-gray-800">{state.formaPagamento ?? '—'}</span>
            </p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {turmaId && (
                <div>
                  Turma:{' '}
                  <span className="font-medium text-gray-800">{state.turmaLabel || turmaId}</span>
                </div>
              )}
              {state.comboId && (
                <div>
                  Combo: <span className="font-medium text-gray-800">{state.comboLabel}</span>
                </div>
              )}
              <div>
                Início das aulas:{' '}
                <span className="font-medium text-gray-800">{state.dataInicio ?? '—'}</span>
              </div>
              {state.taxaMatricula != null && (
                <div>
                  Taxa de matrícula:{' '}
                  <span className="font-medium text-gray-800">
                    {formatter.format(state.taxaMatricula)}
                  </span>
                </div>
              )}
              <div>
                Situação da taxa:{' '}
                <span className="font-medium text-gray-800">{statusTaxaResumo}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Mensalidade final</p>
              <p className="text-lg font-semibold text-violet-700">
                {formatter.format(mensalidadeFinal)}
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                Desconto:
                <span className="font-medium text-gray-800">
                  {state.descontoTipo === 'PERCENTUAL'
                    ? `${descontoValor}%`
                    : formatter.format(descontoAplicado)}
                </span>
              </p>
              <p>
                Taxa matrícula:{' '}
                <span className="font-medium text-gray-800">
                  {formatter.format(state.taxaMatricula ?? 0)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Alert sobre status financeiro */}
        {!state.taxaIsenta && (
          <div className="space-y-3">
            {state.pagarTaxaAgora ? (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Pagamento imediato:</strong> A matrícula será criada com{' '}
                  <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">status: ATIVA</code> e{' '}
                  <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">
                    statusFinanceiro: PENDENTE_TAXA
                  </code>
                  . Um link de checkout será enviado ao responsável financeiro. Após a confirmação
                  do pagamento, o sistema atualizará automaticamente para{' '}
                  <code className="rounded bg-emerald-100 px-1 py-0.5 text-xs">ADIMPLENTE</code>.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning" className="border-amber-200 bg-amber-50">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Taxa pendente:</strong> A matrícula será criada normalmente com{' '}
                  <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">status: ATIVA</code>,
                  mas com{' '}
                  <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                    statusFinanceiro: PENDENTE_TAXA
                  </code>
                  . O aluno poderá frequentar as aulas enquanto a situação financeira não é
                  regularizada. O pagamento pode ser feito posteriormente através do portal do aluno
                  ou pelo financeiro.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
