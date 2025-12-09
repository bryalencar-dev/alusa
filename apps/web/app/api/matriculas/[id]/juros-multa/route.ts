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
 * PUT /api/matriculas/[id]/juros-multa
 * Atualiza juros e multa da assinatura no Asaas
 */
export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    console.log('🟡 [BACKEND] Recebendo requisição PUT /api/matriculas/[id]/juros-multa');
    console.log('🟡 [BACKEND] Matrícula ID:', ctx.params.id);
    
    const body = await req.json().catch(() => null);
    console.log('🟡 [BACKEND] Body recebido:', JSON.stringify(body, null, 2));
    
    if (!body || typeof body !== 'object') {
      console.error('🔴 [BACKEND] Payload inválido');
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
    const interest = (body as { interest?: { value?: number; type?: 'FIXED' | 'PERCENTAGE' } }).interest;
    const fine = (body as { fine?: { value?: number; type?: 'FIXED' | 'PERCENTAGE' } }).fine;
    const discount = (body as { discount?: { value?: number; type?: 'FIXED' | 'PERCENTAGE'; dueDateLimitDays?: number } }).discount;

    // Validar valores
    if (interest && typeof interest.value !== 'number') {
      return jsonError(400, 'JUROS_INVALIDO', 'interest.value deve ser um número');
    }

    if (interest && interest.type && !['FIXED', 'PERCENTAGE'].includes(interest.type)) {
      return jsonError(400, 'JUROS_TIPO_INVALIDO', 'interest.type deve ser FIXED ou PERCENTAGE');
    }

    if (fine && typeof fine.value !== 'number') {
      return jsonError(400, 'MULTA_INVALIDA', 'fine.value deve ser um número');
    }

    if (fine && fine.type && !['FIXED', 'PERCENTAGE'].includes(fine.type)) {
      return jsonError(400, 'MULTA_TIPO_INVALIDO', 'fine.type deve ser FIXED ou PERCENTAGE');
    }

    if (discount && typeof discount.value !== 'number') {
      return jsonError(400, 'DESCONTO_INVALIDO', 'discount.value deve ser um número');
    }

    if (discount && discount.type && !['FIXED', 'PERCENTAGE'].includes(discount.type)) {
      return jsonError(400, 'DESCONTO_TIPO_INVALIDO', 'discount.type deve ser FIXED ou PERCENTAGE');
    }

    if (discount && discount.dueDateLimitDays && typeof discount.dueDateLimitDays !== 'number') {
      return jsonError(400, 'PRAZO_DESCONTO_INVALIDO', 'discount.dueDateLimitDays deve ser um número');
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

    console.log('🟡 [BACKEND] Atualizando juros, multa e desconto da assinatura:', {
      subscriptionId: matricula.asaasSubscriptionId,
      interest,
      fine,
      discount,
    });

    // Atualizar assinatura no Asaas com updatePendingPayments para sincronizar cobranças pendentes
    // @see https://docs.asaas.com/docs/criando-uma-assinatura - POST /v3/subscriptions/{id}
    console.log('🟡 [BACKEND] Chamando updateSubscription no Asaas...');
    const asaasResponse = await updateSubscription(matricula.asaasSubscriptionId, {
      interest,
      fine,
      discount,
      updatePendingPayments: true,
    }, {
      contaId: contaCtx.contaId,
    });
    console.log('🟢 [BACKEND] Resposta do Asaas:', JSON.stringify(asaasResponse, null, 2));

    console.log('🟢 [BACKEND] Juros, multa e desconto atualizados com sucesso no Asaas');

    // Atualizar no banco de dados local
    console.log('🟡 [BACKEND] Atualizando banco de dados local...');
    console.log('🟡 [BACKEND] Valores a serem salvos:', {
      jurosMensal: interest?.value,
      jurosTipo: interest?.type,
      multaPercentual: fine?.value,
      multaTipo: fine?.type,
      descontoAntecipado: discount?.value,
      descontoTipo: discount?.type,
      prazoDesconto: discount?.dueDateLimitDays,
    });
    
    const updatedMatricula = await prisma.matricula.update({
      where: { id: matriculaId },
      data: {
        jurosMensal: interest?.value ?? null,
        jurosTipo: interest?.type ?? null,
        multaPercentual: fine?.value ?? null,
        multaTipo: fine?.type ?? null,
        descontoAntecipado: discount?.value ?? null,
        descontoTipo: discount?.type ?? null,
        prazoDesconto: discount?.dueDateLimitDays ?? null,
      },
    });
    
    console.log('🟢 [BACKEND] Banco de dados atualizado:', {
      id: updatedMatricula.id,
      jurosMensal: updatedMatricula.jurosMensal,
      jurosTipo: updatedMatricula.jurosTipo,
      multaPercentual: updatedMatricula.multaPercentual,
      multaTipo: updatedMatricula.multaTipo,
      descontoAntecipado: updatedMatricula.descontoAntecipado,
      descontoTipo: updatedMatricula.descontoTipo,
      prazoDesconto: updatedMatricula.prazoDesconto,
    });
    
    // Verificar se realmente salvou
    const verificacao = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      select: {
        id: true,
        jurosMensal: true,
        jurosTipo: true,
        multaPercentual: true,
        multaTipo: true,
        descontoAntecipado: true,
        descontoTipo: true,
        prazoDesconto: true,
      },
    });
    console.log('🔍 [BACKEND] Verificação após salvamento:', {
      jurosMensal: verificacao?.jurosMensal,
      jurosTipo: verificacao?.jurosTipo,
      multaPercentual: verificacao?.multaPercentual,
      multaTipo: verificacao?.multaTipo,
      descontoAntecipado: verificacao?.descontoAntecipado,
      descontoTipo: verificacao?.descontoTipo,
      prazoDesconto: verificacao?.prazoDesconto,
    });

    console.log('🟢 [BACKEND] Juros e multa atualizados no banco de dados local');

    const response = {
      success: true,
      message: 'Juros, multa e desconto atualizados com sucesso',
      data: {
        interest,
        fine,
        discount,
        updated: {
          jurosMensal: updatedMatricula.jurosMensal,
          jurosTipo: updatedMatricula.jurosTipo,
          multaPercentual: updatedMatricula.multaPercentual,
          multaTipo: updatedMatricula.multaTipo,
          descontoAntecipado: updatedMatricula.descontoAntecipado,
          descontoTipo: updatedMatricula.descontoTipo,
          prazoDesconto: updatedMatricula.prazoDesconto,
        },
      },
    };
    
    console.log('🟢 [BACKEND] Enviando resposta de sucesso:', JSON.stringify(response, null, 2));

    return NextResponse.json(response, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('🔴 [BACKEND] Erro ao atualizar juros e multa:', error);
    console.error('🔴 [BACKEND] Stack trace:', (error as Error).stack);
    return jsonError(500, 'ERRO_ATUALIZAR_JUROS_MULTA', (error as Error).message);
  }
}


