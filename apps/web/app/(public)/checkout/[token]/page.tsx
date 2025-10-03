'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface CheckoutData {
  checkoutLink: {
    id: string;
    token: string;
    expiresAt: string;
    usedAt: string | null;
    isExpired: boolean;
    isUsed: boolean;
  };
  matricula: {
    id: string;
    status: string;
    dataInicio: string | null;
    taxaMatricula: number;
    taxaStatus: string;
    taxaIsenta: boolean;
    createdAt: string;
  };
  aluno: {
    id: string;
    nome: string;
    dataNasc: string | null;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
  } | null;
  cobrancaTaxa: {
    id: string;
    valor: number;
    vencimento: string;
    status: string;
    formaPagamento: string;
  } | null;
}

type CheckoutStatus = 'loading' | 'valid' | 'expired' | 'used' | 'paid' | 'exempt' | 'error';

export default function CheckoutPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCheckoutData() {
      try {
        const response = await fetch(`/api/checkout/${params.token}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar checkout');
        }

        const checkoutData: CheckoutData = await response.json();
        setData(checkoutData);

        // Determinar status do checkout
        if (checkoutData.matricula.taxaIsenta) {
          setStatus('exempt');
        } else if (checkoutData.matricula.taxaStatus === 'PAGO') {
          setStatus('paid');
        } else if (checkoutData.checkoutLink.isUsed) {
          setStatus('used');
        } else if (checkoutData.checkoutLink.isExpired) {
          setStatus('expired');
        } else {
          setStatus('valid');
        }
      } catch (err) {
        const error = err as Error;
        console.error('[Checkout] Erro:', error);
        setError(error.message);
        setStatus('error');
      }
    }

    fetchCheckoutData();
  }, [params.token]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-accent"></div>
          <p className="mt-4 text-sm text-slate-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error' || !data) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-red-900">Link Inválido</h1>
          <p className="mt-2 text-sm text-red-700">
            {error || 'Não foi possível carregar os dados do checkout.'}
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Voltar ao início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <ClockIcon className="mx-auto h-16 w-16 text-amber-500" />
          <h1 className="mt-4 text-xl font-semibold text-amber-900">Link Expirado</h1>
          <p className="mt-2 text-sm text-amber-700">
            Este link de checkout expirou em{' '}
            {new Date(data.checkoutLink.expiresAt).toLocaleString('pt-BR')}.
          </p>
          <p className="mt-4 text-sm text-amber-600">
            Entre em contato com a secretaria da escola para solicitar um novo link de pagamento.
          </p>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Voltar ao início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already paid state
  if (status === 'paid' || status === 'exempt') {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-xl font-semibold text-green-900">
            {status === 'exempt' ? 'Taxa Isenta' : 'Pagamento Confirmado'}
          </h1>
          <p className="mt-2 text-sm text-green-700">
            {status === 'exempt'
              ? 'A taxa de matrícula foi isenta para este aluno.'
              : 'O pagamento da taxa de matrícula já foi confirmado.'}
          </p>
          <div className="mt-6 rounded-lg border border-green-300 bg-white p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Aluno:</span>
                <span className="font-medium text-slate-900">{data.aluno.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Matrícula:</span>
                <span className="font-medium text-slate-900">#{data.matricula.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  {data.matricula.status}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Voltar ao início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Valid checkout - show payment options based on method
  if (data.cobrancaTaxa?.formaPagamento === 'CARTAO') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Checkout de Matrícula</h1>
          <p className="mt-2 text-sm text-slate-600">
            Finalize o pagamento da taxa de matrícula via cartão de crédito
          </p>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {/* Student info */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-brand-accent/5 to-brand-accent/10 p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Aluno</span>
                <span className="text-lg font-semibold text-slate-900">{data.aluno.nome}</span>
              </div>
              {data.plano && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Plano</span>
                  <span className="text-sm font-medium text-slate-700">{data.plano.nome}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment amount */}
          <div className="p-6">
            <div className="rounded-lg border-2 border-brand-accent/30 bg-brand-accent/5 p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Taxa de Matrícula</p>
              <p className="mt-2 text-4xl font-bold text-brand-accent">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(data.matricula.taxaMatricula)}
              </p>
              {data.cobrancaTaxa && (
                <p className="mt-2 text-xs text-slate-500">
                  Vencimento: {new Date(data.cobrancaTaxa.vencimento).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            {/* Credit Card Form */}
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">Dados do Cartão de Crédito</h3>
                <form className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Número do cartão
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Validade</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">CVV</label>
                      <input
                        type="text"
                        placeholder="000"
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Nome no cartão
                    </label>
                    <input
                      type="text"
                      placeholder="Nome conforme impresso no cartão"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </div>
                  <Button className="w-full" disabled>
                    Finalizar Pagamento
                  </Button>
                </form>
              </div>
            </div>

            {/* Footer info */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-700">
                🔒 Seus dados estão protegidos. O pagamento é processado de forma segura através do
                gateway Asaas.
              </p>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center text-sm text-slate-600">
          <p>
            Problemas com o pagamento?{' '}
            <button className="font-medium text-brand-accent hover:underline">
              Entre em contato conosco
            </button>
          </p>
        </div>
      </div>
    );
  }

  // PIX/Boleto checkout - show existing PIX flow
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Checkout de Matrícula</h1>
        <p className="mt-2 text-sm text-slate-600">
          Finalize o pagamento da taxa de matrícula via PIX
        </p>
      </div>

      {/* Main card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        {/* Student info */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-brand-accent/5 to-brand-accent/10 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Aluno</span>
              <span className="text-lg font-semibold text-slate-900">{data.aluno.nome}</span>
            </div>
            {data.plano && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Plano</span>
                <span className="text-sm font-medium text-slate-700">{data.plano.nome}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment amount */}
        <div className="p-6">
          <div className="rounded-lg border-2 border-brand-accent/30 bg-brand-accent/5 p-6 text-center">
            <p className="text-sm font-medium text-slate-600">Taxa de Matrícula</p>
            <p className="mt-2 text-4xl font-bold text-brand-accent">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.matricula.taxaMatricula)}
            </p>
            {data.cobrancaTaxa && (
              <p className="mt-2 text-xs text-slate-500">
                Vencimento: {new Date(data.cobrancaTaxa.vencimento).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {/* Payment instructions */}
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Como pagar via PIX</h3>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
                    1
                  </span>
                  <span>Abra o aplicativo do seu banco</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
                    2
                  </span>
                  <span>Escolha a opção PIX → Pagar com QR Code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
                    3
                  </span>
                  <span>Escaneie o código abaixo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
                    4
                  </span>
                  <span>Confirme o pagamento</span>
                </li>
              </ol>
            </div>

            {/* QR Code Placeholder */}
            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-white shadow-sm">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-slate-600">QR Code PIX</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Integração com Asaas em desenvolvimento
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  O QR Code expira em:{' '}
                  <span className="font-medium">
                    {new Date(data.checkoutLink.expiresAt).toLocaleString('pt-BR')}
                  </span>
                </p>
              </div>
            </div>

            {/* PIX Copy-Paste (Future) */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-600">Ou copie o código PIX:</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="00020126580014BR.GOV.BCB.PIX... (código será gerado pela integração Asaas)"
                  className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                />
                <Button size="sm" variant="outline" disabled>
                  Copiar
                </Button>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-xs text-blue-700">
              ⚡ O pagamento é confirmado em até 2 minutos. Após a confirmação, a matrícula será
              ativada automaticamente e você receberá um e-mail de confirmação.
            </p>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="text-center text-sm text-slate-600">
        <p>
          Problemas com o pagamento?{' '}
          <button className="font-medium text-brand-accent hover:underline">
            Entre em contato conosco
          </button>
        </p>
      </div>
    </div>
  );
}
