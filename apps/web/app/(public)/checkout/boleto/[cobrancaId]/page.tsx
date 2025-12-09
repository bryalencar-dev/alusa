'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CheckoutBoletoData {
  cobranca: {
    id: string;
    valor: number;
    vencimento: string;
    status: string;
    descricao: string;
  };
  payment: {
    id: string;
    status: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    nossoNumero?: string;
  };
  matricula: {
    id: string;
    aluno: {
      nome: string;
    };
  };
}

type CheckoutStatus = 'loading' | 'valid' | 'paid' | 'expired' | 'error';

export default function CheckoutBoletoPage({ params }: { params: { cobrancaId: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [data, setData] = useState<CheckoutBoletoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/checkout/boleto/${params.cobrancaId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar checkout');
        }

        const checkoutData: CheckoutBoletoData = await response.json();
        setData(checkoutData);

        // Determinar status
        if (checkoutData.cobranca.status === 'PAGO') {
          setStatus('paid');
        } else if (checkoutData.payment.status === 'OVERDUE') {
          setStatus('expired');
        } else {
          setStatus('valid');
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        setStatus('error');
      }
    }

    fetchData();
  }, [params.cobrancaId]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <ClockIcon className="mx-auto h-12 w-12 animate-pulse text-brand-accent" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Carregando checkout...</h2>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Erro ao carregar</h2>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button onClick={() => router.push('/matriculas')} className="mt-6">
            Voltar para matrículas
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'paid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Pagamento confirmado!</h2>
          <p className="mt-2 text-sm text-gray-600">
            O pagamento da taxa foi confirmado com sucesso.
          </p>
          <Button onClick={() => router.push('/matriculas')} className="mt-6">
            Ir para matrículas
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-orange-200 bg-white p-8 text-center shadow-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-orange-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Boleto vencido</h2>
          <p className="mt-2 text-sm text-gray-600">
            O prazo para pagamento expirou. Entre em contato para gerar uma 2ª via.
          </p>
          <Button onClick={() => router.push('/matriculas')} className="mt-6">
            Voltar para matrículas
          </Button>
        </div>
      </div>
    );
  }

  // Status: valid
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-8 w-8 text-brand-accent" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Boleto Bancário</h1>
              <p className="mt-1 text-sm text-gray-600">Faça o pagamento até o vencimento</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Dados da cobrança */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Aluno</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {data?.matricula.aluno.nome}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Valor</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data?.cobranca.valor ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Vencimento</p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {data?.cobranca.vencimento
                    ? new Date(data.cobranca.vencimento).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
            </div>
            {data?.payment.nossoNumero && (
              <div className="mt-4">
                <p className="text-xs text-gray-600">Nosso Número</p>
                <p className="mt-1 text-sm font-mono font-medium text-gray-900">
                  {data.payment.nossoNumero}
                </p>
              </div>
            )}
          </div>

          {/* Botões de download */}
          <div className="space-y-3">
            {data?.payment.bankSlipUrl && (
              <a
                href={data.payment.bankSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent/90"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Baixar Boleto PDF
              </a>
            )}
            {data?.payment.invoiceUrl && (
              <a
                href={data.payment.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-accent bg-white px-6 py-3 text-sm font-semibold text-brand-accent transition hover:bg-brand-accent/5"
              >
                Ver fatura completa
              </a>
            )}
          </div>

          {/* Instruções */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Como pagar:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs">
                <li>Baixe o boleto em PDF</li>
                <li>Pague em qualquer banco, casa lotérica ou app bancário</li>
                <li>O pagamento pode levar até 3 dias úteis para ser confirmado</li>
              </ol>
              <p className="mt-3 text-xs font-medium">
                💡 Dica: Você também pode usar o código de barras para pagamento via internet
                banking.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6">
          <Button onClick={() => router.push('/matriculas')} variant="outline" className="w-full">
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
