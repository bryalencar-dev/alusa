/**
 * Helper para registrar logs de integração com Asaas
 *
 * Registra todas as requests enviadas ao Asaas para auditoria completa.
 */

import { prisma } from '../prisma';

export type TipoOperacaoAsaas =
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  | 'GET_CUSTOMER'
  | 'CREATE_SUBSCRIPTION'
  | 'UPDATE_SUBSCRIPTION'
  | 'DELETE_SUBSCRIPTION'
  | 'SUSPEND_SUBSCRIPTION'
  | 'ACTIVATE_SUBSCRIPTION'
  | 'GET_SUBSCRIPTION'
  | 'CREATE_PAYMENT'
  | 'UPDATE_PAYMENT'
  | 'DELETE_PAYMENT'
  | 'RECEIVE_IN_CASH'
  | 'GET_PAYMENT';

export type EntidadeIntegracao = 'ALUNO' | 'RESPONSAVEL' | 'MATRICULA' | 'COBRANCA' | 'PAGAMENTO';

export interface LogIntegracaoInput {
  contaId: string;
  tipoOperacao: TipoOperacaoAsaas;
  entidade: EntidadeIntegracao;
  entidadeId: string;
  asaasId?: string;
  status: 'SUCCESS' | 'ERROR';
  httpStatus?: number;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  errorMessage?: string;
  idempotencyKey?: string;
  duration?: number;
}

/**
 * Registra log de integração com Asaas (fail-safe)
 */
export async function registrarLogIntegracao(input: LogIntegracaoInput): Promise<void> {
  try {
    await prisma.logIntegracao.create({
      data: {
        contaId: input.contaId,
        tipoOperacao: input.tipoOperacao,
        entidade: input.entidade,
        entidadeId: input.entidadeId,
        asaasId: input.asaasId,
        status: input.status,
        httpStatus: input.httpStatus,
        request: input.request ? JSON.parse(JSON.stringify(input.request)) : null,
        response: input.response ? JSON.parse(JSON.stringify(input.response)) : null,
        errorMessage: input.errorMessage,
        idempotencyKey: input.idempotencyKey,
        duration: input.duration,
      },
    });
  } catch (error) {
    // Fail-safe: não quebrar operação principal se log falhar
    console.error('[LogIntegracao] Erro ao registrar log:', error);
  }
}

/**
 * Helper para medir duração de operação
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
