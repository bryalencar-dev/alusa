/**
 * Helpers para mapear dados de Matrícula para formato Asaas Subscription
 */

import type { CreateSubscriptionInput } from './subscription';
import type { PeriodicidadePlano, FormaPagamento } from '@prisma/client';

/**
 * Formata data para formato Asaas (YYYY-MM-DD)
 */
function formatDateToAsaas(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula próxima data de vencimento com base no dia do vencimento
 */
function calculateNextDueDate(dataInicio: Date, vencimentoDia: number): Date {
  const nextDue = new Date(dataInicio);
  nextDue.setDate(vencimentoDia);

  // Se o dia já passou no mês atual, vai para o próximo mês
  if (nextDue < dataInicio) {
    nextDue.setMonth(nextDue.getMonth() + 1);
  }

  return nextDue;
}

/**
 * Mapeia periodicidade do plano Alusa para ciclo Asaas
 */
export function mapPeriodicidadeToCycle(
  periodicidade: PeriodicidadePlano,
): 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' {
  const map: Record<
    PeriodicidadePlano,
    'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  > = {
    SEMANAL: 'WEEKLY',
    QUINZENAL: 'BIWEEKLY',
    MENSAL: 'MONTHLY',
    TRIMESTRAL: 'QUARTERLY',
    ANUAL: 'YEARLY',
  };

  return map[periodicidade] || 'MONTHLY';
}

/**
 * Mapeia forma de pagamento Alusa para billingType Asaas
 */
export function mapFormaPagamentoToBillingType(
  formaPagamento: FormaPagamento,
): 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED' {
  const map: Record<FormaPagamento, 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'> = {
    PIX: 'PIX',
    CARTAO_CREDITO: 'CREDIT_CARD',
    BOLETO: 'BOLETO',
    INDEFINIDO: 'UNDEFINED',
  };

  return map[formaPagamento] || 'BOLETO';
}

export interface MatriculaToAsaasInput {
  id: string;
  asaasCustomerId: string; // ID do customer no Asaas (aluno ou responsável)
  valor: number; // Valor da mensalidade
  periodicidade: PeriodicidadePlano;
  formaPagamento: FormaPagamento;
  dataInicio: Date;
  dataFimContrato: Date;
  vencimentoDia: number;
  alunoNome: string;
  planoNome: string;
  turmaNome?: string;
  comboNome?: string;
  // Campos de desconto, juros e multa
  descontoValor?: number;
  descontoDias?: number;
  jurosMensal?: number;
  multaPercentual?: number;
  maxPayments?: number; // Número máximo de cobranças
}

/**
 * Mapeia dados de Matrícula para formato Asaas Subscription
 */
export function mapMatriculaToAsaasSubscription(
  matricula: MatriculaToAsaasInput,
): CreateSubscriptionInput {
  if (!matricula.asaasCustomerId) {
    throw new Error('asaasCustomerId é obrigatório para criar subscription no Asaas');
  }

  if (matricula.valor <= 0) {
    throw new Error('Valor da mensalidade deve ser maior que zero');
  }

  const nextDueDate = calculateNextDueDate(matricula.dataInicio, matricula.vencimentoDia);

  // Descrição detalhada da assinatura
  const turmaOuCombo = matricula.turmaNome || matricula.comboNome || 'Sem turma';
  const description = `Mensalidade ${matricula.planoNome} - ${matricula.alunoNome} - ${turmaOuCombo}`;

  const subscriptionData: CreateSubscriptionInput = {
    customer: matricula.asaasCustomerId,
    billingType: mapFormaPagamentoToBillingType(matricula.formaPagamento),
    value: Number(matricula.valor.toFixed(2)),
    nextDueDate: formatDateToAsaas(nextDueDate),
    cycle: mapPeriodicidadeToCycle(matricula.periodicidade),
    description: description.slice(0, 500), // Limite de 500 caracteres
    externalReference: matricula.id, // ID da matrícula na Alusa
  };

  // Data de fim da assinatura (usando dataFimContrato)
  subscriptionData.endDate = formatDateToAsaas(matricula.dataFimContrato);

  // Desconto (se aplicável)
  if (matricula.descontoValor && matricula.descontoValor > 0) {
    subscriptionData.discount = {
      value: Number(matricula.descontoValor.toFixed(2)),
      dueDateLimitDays: matricula.descontoDias || 0,
      type: 'FIXED', // Asaas aceita 'FIXED' ou 'PERCENTAGE'
    };
  }

  // Juros (se aplicável)
  if (matricula.jurosMensal && matricula.jurosMensal > 0) {
    subscriptionData.interest = {
      value: Number(matricula.jurosMensal.toFixed(2)),
    };
  }

  // Multa (se aplicável)
  if (matricula.multaPercentual && matricula.multaPercentual > 0) {
    subscriptionData.fine = {
      value: Number(matricula.multaPercentual.toFixed(2)),
    };
  }

  // Número máximo de cobranças (se definido)
  if (matricula.maxPayments && matricula.maxPayments > 0) {
    subscriptionData.maxPayments = matricula.maxPayments;
  }

  return subscriptionData;
}

/**
 * Valida dados de subscription antes de enviar para Asaas
 */
export function validateSubscriptionData(data: CreateSubscriptionInput): void {
  if (!data.customer) {
    throw new Error('customer é obrigatório');
  }

  if (!data.value || data.value <= 0) {
    throw new Error('value deve ser maior que zero');
  }

  if (!data.nextDueDate) {
    throw new Error('nextDueDate é obrigatório');
  }

  if (!data.cycle) {
    throw new Error('cycle é obrigatório');
  }

  // Validar formato de data (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.nextDueDate)) {
    throw new Error('nextDueDate deve estar no formato YYYY-MM-DD');
  }

  if (data.endDate && !dateRegex.test(data.endDate)) {
    throw new Error('endDate deve estar no formato YYYY-MM-DD');
  }
}
