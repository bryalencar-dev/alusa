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
 * PUT /api/matriculas/[id]/forma-pagamento
 * Atualiza a forma de pagamento da assinatura no Asaas
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
    const billingType = (body as { billingType?: string }).billingType;

    if (!billingType || typeof billingType !== 'string') {
      return jsonError(400, 'BILLING_TYPE_OBRIGATORIO', 'billingType é obrigatório');
    }

    // Validar billingType
    const validBillingTypes = ['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED'];
    if (!validBillingTypes.includes(billingType)) {
      return jsonError(400, 'BILLING_TYPE_INVALIDO', `billingType deve ser um de: ${validBillingTypes.join(', ')}`);
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
      },
    });

    if (!matricula) {
      return jsonError(404, 'NAO_ENCONTRADO', 'Matrícula não encontrada');
    }

    if (!matricula.asaasSubscriptionId) {
      return jsonError(400, 'ASSINATURA_NAO_ENCONTRADA', 'Esta matrícula não possui assinatura no Asaas');
    }

    console.log('[ASAAS_SYNC] Atualizando forma de pagamento da assinatura:', {
      subscriptionId: matricula.asaasSubscriptionId,
      billingType,
    });

    // Atualizar assinatura no Asaas com updatePendingPayments para sincronizar cobranças pendentes
    // @see https://docs.asaas.com/docs/criando-uma-assinatura - POST /v3/subscriptions/{id}
    await updateSubscription(matricula.asaasSubscriptionId, {
      billingType: billingType as 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UNDEFINED' | 'TRANSFER' | 'DEPOSIT' | 'PIX',
      updatePendingPayments: true,
    }, {
      contaId: contaCtx.contaId,
    });

    console.log('[ASAAS_SYNC] Forma de pagamento atualizada com sucesso no Asaas');

    return NextResponse.json(
      {
        success: true,
        message: 'Forma de pagamento atualizada com sucesso',
        data: {
          billingType,
        },
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[ASAAS_SYNC] Erro ao atualizar forma de pagamento:', error);
    return jsonError(500, 'ERRO_ATUALIZAR_FORMA_PAGAMENTO', (error as Error).message);
  }
}

