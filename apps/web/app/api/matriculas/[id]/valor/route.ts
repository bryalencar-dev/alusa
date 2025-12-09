import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@alusa/lib';
import { updateSubscription } from '@alusa/lib/asaas';
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
  const requested = explicit?.trim() || null;
  if (requested && sessionContaId && requested !== sessionContaId) {
    return { contaId: null, mismatch: true };
  }
  return { contaId: requested || sessionContaId, mismatch: false };
}

/**
 * PUT /api/matriculas/[id]/valor
 * Atualiza o valor da mensalidade da assinatura no Asaas
 * 
 * @see https://docs.asaas.com/docs/criando-uma-assinatura - POST /v3/subscriptions/{id}
 * 
 * Body:
 * - value: number (novo valor da mensalidade)
 * - updatePendingPayments: boolean (se true, atualiza cobranças pendentes também)
 */
export async function PUT(req: Request, ctx: { params: { id: string } }) {
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

    const matriculaId = ctx.params.id;
    const value = (body as { value?: number }).value;
    const updatePendingPayments = (body as { updatePendingPayments?: boolean }).updatePendingPayments ?? true;

    if (typeof value !== 'number' || value <= 0) {
      return jsonError(400, 'VALOR_INVALIDO', 'value deve ser um número positivo');
    }

    // Buscar matrícula
    const matricula = await prisma.matricula.findFirst({
      where: {
        id: matriculaId,
        aluno: { contaId: contaCtx.contaId },
      },
      select: {
        id: true,
        asaasSubscriptionId: true,
        planoId: true,
      },
    });

    if (!matricula) {
      return jsonError(404, 'NAO_ENCONTRADO', 'Matrícula não encontrada');
    }

    if (!matricula.asaasSubscriptionId) {
      return jsonError(400, 'ASSINATURA_NAO_ENCONTRADA', 'Esta matrícula não possui assinatura no Asaas');
    }

    console.log('[ASAAS_SYNC] Atualizando valor da assinatura:', {
      subscriptionId: matricula.asaasSubscriptionId,
      value,
      updatePendingPayments,
    });

    // Atualizar assinatura no Asaas
    // @see https://docs.asaas.com/docs/criando-uma-assinatura - POST /v3/subscriptions/{id}
    const asaasResponse = await updateSubscription(matricula.asaasSubscriptionId, {
      value,
      updatePendingPayments,
    }, {
      contaId: contaCtx.contaId,
    });

    console.log('[ASAAS_SYNC] Valor da assinatura atualizado com sucesso no Asaas:', {
      subscriptionId: asaasResponse.id,
      newValue: asaasResponse.value,
    });

    // Atualizar valor no banco local se necessário (ex: campo de valor personalizado)
    // Nota: O valor da mensalidade vem do Plano, mas podemos armazenar um override

    return NextResponse.json(
      {
        success: true,
        message: updatePendingPayments
          ? 'Valor da mensalidade atualizado com sucesso (incluindo cobranças pendentes)'
          : 'Valor da mensalidade atualizado com sucesso (apenas futuras cobranças)',
        data: {
          subscriptionId: asaasResponse.id,
          value: asaasResponse.value,
          updatePendingPayments,
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[ASAAS_SYNC] Erro ao atualizar valor:', error);
    return jsonError(500, 'ERRO_ATUALIZAR_VALOR', (error as Error).message);
  }
}
