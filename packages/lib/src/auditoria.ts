import { PrismaClient } from '@prisma/client';
import { logError } from '../logger';

let prisma: PrismaClient | null = null;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export interface AuditoriaInput {
  usuarioId?: string;
  acao: string;
  entidade?: string;
  entidadeId?: string;
  detalhes?: unknown;
}

export async function registrarAuditoria(input: AuditoriaInput) {
  try {
    const p = getPrisma();
    // Campos entidade / entidadeId / detalhes são NOT NULL no schema atual, então fornecemos defaults
    await p.logAuditoria.create({
      data: {
        usuarioId: input.usuarioId,
        acao: input.acao,
        entidade: input.entidade ?? 'N/A',
        entidadeId: input.entidadeId ?? 'N/A',
        detalhes: input.detalhes ?? {},
        criadoEm: new Date()
      }
    });
  } catch (e) {
    const err = e as Error;
    logError('falha_registrar_auditoria', { err: err.message });
  }
}