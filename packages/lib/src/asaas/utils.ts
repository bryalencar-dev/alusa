/**
 * Utilitários auxiliares para integração Asaas
 *
 * @module asaas/utils
 *
 * Funções auxiliares reutilizáveis para:
 * - Mapeamento de status
 * - Formatação de dados
 * - Validações
 * - Helpers diversos
 */

import type { PaymentStatus, SubscriptionStatus } from './types';

// ============================================================================
// STATUS MAPPING
// ============================================================================

/**
 * Mapeia status de pagamento do Asaas para status interno da aplicação
 *
 * @example
 * ```ts
 * mapPaymentStatus('RECEIVED'); // 'PAGO'
 * mapPaymentStatus('OVERDUE'); // 'ATRASADO'
 * ```
 */
export function mapPaymentStatus(asaasStatus: PaymentStatus | string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'PENDENTE',
    RECEIVED: 'PAGO',
    CONFIRMED: 'PAGO',
    OVERDUE: 'ATRASADO',
    REFUNDED: 'ESTORNADO',
    RECEIVED_IN_CASH: 'PAGO',
    DELETED: 'CANCELADO',
    AWAITING_RISK_ANALYSIS: 'EM_ANALISE',
    CHARGEBACK_REQUESTED: 'CONTESTADO',
    CHARGEBACK_DISPUTE: 'EM_DISPUTA',
    AWAITING_CHARGEBACK_REVERSAL: 'AGUARDANDO_REVERSAO',
    DUNNING_REQUESTED: 'NEGATIVACAO_SOLICITADA',
    DUNNING_RECEIVED: 'NEGATIVADO',
  };

  return statusMap[asaasStatus] ?? 'DESCONHECIDO';
}

/**
 * Mapeia status de subscription do Asaas para status interno
 */
export function mapSubscriptionStatus(asaasStatus: SubscriptionStatus | string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: 'ATIVA',
    INACTIVE: 'INATIVA',
    EXPIRED: 'EXPIRADA',
    OVERDUE: 'EM_ATRASO',
    DELETED: 'CANCELADA',
  };

  return statusMap[asaasStatus] ?? 'DESCONHECIDA';
}

/**
 * Verifica se um status de pagamento indica que foi pago
 */
export function isPaymentPaid(status: PaymentStatus | string): boolean {
  return ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(status);
}

/**
 * Verifica se um status de pagamento está pendente
 */
export function isPaymentPending(status: PaymentStatus | string): boolean {
  return ['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(status);
}

/**
 * Verifica se um status de subscription está ativa
 */
export function isSubscriptionActive(status: SubscriptionStatus | string): boolean {
  return status === 'ACTIVE';
}

// ============================================================================
// DATA FORMATTING
// ============================================================================

/**
 * Formata CPF/CNPJ removendo caracteres especiais
 */
export function sanitizeCpfCnpj(cpfCnpj: string): string {
  return cpfCnpj.replace(/[^\d]/g, '');
}

/**
 * Formata telefone removendo caracteres especiais
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * Formata CEP removendo caracteres especiais
 */
export function sanitizeCep(cep: string): string {
  return cep.replace(/[^\d]/g, '');
}

/**
 * Formata valor monetário para o formato esperado pelo Asaas (decimal com 2 casas)
 */
export function formatCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Formata data para o formato esperado pelo Asaas (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtém a data atual no timezone de Brasília (America/Sao_Paulo)
 * de forma totalmente segura contra problemas de timezone do servidor.
 * 
 * Esta função é essencial para operações que envolvem datas no Asaas,
 * pois o Asaas não aceita datas futuras para confirmação de pagamentos.
 * 
 * @returns Objeto com a data formatada e o objeto Date
 * 
 * @example
 * ```ts
 * const { dateStr, dateObj } = getCurrentBrasiliaDate();
 * // dateStr: "2025-10-21" (formato Asaas)
 * // dateObj: Date object set to noon UTC for database storage
 * ```
 */
export function getCurrentBrasiliaDate(): {
  dateStr: string;
  dateObj: Date;
  year: number;
  month: number;
  day: number;
} {
  // Obter data/hora atual no timezone de Brasília usando Intl.DateTimeFormat
  // Isso garante que temos a data CORRETA independente do timezone do servidor
  const now = new Date();
  
  // Formatar a data usando timezone de Brasília
  const brasiliaFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = brasiliaFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value);
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  
  // Criar string no formato YYYY-MM-DD (formato Asaas)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // Criar Date object para armazenar no banco (meio-dia UTC para evitar problemas de timezone)
  const dateObj = new Date(`${dateStr}T12:00:00.000Z`);
  
  return {
    dateStr,
    dateObj,
    year,
    month,
    day,
  };
}

/**
 * Calcula a próxima data de vencimento baseado em um dia do mês
 *
 * @param diaVencimento - Dia do mês (1-28)
 * @param mesesAFrente - Quantos meses à frente (padrão: 0 = mês atual)
 */
export function calcularProximoVencimento(diaVencimento: number, mesesAFrente = 0): Date {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const data = new Date(anoAtual, mesAtual + mesesAFrente, diaVencimento);

  // Se a data calculada já passou este mês, pula para o próximo
  if (mesesAFrente === 0 && data < hoje) {
    data.setMonth(data.getMonth() + 1);
  }

  return data;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valida se um CPF é válido (algoritmo de validação)
 */
export function isValidCpf(cpf: string): boolean {
  const cleaned = sanitizeCpfCnpj(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Todos iguais

  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Valida se um CNPJ é válido (algoritmo de validação)
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleaned = sanitizeCpfCnpj(cnpj);

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // Todos iguais

  // Validação do primeiro dígito
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validação do segundo dígito
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Valida CPF ou CNPJ
 */
export function isValidCpfCnpj(cpfCnpj: string): boolean {
  const cleaned = sanitizeCpfCnpj(cpfCnpj);
  if (cleaned.length === 11) return isValidCpf(cleaned);
  if (cleaned.length === 14) return isValidCnpj(cleaned);
  return false;
}

// ============================================================================
// IDEMPOTENCE HELPERS
// ============================================================================

/**
 * Gera um ID único para idempotência baseado em dados da requisição
 *
 * Útil para evitar duplicação de registros em operações críticas
 */
export function generateIdempotencyKey(...parts: string[]): string {
  return parts.join('|');
}

/**
 * Extrai o ID do evento do payload do webhook para idempotência
 */
export function extractWebhookEventId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const data = payload as Record<string, unknown>;

  // Tenta extrair ID do evento
  if (typeof data.id === 'string' && data.id) return data.id;

  // Fallback: gera ID baseado no tipo de evento e ID do recurso
  const event = typeof data.event === 'string' ? data.event : null;
  const resourceId =
    (data.payment as { id?: string })?.id ||
    (data.subscription as { id?: string })?.id ||
    (data.transfer as { id?: string })?.id ||
    (data.bill as { id?: string })?.id;

  if (event && resourceId) {
    return `${event}:${resourceId}`;
  }

  return null;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Verifica se um erro é um erro de API do Asaas
 */
export function isAsaasError(error: unknown): error is {
  statusCode?: number;
  data?: { errors?: Array<{ code: string; description: string }> };
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  );
}

/**
 * Formata mensagem de erro do Asaas para exibição
 */
export function formatAsaasError(error: unknown): string {
  if (!isAsaasError(error)) {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }

  const errors = error.data?.errors;
  if (errors && errors.length > 0) {
    return errors.map((e) => `[${e.code}] ${e.description}`).join('; ');
  }

  return `Erro ${error.statusCode}: Falha na comunicação com Asaas`;
}

// ============================================================================
// MASKING
// ============================================================================

/**
 * Mascara valores sensíveis para exibição (API Keys, secrets, etc)
 */
export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 6) return '••••';
  return value.slice(0, 3) + '••••' + value.slice(-3);
}
