'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@alusa/ui';

interface PixData {
  cobrancaId: string;
  matriculaId: string;
  qrCode: string;
  payload: string;
  valor: number;
  vencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO';
}

export default function PagamentoPIXPage() {
  const params = useParams();
  const router = useRouter();
  const pixId = params.pixId as string;

  const [data, setData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!pixId) return;

    const fetchPixData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/pagamento-pix/${pixId}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do PIX');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPixData();

    // Polling a cada 10 segundos para verificar status
    const interval = setInterval(fetchPixData, 10000);

    return () => clearInterval(interval);
  }, [pixId]);

  const handleCopyPayload = () => {
    if (data?.payload) {
      navigator.clipboard.writeText(data.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar PIX</h1>
          <p className="text-gray-600 mb-6">{error || 'Dados do pagamento não encontrados'}</p>
          <Button onClick={() => router.back()} variant="secondary">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (data.status === 'PAGO') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
          <p className="text-gray-600 mb-6">
            O pagamento de{' '}
            <span className="font-bold text-brand-primary">{formatCurrency(data.valor)}</span> foi
            confirmado com sucesso.
          </p>
          <Button onClick={() => window.close()}>Fechar</Button>
        </div>
      </div>
    );
  }

  if (data.status === 'VENCIDO' || data.status === 'CANCELADO') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <ClockIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {data.status === 'VENCIDO' ? 'PIX Vencido' : 'PIX Cancelado'}
          </h1>
          <p className="text-gray-600 mb-6">
            Este PIX não está mais disponível. Entre em contato com a instituição para gerar um
            novo.
          </p>
          <Button onClick={() => window.close()} variant="secondary">
            Fechar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 to-brand-accent/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pagamento via PIX</h1>
          <p className="text-lg text-gray-600">
            Valor:{' '}
            <span className="font-bold text-brand-primary">{formatCurrency(data.valor)}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Vencimento: {formatDate(data.vencimento)}</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Escaneie o QR Code com o app do seu banco
          </h2>
          <div className="flex justify-center mb-6">
            <img
              src={`data:image/png;base64,${data.qrCode}`}
              alt="QR Code PIX"
              className="w-64 h-64 border-4 border-gray-200 rounded-lg"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              <strong>Aguardando pagamento...</strong>
              <br />
              Esta página será atualizada automaticamente quando o pagamento for confirmado.
            </p>
          </div>
        </div>

        {/* PIX Code */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ou copie o código PIX</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <code className="text-xs text-gray-700 break-all block">{data.payload}</code>
          </div>
          <Button
            onClick={handleCopyPayload}
            className="w-full"
            variant={copied ? 'secondary' : 'primary'}
          >
            {copied ? '✓ Código Copiado!' : 'Copiar Código PIX'}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Como pagar:</h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              <span>Abra o aplicativo do seu banco e acesse a área PIX</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              <span>Escolha pagar com QR Code e escaneie o código acima</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              <span>Ou escolha a opção &ldquo;PIX Copia e Cola&rdquo; e cole o código copiado</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              <span>Confirme os dados e finalize o pagamento</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              <span>
                <strong>Pronto!</strong> O pagamento será confirmado em alguns segundos e esta
                página será atualizada automaticamente.
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
