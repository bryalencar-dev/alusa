'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCardIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface CheckoutCartaoData {
  cobranca: {
    id: string;
    valor: number;
    vencimento: string;
    descricao: string;
  };
  payment: {
    id: string;
    invoiceUrl: string;
  };
  matricula: {
    aluno: {
      nome: string;
    };
  };
}

export default function CheckoutCartaoPage({ params }: { params: { cobrancaId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CheckoutCartaoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/checkout/cartao/${params.cobrancaId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar checkout');
        }

        const checkoutData: CheckoutCartaoData = await response.json();
        setData(checkoutData);

        // Redirecionar automaticamente para Asaas após 2 segundos
        setTimeout(() => {
          if (checkoutData.payment.invoiceUrl) {
            window.location.href = checkoutData.payment.invoiceUrl;
          }
        }, 2000);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.cobrancaId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <ClockIcon className="mx-auto h-12 w-12 animate-pulse text-brand-accent" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Carregando checkout...</h2>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          <CreditCardIcon className="mx-auto h-12 w-12 text-brand-accent" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Pagamento via Cartão</h1>
          <p className="mt-2 text-sm text-gray-600">Redirecionando para a página de pagamento...</p>

          {data && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
              <p className="text-sm font-medium text-gray-700">Aluno</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {data.matricula.aluno.nome}
              </p>
              <div className="mt-4">
                <p className="text-xs text-gray-600">Valor</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(data.cobranca.valor)}
                </p>
              </div>
            </div>
          )}

          {data?.payment.invoiceUrl && (
            <a
              href={data.payment.invoiceUrl}
              className="mt-6 inline-block rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent/90"
            >
              Ir para página de pagamento →
            </a>
          )}

          <Button
            onClick={() => router.push('/matriculas')}
            variant="outline"
            className="mt-4 w-full"
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
