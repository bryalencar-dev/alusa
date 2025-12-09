/**
 * Helpers para mapear dados de Matrícula para formato Asaas Subscription
 */

import type { AsaasSubscriptionData } from './asaas-subscription.service';
import { mapPeriodicidadeToCycle } from './asaas-subscription.service';
import { mapFormaPagamentoToBillingType } from '../../asaas/subscription.helpers';
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
  descontoTipo?: 'FIXED' | 'PERCENTAGE';
  jurosMensal?: number;
  multaPercentual?: number;
}

/**
 * Mapeia dados de Matrícula para formato Asaas Subscription
 */
export function mapMatriculaToAsaasSubscription(
  matricula: MatriculaToAsaasInput,
): AsaasSubscriptionData {
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

  const subscriptionData: AsaasSubscriptionData = {
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
      type: matricula.descontoTipo || 'FIXED',
    };
  }

  // Juros mensal (se aplicável)
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

  return subscriptionData;
}

/**
 * Valida se os dados mínimos para criar subscription no Asaas estão presentes
 */
export function validateSubscriptionData(data: {
  asaasCustomerId?: string | null;
  valor?: number;
  dataInicio?: Date;
  vencimentoDia?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.asaasCustomerId) {
    errors.push('Customer ID do Asaas é obrigatório');
  }

  if (!data.valor || data.valor <= 0) {
    errors.push('Valor da mensalidade deve ser maior que zero');
  }

  if (!data.dataInicio) {
    errors.push('Data de início é obrigatória');
  }

  if (!data.vencimentoDia || data.vencimentoDia < 1 || data.vencimentoDia > 28) {
    errors.push('Dia de vencimento deve estar entre 1 e 28');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
