'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, QrCodeIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CheckoutPixData {
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
    pixQrCode?: {
      encodedImage: string;
      payload: string;
      expirationDate?: string;
    };
  };
  matricula: {
    id: string;
    aluno: {
      nome: string;
    };
  };
}

type CheckoutStatus = 'loading' | 'valid' | 'paid' | 'expired' | 'error';

export default function CheckoutPixPage({ params }: { params: { cobrancaId: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [data, setData] = useState<CheckoutPixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  // Buscar dados da cobrança
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/checkout/pix/${params.cobrancaId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar checkout');
        }

        const checkoutData: CheckoutPixData = await response.json();
        setData(checkoutData);

        // Determinar status
        if (checkoutData.cobranca.status === 'PAGO') {
          setStatus('paid');
          setPolling(false);
        } else if (checkoutData.payment.status === 'OVERDUE') {
          setStatus('expired');
          setPolling(false);
        } else {
          setStatus('valid');
        }
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        setStatus('error');
        setPolling(false);
      }
    }

    fetchData();
  }, [params.cobrancaId]);

  // Polling de status (a cada 5 segundos)
  useEffect(() => {
    if (!polling || status !== 'valid') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/checkout/pix/${params.cobrancaId}`);
        if (response.ok) {
          const checkoutData: CheckoutPixData = await response.json();
          setData(checkoutData);

          if (checkoutData.cobranca.status === 'PAGO') {
            setStatus('paid');
            setPolling(false);
          }
        }
      } catch (error) {
        console.error('[Polling] Erro ao verificar status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [polling, status, params.cobrancaId]);

  // Copiar código PIX
  const handleCopyPix = () => {
    if (data?.payment.pixQrCode?.payload) {
      navigator.clipboard.writeText(data.payment.pixQrCode.payload);
      alert('Código PIX copiado!');
    }
  };

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
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Checkout expirado</h2>
          <p className="mt-2 text-sm text-gray-600">
            O prazo para pagamento expirou. Entre em contato para gerar uma nova cobrança.
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
          <h1 className="text-2xl font-bold text-gray-900">Pagamento via PIX</h1>
          <p className="mt-1 text-sm text-gray-600">
            Escaneie o QR Code ou copie o código para pagar
          </p>
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
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            {data?.payment.pixQrCode?.encodedImage ? (
              <div className="rounded-lg border-4 border-gray-200 p-4">
                <img
                  src={`data:image/png;base64,${data.payment.pixQrCode.encodedImage}`}
                  alt="QR Code PIX"
                  className="h-64 w-64"
                />
              </div>
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg border-4 border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <QrCodeIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">QR Code não disponível</p>
                  <p className="mt-1 text-xs text-gray-400">Use o código Copia e Cola abaixo</p>
                </div>
              </div>
            )}

            {/* Copia e Cola */}
            {data?.payment.pixQrCode?.payload && (
              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-gray-700">Código Copia e Cola</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={data.payment.pixQrCode.payload}
                    readOnly
                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700"
                  />
                  <Button onClick={handleCopyPix} variant="outline" size="sm">
                    Copiar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Instruções */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>Instruções:</strong>
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs">
                <li>Abra o aplicativo do seu banco</li>
                <li>Escolha a opção PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
              <p className="mt-3 text-xs">
                O status será atualizado automaticamente após a confirmação.
              </p>
            </AlertDescription>
          </Alert>

          {/* Link alternativo */}
          {data?.payment.invoiceUrl && (
            <div className="text-center">
              <a
                href={data.payment.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-accent hover:underline"
              >
                Ver fatura completa no Asaas →
              </a>
            </div>
          )}
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
