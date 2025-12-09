/**
 * Módulo: Registro de Logs Financeiros
 *
 * Função helper para registrar todas as ações financeiras (CRUD de cobranças, assinaturas, etc)
 * no modelo LogFinanceiro para auditoria.
 */

import { prisma } from '../prisma';

export type AcaoFinanceira =
  | 'DELETAR'
  | 'PAUSAR'
  | 'REENVIAR'
  | 'SEGUNDA_VIA'
  | 'CONFIRMAR_MANUAL'
  | 'REFUND'
  | 'REATIVAR';

export interface RegistrarLogParams {
  contaId: string;
  usuarioId: string;
  cobrancaId?: string;
  acao: AcaoFinanceira;
  detalhes?: Record<string, unknown>;
}

/**
 * Registra uma ação financeira no log para auditoria
 */
export async function registrarLogFinanceiro(params: RegistrarLogParams): Promise<void> {
  try {
    await prisma.logFinanceiro.create({
      data: {
        contaId: params.contaId,
        usuarioId: params.usuarioId,
        cobrancaId: params.cobrancaId,
        acao: params.acao,
        detalhes: params.detalhes ? JSON.parse(JSON.stringify(params.detalhes)) : {},
      },
    });
  } catch (error) {
    // Não falhar a operação principal se o log falhar
    console.error('[Log Financeiro] Erro ao registrar log:', error);
  }
}
