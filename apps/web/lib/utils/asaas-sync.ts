/**
 * Utilitários para sincronização com Asaas
 * Baseado na documentação oficial: https://docs.asaas.com
 */

/**
 * Mapeamento de billingType do Asaas para FormaPagamento interno
 */
export const ASAAS_BILLING_TYPE_MAP = {
  // Asaas -> Interno
  BOLETO: 'BOLETO',
  PIX: 'PIX',
  CREDIT_CARD: 'CARTAO_CREDITO',
  DEBIT_CARD: 'CARTAO_DEBITO',
  UNDEFINED: 'INDEFINIDO',
  RECEIVED_IN_CASH: 'RECEBIDO_EM_DINHEIRO',
  TRANSFER: 'TRANSFERENCIA',
} as const;

/**
 * Mapeamento reverso: FormaPagamento interno -> billingType Asaas
 * Baseado em: https://docs.asaas.com/docs/payments-via-credit-card
 */
export const FORMA_PAGAMENTO_TO_ASAAS = {
  BOLETO: 'BOLETO',
  PIX: 'PIX',
  CARTAO_CREDITO: 'CREDIT_CARD',
  INDEFINIDO: 'UNDEFINED', // Pergunte ao cliente
} as const;

/**
 * Mapeamento de status do Asaas para StatusCobranca interno
 */
export const ASAAS_STATUS_MAP = {
  // Asaas -> Interno
  PENDING: 'PENDENTE', // Aguardando pagamento
  CONFIRMED: 'PROCESSANDO', // Pagamento confirmado, aguardando compensação
  RECEIVED: 'PAGO', // Pagamento recebido
  OVERDUE: 'ATRASADO', // Vencido sem pagamento
  REFUNDED: 'ESTORNADO', // Estornado totalmente
  CANCELED: 'CANCELADO', // Cancelado
  AWAITING_RISK_ANALYSIS: 'PROCESSANDO', // Aguardando análise de risco
  CHARGEBACK_REQUESTED: 'PROCESSANDO', // Chargeback solicitado
  CHARGEBACK_DISPUTE: 'PROCESSANDO', // Disputa de chargeback
  AWAITING_CHARGEBACK_REVERSAL: 'PROCESSANDO', // Aguardando reversão
  DUNNING_REQUESTED: 'ATRASADO', // Negativação solicitada
  DUNNING_RECEIVED: 'ATRASADO', // Negativação efetivada
} as const;

/**
 * Mapeamento reverso: StatusCobranca interno -> status Asaas
 */
export const STATUS_TO_ASAAS = {
  A_VENCER: 'PENDING',
  PENDENTE: 'PENDING',
  PROCESSANDO: 'CONFIRMED',
  PAGO: 'RECEIVED',
  ATRASADO: 'OVERDUE',
  CANCELADO: 'CANCELED',
  ESTORNADO: 'REFUNDED',
  ESTORNADO_PARCIAL: 'REFUNDED',
} as const;

/**
 * Mapeamento de chargeType do Asaas para TipoCobranca interno
 */
export const ASAAS_CHARGE_TYPE_MAP = {
  DETACHED: 'AVULSA', // Cobrança avulsa
  INSTALLMENT: 'PARCELADA', // Parcelado
  RECURRENT: 'RECORRENTE', // Recorrente/Assinatura
} as const;

/**
 * Mapeamento de tipo de multa/desconto do Asaas
 */
export const ASAAS_TYPE_MAP = {
  FIXED: 'VALOR_FIXO',
  PERCENTAGE: 'PERCENTUAL',
} as const;

/**
 * Valida se uma data está no formato correto (DD/MM/AAAA)
 */
export function validateDate(dateString: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateString.match(regex);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Valida mês
  if (month < 1 || month > 12) return false;

  // Valida dia
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  // Valida ano (entre 2000 e 2100)
  if (year < 2000 || year > 2100) return false;

  return true;
}

/**
 * Converte data de DD/MM/AAAA para ISO (AAAA-MM-DD)
 */
export function dateToISO(dateString: string): string | null {
  if (!validateDate(dateString)) return null;

  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Converte data ISO (AAAA-MM-DD) para DD/MM/AAAA
 */
export function isoToDate(isoString: string): string {
  const date = new Date(isoString + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calcula juros conforme padrão Asaas
 * Juros são aplicados apenas após o vencimento
 */
export function calculateInterest(
  valorBase: number,
  jurosPercentual: number,
  jurosValorFixo: number,
  vencimento: Date,
  dataAtual: Date = new Date(),
): number {
  // Juros só são aplicados após o vencimento
  if (dataAtual <= vencimento) return 0;

  // Se houver percentual, usa percentual mensal
  if (jurosPercentual > 0) {
    const diasAtraso = Math.floor(
      (dataAtual.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24),
    );
    const mesesAtraso = diasAtraso / 30;
    return (valorBase * jurosPercentual * mesesAtraso) / 100;
  }

  // Caso contrário, usa valor fixo
  return jurosValorFixo;
}

/**
 * Calcula multa conforme padrão Asaas
 * Multa é aplicada uma única vez após o vencimento
 */
export function calculateFine(
  valorBase: number,
  multaTipo: string,
  multaPercentual: number,
  multaValorFixo: number,
  vencimento: Date,
  dataAtual: Date = new Date(),
): number {
  // Multa só é aplicada após o vencimento
  if (dataAtual <= vencimento) return 0;

  if (multaTipo === 'PERCENTUAL') {
    return (valorBase * multaPercentual) / 100;
  }

  return multaValorFixo;
}

/**
 * Calcula desconto conforme padrão Asaas
 * Desconto é aplicado conforme o prazo máximo configurado
 */
export function calculateDiscount(
  valorBase: number,
  descontoTipo: string,
  descontoPercentual: number,
  descontoValorFixo: number,
  descontoPrazoMaximo: string,
  vencimento: Date,
  dataAtual: Date = new Date(),
): number {
  // Verifica se está dentro do prazo de desconto
  let prazoLimite = vencimento;

  if (descontoPrazoMaximo === 'ATE_VENCIMENTO') {
    prazoLimite = vencimento;
  } else if (descontoPrazoMaximo === 'APOS_VENCIMENTO') {
    prazoLimite = new Date(vencimento.getTime() + 1000 * 60 * 60 * 24); // 1 dia após
  } else if (descontoPrazoMaximo === 'DIAS_ANTES_VENCIMENTO') {
    prazoLimite = new Date(vencimento.getTime() - 1000 * 60 * 60 * 24 * 3); // 3 dias antes
  }

  // Desconto só se aplica antes do prazo limite
  if (dataAtual > prazoLimite) return 0;

  if (descontoTipo === 'PERCENTUAL') {
    return (valorBase * descontoPercentual) / 100;
  }

  return descontoValorFixo;
}

/**
 * Calcula valor final da cobrança conforme padrão Asaas
 */
export function calculateFinalValue(
  valorBase: number,
  juros: number,
  multa: number,
  desconto: number,
): number {
  return valorBase + juros + multa - desconto;
}

/**
 * Labels para formas de pagamento (sincronizado com Asaas)
 * Baseado em: https://docs.asaas.com/docs/payments-via-credit-card
 */
export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  BOLETO: 'Boleto bancário',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de Crédito',
  INDEFINIDO: 'Pergunte ao cliente',
};

/**
 * Labels para tipos de cobrança
 */
export const TIPO_COBRANCA_LABELS: Record<string, string> = {
  TAXA_MATRICULA: 'Taxa de Matrícula',
  MENSALIDADE: 'Mensalidade',
  EXTRA: 'Taxa Extra',
  AVULSA: 'Cobrança Avulsa',
  PARCELADA: 'Cobrança Parcelada',
  RECORRENTE: 'Cobrança Recorrente',
};
