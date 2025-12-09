'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  ClockIcon,
  QrCodeIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CheckoutData {
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
type PaymentMethod = 'pix' | 'boleto' | null;

export default function CheckoutPixBoletoPage({ params }: { params: { cobrancaId: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus>('loading');
  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

  // Buscar dados da cobrança
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/checkout/pix-boleto/${params.cobrancaId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar checkout');
        }

        const checkoutData: CheckoutData = await response.json();
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

  // Polling de status após selecionar PIX (a cada 5 segundos)
  useEffect(() => {
    if (!polling || status !== 'valid' || selectedMethod !== 'pix') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/checkout/pix-boleto/${params.cobrancaId}`);
        if (response.ok) {
          const checkoutData: CheckoutData = await response.json();
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
  }, [polling, status, selectedMethod, params.cobrancaId]);

  // Handlers
  const handleSelectPix = () => {
    setSelectedMethod('pix');
    setPolling(true);
  };

  const handleSelectBoleto = () => {
    setSelectedMethod('boleto');
  };

  const handleCopyPixCode = async () => {
    if (!data?.payment.pixQrCode?.payload) return;

    try {
      await navigator.clipboard.writeText(data.payment.pixQrCode.payload);
      alert('Código PIX copiado para área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
      alert('Não foi possível copiar o código. Tente novamente.');
    }
  };

  const handleDownloadBoleto = () => {
    if (!data?.payment.bankSlipUrl) return;
    window.open(data.payment.bankSlipUrl, '_blank');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClockIcon className="mx-auto h-12 w-12 animate-spin text-brand-accent" />
          <p className="mt-4 text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">Erro</h2>
          <p className="mt-2 text-center text-gray-600">{error}</p>
          <Button onClick={() => router.push('/')} className="mt-6 w-full">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // Paid state
  if (status === 'paid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Pagamento confirmado!
          </h2>
          <p className="mt-2 text-center text-gray-600">
            O pagamento da taxa de matrícula foi confirmado com sucesso.
          </p>
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              <strong>Aluno:</strong> {data?.matricula.aluno.nome}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Valor:</strong> R$ {data?.cobranca.valor.toFixed(2)}
            </p>
          </div>
          <Button onClick={() => router.push('/')} className="mt-6 w-full">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // Expired state
  if (status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <XCircleIcon className="mx-auto h-16 w-16 text-orange-500" />
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">Cobrança vencida</h2>
          <p className="mt-2 text-center text-gray-600">
            Esta cobrança está vencida. Entre em contato com a instituição.
          </p>
          <Button onClick={() => router.push('/')} className="mt-6 w-full">
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // Main checkout UI
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Checkout de Matrícula</h1>
            <p className="mt-2 text-gray-600">Escolha a forma de pagamento da taxa de matrícula</p>
          </div>

          {/* Info */}
          <div className="mb-8 rounded-lg bg-purple-50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Aluno</p>
                <p className="text-lg font-semibold text-gray-900">{data?.matricula.aluno.nome}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Taxa de Matrícula</p>
                <p className="text-2xl font-bold text-brand-accent">
                  R$ {data?.cobranca.valor.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  Vencimento:{' '}
                  {new Date(data?.cobranca.vencimento || '').toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Payment method selection */}
          {!selectedMethod && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Escolha a forma de pagamento</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={handleSelectPix}
                  className="flex flex-col items-center gap-4 rounded-lg border-2 border-gray-200 p-6 transition hover:border-brand-accent hover:bg-brand-accent/5"
                >
                  <QrCodeIcon className="h-12 w-12 text-brand-accent" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Pagar com PIX</p>
                    <p className="mt-1 text-sm text-gray-600">Aprovação instantânea</p>
                  </div>
                </button>

                <button
                  onClick={handleSelectBoleto}
                  className="flex flex-col items-center gap-4 rounded-lg border-2 border-gray-200 p-6 transition hover:border-brand-accent hover:bg-brand-accent/5"
                >
                  <DocumentTextIcon className="h-12 w-12 text-brand-accent" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">Pagar com Boleto</p>
                    <p className="mt-1 text-sm text-gray-600">Vencimento em 3 dias</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PIX View */}
          {selectedMethod === 'pix' && data?.payment.pixQrCode && (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedMethod(null)}
                className="text-sm text-brand-accent hover:underline"
              >
                ← Escolher outra forma de pagamento
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">Pagamento via PIX</h2>
                <p className="mt-2 text-gray-600">Escaneie o QR Code ou copie o código</p>
              </div>

              <div className="flex justify-center">
                <img
                  src={`data:image/png;base64,${data.payment.pixQrCode.encodedImage}`}
                  alt="QR Code PIX"
                  className="h-64 w-64 rounded-lg border-2 border-gray-200"
                />
              </div>

              <div className="space-y-3">
                <Button onClick={handleCopyPixCode} className="w-full" size="lg">
                  Copiar código PIX
                </Button>
                <Alert className="border-blue-200 bg-blue-50">
                  <ClockIcon className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800">
                    Aguardando confirmação do pagamento... A página será atualizada automaticamente.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Boleto View */}
          {selectedMethod === 'boleto' && (
            <div className="space-y-6">
              <button
                onClick={() => setSelectedMethod(null)}
                className="text-sm text-brand-accent hover:underline"
              >
                ← Escolher outra forma de pagamento
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">Pagamento via Boleto</h2>
                <p className="mt-2 text-gray-600">Baixe o boleto e pague em qualquer banco</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-center">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-center text-sm text-gray-600">
                  Vencimento em 3 dias úteis. Após o pagamento, a confirmação pode levar até 2 dias
                  úteis.
                </p>
              </div>

              <Button onClick={handleDownloadBoleto} className="w-full" size="lg">
                Baixar Boleto (PDF)
              </Button>

              <Alert className="border-orange-200 bg-orange-50">
                <ClockIcon className="h-5 w-5 text-orange-600" />
                <AlertDescription className="text-sm text-orange-800">
                  <strong>Atenção:</strong> O boleto pode levar até 3 dias úteis para ser compensado
                  após o pagamento.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Problemas com o pagamento?{' '}
          <a href="#" className="text-brand-accent hover:underline">
            Entre em contato conosco
          </a>
        </div>
      </div>
    </div>
  );
}
