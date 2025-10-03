'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionCard, StepHeader } from '@/components/alunos/wizard/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCardIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { WizardContextValue } from '../types';

const DEFAULT_TAXA_SUGGESTION = 120;
const QUICK_VALUES = [80, 120, 150];

function formatCurrencyDisplay(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseCurrency(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface StepTaxaProps {
  ctx: WizardContextValue;
}

export function StepTaxa({ ctx }: StepTaxaProps) {
  const { state, update } = ctx;
  const [isenta, setIsenta] = useState(Boolean(state.taxaIsenta));
  const [valorTexto, setValorTexto] = useState(() => {
    if (state.taxaIsenta) return '0,00';
    const valor = state.taxaMatricula ?? DEFAULT_TAXA_SUGGESTION;
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });
  const [justificativa, setJustificativa] = useState(state.taxaJustificativa ?? '');
  const [pagarAgora, setPagarAgora] = useState(Boolean(state.pagarTaxaAgora));
  const [metodoPagamento, setMetodoPagamento] = useState<string>(state.formaPagamento || 'PIX');

  useEffect(() => {
    const valorNumerico = parseCurrency(valorTexto);
    const formaAtual = pagarAgora ? (metodoPagamento as 'PIX' | 'CARTAO' | 'BOLETO') : state.formaPagamento;
    update({
      taxaIsenta: isenta,
      taxaMatricula: isenta ? 0 : valorNumerico,
      taxaJustificativa: isenta ? justificativa.trim() || undefined : undefined,
      pagarTaxaAgora: !isenta && pagarAgora,
      gerarCobrancaTaxa: !isenta && pagarAgora,
      formaPagamento: formaAtual,
    });
  }, [isenta, valorTexto, justificativa, pagarAgora, metodoPagamento, update, state.formaPagamento]);

  useEffect(() => {
    setIsenta(Boolean(state.taxaIsenta));
    if (state.taxaIsenta) {
      setValorTexto('0,00');
      setPagarAgora(false);
    } else if (typeof state.taxaMatricula === 'number') {
      setValorTexto(
        state.taxaMatricula.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
      setPagarAgora(Boolean(state.pagarTaxaAgora));
    }
    setJustificativa(state.taxaJustificativa ?? '');
    setMetodoPagamento(state.formaPagamento || 'PIX');
  }, [state.taxaIsenta, state.taxaMatricula, state.taxaJustificativa, state.pagarTaxaAgora, state.formaPagamento]);

  const valorNumerico = useMemo(() => parseCurrency(valorTexto), [valorTexto]);
  const canContinue = isenta || valorNumerico > 0;

  return (
    <SectionCard>
      <StepHeader
        title="Taxa de matrícula"
        hint="Configure a taxa de adesão. A matrícula poderá ser concluída independentemente do pagamento."
      />
      <div className="space-y-6 text-sm text-gray-700">
        {/* Status da Taxa */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">Status da taxa</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 ${
                  !isenta
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-accent/40 hover:bg-brand-accent/5'
                }`}
                onClick={() => setIsenta(false)}
              >
                <span className="block text-sm font-semibold">Cobrar taxa</span>
                <span className="mt-1 block text-xs text-current/80">
                  Criar cobrança para pagamento.
                </span>
              </button>
              <button
                type="button"
                className={`rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 ${
                  isenta
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-400/60 hover:bg-emerald-50/50'
                }`}
                onClick={() => setIsenta(true)}
              >
                <span className="block text-sm font-semibold">Isentar taxa</span>
                <span className="mt-1 block text-xs text-current/80">
                  Libera o aluno imediatamente. Registre a justificativa.
                </span>
              </button>
            </div>
          </div>

          {/* Resumo Visual */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Resumo</p>
            <p className="mt-3 text-sm text-gray-600">
              Status: <strong>{isenta ? 'Isenta' : pagarAgora ? 'Pagamento imediato' : 'Cobrança pendente'}</strong>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Valor:{' '}
              <strong>{formatCurrencyDisplay(isenta ? 0 : valorNumerico)}</strong>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {isenta
                ? 'Aluno ficará com status ADIMPLENTE'
                : pagarAgora
                  ? 'Link de pagamento será gerado'
                  : 'Matrícula será concluída com status PENDENTE_TAXA'}
            </p>
          </div>
        </div>

        {/* Valor da Taxa */}
        {!isenta && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="taxa-valor">
                Valor da taxa (R$)
              </label>
              <Input
                id="taxa-valor"
                value={valorTexto}
                onChange={(event) => setValorTexto(event.target.value)}
                placeholder="0,00"
                className="h-11 rounded-lg border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-brand-accent focus-visible:ring-2 focus-visible:ring-brand-accent/30"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-gray-500">Sugestões rápidas:</span>
              {QUICK_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setValorTexto(
                      value.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }),
                    )
                  }
                  className="rounded-full border border-brand-accent/30 px-3 py-1 font-medium text-brand-accent transition hover:border-brand-accent hover:bg-brand-accent/10"
                >
                  {formatCurrencyDisplay(value)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Justificativa se Isenta */}
        {isenta && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="taxa-justificativa">
              Justificativa da isenção
            </label>
            <Textarea
              id="taxa-justificativa"
              value={justificativa}
              onChange={(event) => setJustificativa(event.target.value)}
              placeholder="Ex.: Bolsista integral, campanha promocional, indicação, etc."
              className="min-h-[110px] resize-none rounded-lg border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200"
            />
            <p className="text-xs text-gray-500">
              A justificativa fica registrada no log da matrícula para auditoria futura.
            </p>
          </div>
        )}

        {/* Opção de Pagar Agora */}
        {!isenta && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-violet-200 bg-violet-50/50 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="pagar-agora"
                  checked={pagarAgora}
                  onCheckedChange={(checked) => setPagarAgora(checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="pagar-agora" className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer">
                    <CreditCardIcon className="h-5 w-5 text-violet-600" />
                    Gerar link de pagamento agora
                  </Label>
                  <p className="text-xs text-gray-600">
                    Quando marcado, um checkout será criado para o responsável financeiro pagar imediatamente via PIX, cartão ou boleto.
                  </p>
                </div>
              </div>
            </div>

            {/* Métodos de Pagamento (apenas se pagar agora) */}
            {pagarAgora && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-700">Método de pagamento:</p>
                <div className="grid grid-cols-3 gap-3">
                  {['PIX', 'CARTAO', 'BOLETO'].map((metodo) => (
                    <button
                      key={metodo}
                      type="button"
                      onClick={() => setMetodoPagamento(metodo)}
                      className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                        metodoPagamento === metodo
                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {metodo === 'CARTAO' ? 'Cartão' : metodo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Avisos */}
            {pagarAgora ? (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>✓ Pagamento imediato:</strong> Um link de checkout será gerado e enviado ao responsável financeiro. 
                  A matrícula ficará com status <code className="rounded bg-blue-100 px-1 py-0.5 text-xs">PENDENTE_TAXA</code> até 
                  a confirmação do pagamento.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="warning" className="border-amber-200 bg-amber-50">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>⚠️ Taxa pendente:</strong> A matrícula será concluída normalmente, mas o aluno ficará com 
                  <span className="font-semibold"> pendência financeira</span> até a quitação. 
                  Status: <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">PENDENTE_TAXA</code>.
                  <br />
                  <span className="mt-2 block text-xs">
                    O pagamento poderá ser feito posteriormente pelo portal ou através do financeiro.
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div
          data-step-taxa-can-continue={canContinue}
          data-step-taxa-valor={valorNumerico}
          data-step-taxa-isenta={isenta}
          data-step-taxa-pagar-agora={pagarAgora}
        />
      </div>
    </SectionCard>
  );
}
