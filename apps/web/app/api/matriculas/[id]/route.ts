import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { atualizarStatusMatricula, buscarMatriculaPorId, prisma } from '@alusa/lib';
import { StatusMatricula, StatusCobranca } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

type SessionUser = {
  id?: string | null;
  contaId?: string | null;
};

async function resolveContaId(explicit?: string | null) {
  const session = await getServerSession(authOptions).catch(() => null);
  const sessionUser = (session as { user?: SessionUser } | null)?.user ?? null;
  const sessionContaId = sessionUser?.contaId || null;
  const sessionUserId = sessionUser?.id || null;
  const requested = explicit?.trim() || null;
  if (requested && sessionContaId && requested !== sessionContaId) {
    return { contaId: null, mismatch: true, sessionContaId, sessionUserId };
  }
  return {
    contaId: requested || sessionContaId,
    mismatch: false,
    sessionContaId,
    sessionUserId,
  };
}

const statusValues = new Set(Object.values(StatusMatricula));

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const contaCtx = await resolveContaId(null);
    if (!contaCtx.contaId) {
      return jsonError(401, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    }

    const matricula = await buscarMatriculaPorId({
      id: ctx.params.id,
      contaId: contaCtx.contaId,
    });

    if (!matricula) {
      return jsonError(404, 'NAO_ENCONTRADO', 'Matrícula não encontrada');
    }

    return NextResponse.json({ matricula }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    return jsonError(500, 'ERRO_BUSCAR_MATRICULA', (error as Error).message);
  }
}

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'PAYLOAD_INVALIDO', 'Payload inválido');
    }
    const contaCtx = await resolveContaId((body as { contaId?: string | null }).contaId ?? null);
    if (contaCtx.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!contaCtx.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    const statusRaw = (body as { status?: unknown }).status;
    if (typeof statusRaw !== 'string' || !statusValues.has(statusRaw as StatusMatricula)) {
      return jsonError(422, 'STATUS_INVALIDO', 'Status informado é inválido.');
    }

    const matricula = await atualizarStatusMatricula({
      id: ctx.params.id,
      contaId: contaCtx.contaId,
      status: statusRaw as StatusMatricula,
    });

    return NextResponse.json(
      {
        data: {
          id: matricula.id,
          alunoId: matricula.alunoId,
          planoId: matricula.planoId,
          turmaId: matricula.turmaId,
          comboId: matricula.comboId,
          status: matricula.status,
          dataInicio: matricula.dataInicio.toISOString(),
          dataFimContrato: matricula.dataFimContrato.toISOString(),
          taxaMatricula: matricula.taxaMatricula ? Number(matricula.taxaMatricula) : null,
          asaasId: matricula.asaasId,
          createdAt: matricula.createdAt.toISOString(),
          updatedAt: matricula.updatedAt.toISOString(),
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('Erro ao atualizar matrícula:', error);
    if ((error as { name?: string }).name === 'ZodError') {
      return jsonError(422, 'ERRO_VALIDACAO', (error as Error).message, error as Error);
    }
    return jsonError(500, 'ERRO_ATUALIZAR_MATRICULA', (error as Error).message);
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const contaCtx = await resolveContaId(url.searchParams.get('contaId'));
    if (contaCtx.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!contaCtx.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }

    const matriculaId = ctx.params.id;
    const contaId = contaCtx.contaId;
    
    // Extrair motivo do body (se fornecido)
    let motivo: string | undefined;
    try {
      const body = await req.json();
      motivo = body?.motivo;
    } catch {
      // Body opcional
    }

    console.log('[ASAAS_SYNC] Iniciando exclusão de matrícula:', {
      matriculaId,
      contaId,
      timestamp: new Date().toISOString(),
    });

    // 1. Buscar matrícula com cobranças
    const matricula = await prisma.matricula.findFirst({
      where: { id: matriculaId, aluno: { contaId } },
      include: {
        cobrancas: {
          select: {
            id: true,
            tipo: true,
            status: true,
            valor: true,
            vencimento: true,
            formaPagamento: true,
            asaasId: true,
            asaasPaymentId: true,
          },
        },
        aluno: { select: { nome: true, contaId: true } },
      },
    });

    if (!matricula) {
      console.error('[ASAAS_SYNC] Matrícula não encontrada:', { matriculaId, contaId });
      return jsonError(404, 'NAO_ENCONTRADO', 'Matrícula não encontrada');
    }

    const blockingStatuses: StatusCobranca[] = [
      StatusCobranca.PENDENTE,
      StatusCobranca.PROCESSANDO,
      StatusCobranca.ATRASADO,
      StatusCobranca.PAGO,
    ];

    const cobrancasBloqueantes = matricula.cobrancas.filter((c) =>
      blockingStatuses.includes(c.status),
    );

    if (cobrancasBloqueantes.length > 0) {
      const detalhes = cobrancasBloqueantes.map((c) => ({
        id: c.id,
        status: c.status,
        tipo: c.tipo,
        valor: Number(c.valor),
        vencimento: c.vencimento.toISOString(),
        formaPagamento: c.formaPagamento,
      }));

      console.warn('[ASAAS_SYNC] Tentativa de deletar matrícula com cobranças bloqueantes:', {
        matriculaId,
        bloqueantes: detalhes,
      });

      return jsonError(
        400,
        'COBRANCAS_PENDENTES',
        'Não é possível deletar a matrícula enquanto existirem cobranças pendentes, em processamento, atrasadas ou pagas.',
        { cobrancasBloqueantes: detalhes },
      );
    }

    const cobrancasResumo = matricula.cobrancas.map((c) => ({
      id: c.id,
      status: c.status,
      tipo: c.tipo,
      valor: Number(c.valor),
      vencimento: c.vencimento.toISOString(),
      formaPagamento: c.formaPagamento,
      asaasId: c.asaasId,
      asaasPaymentId: c.asaasPaymentId,
    }));

    // 3. Deletar assinatura no Asaas (se existir)
    let asaasDeletedSuccessfully = false;
    if (matricula.asaasSubscriptionId) {
      try {
        const { deleteSubscription } = await import('@alusa/lib/asaas');
        console.log('[ASAAS_SYNC] Deletando assinatura no Asaas:', {
          subscriptionId: matricula.asaasSubscriptionId,
        });

        await deleteSubscription(matricula.asaasSubscriptionId, {
          contaId,
        });

        asaasDeletedSuccessfully = true;
        console.log('[ASAAS_SYNC] Assinatura deletada no Asaas com sucesso:', {
          subscriptionId: matricula.asaasSubscriptionId,
        });
      } catch (error) {
        console.error('[ASAAS_SYNC] Erro ao deletar assinatura no Asaas:', {
          subscriptionId: matricula.asaasSubscriptionId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continuar com a deleção local mesmo se falhar no Asaas
      }
    } else {
      console.log('[ASAAS_SYNC] Matrícula sem asaasSubscriptionId, pulando deleção no Asaas');
    }

    const agora = new Date();

    // 4. Deletar matrícula do banco de dados local
    await prisma.$transaction(async (tx) => {
      // Registrar log da exclusão com motivo (antes de deletar a matrícula)
      await tx.matriculaLog.create({
        data: {
          matriculaId,
          actorId: contaCtx.sessionUserId ?? undefined,
          action: 'MATRICULA_DELETED',
          metadata: JSON.parse(
            JSON.stringify({
              motivo: motivo || null,
              asaasSubscriptionId: matricula.asaasSubscriptionId,
              alunoNome: matricula.aluno.nome,
              status: matricula.status,
              asaasDeletedSuccessfully,
              timestamp: agora.toISOString(),
            }),
          ),
        },
      });

      // Deletar matrícula
      await tx.matricula.delete({
        where: { id: matriculaId },
      });

      // Criar registro de auditoria
      await tx.webhookAsaas.create({
        data: {
          contaId,
          evento: 'SUBSCRIPTION_DELETED',
          payload: JSON.parse(
            JSON.stringify({
              matriculaId,
              asaasSubscriptionId: matricula.asaasSubscriptionId,
              alunoNome: matricula.aluno.nome,
              deletedAt: agora.toISOString(),
              asaasDeletedSuccessfully,
              deletedById: contaCtx.sessionUserId ?? null,
              cobrancasResumo,
            }),
          ),
          status: 'PROCESSADO',
          processadoEm: agora,
        },
      });

      console.log('[ASAAS_SYNC] Matrícula deletada do banco e auditoria criada:', {
        matriculaId,
        asaasSubscriptionId: matricula.asaasSubscriptionId,
      });
    });

    return NextResponse.json(
      { success: true, message: 'Matrícula excluída com sucesso', deletedId: matriculaId },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[ASAAS_SYNC] Erro ao deletar matrícula:', error);
    return jsonError(500, 'ERRO_DELETAR_MATRICULA', (error as Error).message);
  }
}
