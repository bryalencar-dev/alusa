import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { WizardContextValue } from '../types';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import { CreditCardIcon } from '@heroicons/react/24/outline';

const paymentOptions: Array<{
  value: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';
  label: string;
  tone: 'green' | 'blue' | 'violet' | 'orange';
  description: string;
}> = [
  {
    value: 'DINHEIRO',
    label: 'Dinheiro',
    tone: 'green',
    description: 'Pagamento presencial no ato',
  },
  { value: 'PIX', label: 'PIX', tone: 'blue', description: 'Confirmação imediata via chave Pix' },
  {
    value: 'CARTAO',
    label: 'Cartão',
    tone: 'violet',
    description: 'Cobrança recorrente automática',
  },
  {
    value: 'BOLETO',
    label: 'Boleto',
    tone: 'orange',
    description: 'Ideal para parcelas enviadas por e-mail',
  },
];

const toneStyles: Record<(typeof paymentOptions)[number]['tone'], { card: string; pill: string }> =
  {
    green: {
      card: 'border-green-200 bg-green-50 text-green-700 hover:border-green-300',
      pill: 'bg-green-600 text-white',
    },
    blue: {
      card: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300',
      pill: 'bg-blue-600 text-white',
    },
    violet: {
      card: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300',
      pill: 'bg-violet-600 text-white',
    },
    orange: {
      card: 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300',
      pill: 'bg-orange-500 text-white',
    },
  };

interface StepFinanceiroProps {
  ctx: WizardContextValue;
}

export function StepFinanceiro({ ctx }: StepFinanceiroProps) {
  const { state, update } = ctx;
  const [localDescontoValor, setLocalDescontoValor] = useState(
    state.descontoValor?.toString() ?? '',
  );
  const [localDescontoTipo, setLocalDescontoTipo] = useState(state.descontoTipo ?? 'FIXO');
  const [dataInicio, setDataInicio] = useState(
    state.dataInicio ?? new Date().toISOString().slice(0, 10),
  );
  const [vencimento, setVencimento] = useState(state.vencimentoDia?.toString() ?? '5');

  const planoValor = state.planoValor ?? 0;
  const descontoValorNum = Number(localDescontoValor.replace(',', '.')) || 0;
  const descontoAplicado =
    localDescontoTipo === 'FIXO' ? descontoValorNum : (planoValor * descontoValorNum) / 100;
  const valorFinal = Math.max(planoValor - descontoAplicado, 0);
  const formatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    [],
  );

  useEffect(() => {
    const parsedVencimento = Number(vencimento);
    const parsedDesconto = Number(localDescontoValor.replace(',', '.')) || 0;
    update({
      dataInicio,
      vencimentoDia: Number.isFinite(parsedVencimento) ? parsedVencimento : 5,
      descontoTipo: localDescontoTipo,
      descontoValor: parsedDesconto,
    });
  }, [dataInicio, vencimento, localDescontoTipo, localDescontoValor, update]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
      {/* Wizard principal */}
      <div className="flex-1">
        <SectionCard>
          <StepHeader
            title="Financeiro"
            hint="Defina condições de cobrança, descontos e destaques do plano."
          />
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Data de início</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-10 rounded-md border-gray-300 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Dia do vencimento</label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className="h-10 rounded-md border-gray-300 text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Forma de pagamento</p>
              <div className="grid gap-3 md:grid-cols-2">
                {paymentOptions.map((option) => {
                  const active = state.formaPagamento === option.value;
                  const baseClasses =
                    'flex h-full flex-col justify-between rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-200';
                  const inactiveClasses =
                    'border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50/40';
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ formaPagamento: option.value })}
                      className={`${baseClasses} ${
                        active ? toneStyles[option.tone].card : inactiveClasses
                      }`}
                    >
                      <div>
                        <p className="text-base font-semibold">{option.label}</p>
                        <p className="mt-1 text-sm text-current/80">{option.description}</p>
                      </div>
                      {active && (
                        <span
                          className={`mt-4 inline-flex w-max items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${toneStyles[option.tone].pill}`}
                        >
                          Selecionado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Desconto</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalDescontoTipo('FIXO')}
                    className={`h-10 w-24 rounded-md border text-sm font-medium transition focus:outline-none ${
                      localDescontoTipo === 'FIXO'
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50/40'
                    }`}
                  >
                    Fixo
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalDescontoTipo('PERCENTUAL')}
                    className={`h-10 w-24 rounded-md border text-sm font-medium transition focus:outline-none ${
                      localDescontoTipo === 'PERCENTUAL'
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50/40'
                    }`}
                  >
                    %
                  </button>
                  <Input
                    className="h-10 flex-1 rounded-md border-gray-300 text-sm text-gray-900 placeholder:text-gray-400"
                    value={localDescontoValor}
                    onChange={(e) => setLocalDescontoValor(e.target.value)}
                    placeholder={localDescontoTipo === 'PERCENTUAL' ? '0%' : '0,00'}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Plano base</span>
                <span className="font-semibold text-gray-900">{formatter.format(planoValor)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-gray-600">
                <span>Desconto aplicado</span>
                <span>{formatter.format(descontoAplicado)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Mensalidade final</span>
                <span className="text-lg font-semibold text-violet-700">
                  {formatter.format(valorFinal)}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Informação sobre pagamento com cartão */}
      {state.formaPagamento === 'CARTAO' && (
        <div className="lg:w-[380px] flex flex-col">
          <SectionCard>
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCardIcon className="h-5 w-5 text-brand" />
                  <h3 className="text-base font-semibold text-gray-900">Pagamento com Cartão</h3>
                </div>
                <p className="text-sm text-gray-600">
                  O cliente receberá um link de pagamento seguro para cadastrar o cartão.
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-violet-600 p-1.5">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-900">
                        Link de pagamento gerado
                      </p>
                      <p className="mt-1 text-xs text-violet-700">
                        Após concluir a matrícula, um link seguro será enviado ao cliente para
                        cadastro do cartão de crédito ou débito.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-violet-600 p-1.5">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-900">Checkout seguro</p>
                      <p className="mt-1 text-xs text-violet-700">
                        O cliente será direcionado para um ambiente seguro e criptografado para
                        inserir os dados do cartão com proteção PCI DSS.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-full bg-violet-600 p-1.5">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-900">Cobrança recorrente</p>
                      <p className="mt-1 text-xs text-violet-700">
                        Após o cadastro, a cobrança será processada automaticamente todo dia{' '}
                        {vencimento} de cada mês.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs text-green-800">
                    <strong>Nenhum dado sensível será armazenado na plataforma.</strong> Todas as
                    informações do cartão são processadas diretamente pelo gateway de pagamento.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
