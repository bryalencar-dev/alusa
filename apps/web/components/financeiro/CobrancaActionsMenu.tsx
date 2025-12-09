'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle, Copy, Eye, Mail } from '@/components/icons/icons';

// Ícone de três pontos verticais (alternativa ao MoreVertical)
function DotsVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
      />
    </svg>
  );
}
import { useState } from 'react';

/**
 * Tipo de dados da cobrança necessários para o menu de ações
 */
export interface CobrancaActionData {
  id: string;
  status: string;
  asaasPaymentId?: string | null;
  matriculaId: string;
  formaPagamento?: string;
  atrasado?: boolean;
  /** URL pública do boleto em PDF (retornada pela API Asaas) */
  bankSlipUrl?: string | null;
  /** URL pública da fatura/invoice (retornada pela API Asaas) */
  invoiceUrl?: string | null;
}

/**
 * Props do componente de menu de ações
 */
export interface CobrancaActionsMenuProps {
  /** Dados da cobrança */
  cobranca: CobrancaActionData;
  /** Callback para impressão/segunda via */
  onPrint?: (_cobranca: CobrancaActionData) => void;
  /** Callback para reenvio de cobrança */
  onResend?: (_cobranca: CobrancaActionData) => void;
  /** Variante do botão trigger */
  variant?: 'icon' | 'button';
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente centralizado para menu de ações de cobranças
 *
 * Segue as boas práticas:
 * - Single Responsibility: apenas renderiza o menu de ações
 * - Type Safety: tipagem forte em TypeScript
 * - Composição: usa componentes shadcn/ui
 * - Acessibilidade: aria-labels e navegação por teclado
 * - Conditional Rendering: mostra apenas ações válidas por status
 */
export function CobrancaActionsMenu({
  cobranca,
  onPrint,
  onResend,
  variant = 'icon',
  className = '',
}: CobrancaActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Helpers para determinar visibilidade de ações
  const isPago = cobranca.status === 'PAGO';
  const isPendenteOrAtrasado =
    cobranca.status === 'PENDENTE' || cobranca.atrasado || cobranca.status === 'ATRASADO';
  const hasAsaasId = !!cobranca.asaasPaymentId;
  const canPrint =
    isPendenteOrAtrasado &&
    (cobranca.formaPagamento === 'BOLETO' || cobranca.formaPagamento === 'PIX');

  // URL de pagamento (checkout Asaas)
  const pagamentoUrl = hasAsaasId
    ? `https://sandbox.asaas.com/pay/${cobranca.asaasPaymentId}`
    : null;

  // Handler para efetuar pagamento
  const handleEfetuarPagamento = () => {
    if (pagamentoUrl) {
      window.open(pagamentoUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Link de pagamento não disponível.');
    }
    setIsOpen(false);
  };

  // Handler para estornar cobrança
  const handleEstornar = () => {
    // Aqui pode chamar API ou callback
    alert('Funcionalidade de estorno em desenvolvimento.');
    setIsOpen(false);
  };

  // URL da fatura para visualização (invoiceUrl é pública, não requer login)
  // Formato Sandbox: https://sandbox.asaas.com/i/{paymentId}
  // Formato Produção: https://www.asaas.com/i/{paymentId}
  // DEBUG: Verificar qual URL está sendo gerada
  const faturaUrl =
    cobranca.invoiceUrl ||
    (hasAsaasId ? `https://sandbox.asaas.com/i/${cobranca.asaasPaymentId}` : null);

  // DEBUG: Log da URL gerada
  if (process.env.NODE_ENV === 'development' && faturaUrl) {
    console.log('[CobrancaActionsMenu] faturaUrl gerada:', faturaUrl);
    console.log('[CobrancaActionsMenu] asaasPaymentId:', cobranca.asaasPaymentId);
  }

  // URL do PDF do boleto para impressão/segunda via (bankSlipUrl é pública)
  // Formato Sandbox: https://sandbox.asaas.com/b/pdf/{paymentId}
  // Formato Produção: https://www.asaas.com/b/pdf/{paymentId}
  // NOTE: handlers para confirmar recebimento ou remover cobrança removidos —
  // eram definidos mas não estavam sendo utilizados pelo menu. Se precisar
  // reintroduzir, adicionar opção no dropdown para chamá-los.
  const boletoUrl =
    cobranca.bankSlipUrl ||
    (hasAsaasId ? `https://sandbox.asaas.com/b/pdf/${cobranca.asaasPaymentId}` : null);

  // Handlers
  const handlePrint = () => {
    if (onPrint) {
      onPrint(cobranca);
    } else if (boletoUrl) {
      window.open(boletoUrl, '_blank', 'noopener,noreferrer');
    }
    setIsOpen(false);
  };

  const handleResend = () => {
    if (onResend) {
      onResend(cobranca);
    } else {
      alert('Reenvio de cobrança em desenvolvimento');
    }
    setIsOpen(false);
  };

  const handleViewMatricula = () => {
    window.open(`/matriculas/${cobranca.matriculaId}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${className}`}
            aria-label="Menu de ações da cobrança"
          >
            <DotsVerticalIcon className="h-4 w-4" />
          </Button>
        ) : (
          <button
            className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${className}`}
            aria-label="Ações da cobrança"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Visualizar fatura: apenas se PAGO e tiver bankSlipUrl ou asaasPaymentId */}
        {isPago && faturaUrl && (
          <DropdownMenuItem asChild>
            <a
              href={faturaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer"
            >
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              <span>Visualizar fatura</span>
            </a>
          </DropdownMenuItem>
        )}

        {/* Imprimir/Segunda via: apenas se PENDENTE/ATRASADO e for BOLETO/PIX */}
        {canPrint && boletoUrl && (
          <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4 text-blue-600" />
            <span>Imprimir/Segunda via</span>
          </DropdownMenuItem>
        )}

        {/* Efetuar pagamento: apenas se PENDENTE/ATRASADO */}
        {isPendenteOrAtrasado && pagamentoUrl && (
          <DropdownMenuItem onClick={handleEfetuarPagamento} className="cursor-pointer">
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            <span>Efetuar pagamento</span>
          </DropdownMenuItem>
        )}

        {/* Reenviar cobrança: apenas se PENDENTE/ATRASADO */}
        {isPendenteOrAtrasado && (
          <DropdownMenuItem onClick={handleResend} className="cursor-pointer">
            <Mail className="mr-2 h-4 w-4 text-indigo-600" />
            <span>Reenviar cobrança</span>
          </DropdownMenuItem>
        )}

        {/* Estornar cobrança: apenas se PAGO ou PENDENTE */}
        {(isPago || cobranca.status === 'PENDENTE') && (
          <DropdownMenuItem onClick={handleEstornar} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4 text-red-600" />
            <span>Estornar cobrança</span>
          </DropdownMenuItem>
        )}

        {/* Separador antes de "Ver matrícula" (só aparece se houver ações acima) */}
        {(isPago || isPendenteOrAtrasado) && <DropdownMenuSeparator />}

        {/* Ver matrícula: sempre disponível */}
        <DropdownMenuItem onClick={handleViewMatricula} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-gray-600" />
          <span>Ver matrícula</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
