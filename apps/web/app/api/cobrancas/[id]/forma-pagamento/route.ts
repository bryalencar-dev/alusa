import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { FORMA_PAGAMENTO_TO_ASAAS } from '@/lib/utils/asaas-sync';
import {
  AsaasEnvError,
  isAsaasEnabled,
  updatePayment,
  type CreatePaymentInput,
} from '@alusa/lib/asaas';
import { authOptions } from '@/lib/auth-options';

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

/**
 * PUT /api/cobrancas/[id]/forma-pagamento
 * Atualiza a forma de pagamento de uma cobrança e sincroniza com o Asaas
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Removido: logs de variáveis sensíveis de ambiente
    const { id } = params;
    const body = await req.json();
    const { formaPagamento } = body;

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 },
      );
    }

    const role = String(user.role ?? '').toUpperCase();
    if (!allowedRoles.has(role)) {
      return NextResponse.json(
        { success: false, error: 'Usuário sem permissão para alterar forma de pagamento' },
        { status: 403 },
      );
    }

    // Validações básicas
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da cobrança é obrigatório' },
        { status: 400 },
      );
    }

    if (!formaPagamento) {
      return NextResponse.json(
        { success: false, error: 'Forma de pagamento é obrigatória' },
        { status: 400 },
      );
    }

    // Buscar cobrança
    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json(
        { success: false, error: 'Cobrança não encontrada' },
        { status: 404 },
      );
    }

    // Validar se a cobrança está pendente
    if (cobranca.status !== 'PENDENTE' && cobranca.status !== 'A_VENCER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas cobranças pendentes podem ter a forma de pagamento alterada',
        },
        { status: 400 },
      );
    }

    // Validar se tem asaasPaymentId
    if (!cobranca.asaasPaymentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cobrança não possui ID do Asaas. Não é possível sincronizar.',
        },
        { status: 400 },
      );
    }

    if (!isAsaasEnabled()) {
      console.warn('[PUT forma-pagamento] Integração Asaas desabilitada');
      return NextResponse.json(
        {
          success: false,
          error: 'Integração com Asaas desabilitada. Ative FEATURE_ASAAS para sincronizar.',
        },
        { status: 503 },
      );
    }

    // Mapear forma de pagamento para billingType do Asaas
    // Garantir que o valor recebido está no padrão do mapeamento
    let formaPagamentoKey = formaPagamento;
    if (formaPagamentoKey === 'CREDIT_CARD') formaPagamentoKey = 'CARTAO_CREDITO';
    const billingType =
      FORMA_PAGAMENTO_TO_ASAAS[formaPagamentoKey as keyof typeof FORMA_PAGAMENTO_TO_ASAAS];

    if (!billingType) {
      return NextResponse.json(
        {
          success: false,
          error: `Forma de pagamento inválida: ${formaPagamento}`,
        },
        { status: 400 },
      );
    }

    // Atualizar no Asaas via POST
    const asaasPayload = { billingType };

    console.log('[PUT forma-pagamento] Sincronizando com Asaas:', {
      paymentId: cobranca.asaasPaymentId,
      billingType,
      formaPagamentoAlusa: formaPagamento,
    });

    let asaasData: Awaited<ReturnType<typeof updatePayment>>;
    try {
      const contaId = cobranca.matricula.aluno?.contaId;
      const opts = contaId ? { contaId } : undefined;
      const payload: Partial<CreatePaymentInput> = asaasPayload;
      asaasData = await updatePayment(cobranca.asaasPaymentId, payload, opts);
      console.log('[PUT forma-pagamento] Resposta Asaas:', {
        paymentId: asaasData.id,
        billingType: asaasData.billingType,
        status: asaasData.status,
      });
    } catch (error) {
      if (error instanceof AsaasEnvError) {
        console.error('[PUT forma-pagamento] Configuração Asaas inválida:', error.message);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 },
        );
      }

      console.error('[PUT forma-pagamento] Erro ao atualizar no Asaas:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao sincronizar com Asaas',
          details: {
            paymentId: cobranca.asaasPaymentId,
            billingType,
          },
        },
        { status: 500 },
      );
    }
    console.log('[PUT forma-pagamento] ✅ Cobrança atualizada com sucesso no Asaas:', {
      paymentId: asaasData.id,
      billingType: asaasData.billingType,
      status: asaasData.status,
    });

    // Buscar contaId da matrícula através do aluno
    const matricula = await prisma.matricula.findUnique({
      where: { id: cobranca.matriculaId },
      include: {
        aluno: {
          select: { contaId: true },
        },
      },
    });

    if (!matricula) {
      return NextResponse.json(
        { success: false, error: 'Matrícula não encontrada' },
        { status: 404 },
      );
    }

    const contaId = matricula.aluno.contaId ?? user.contaId ?? undefined;

    if (!contaId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aluno não possui conta vinculada. Não é possível registrar log financeiro.',
        },
        { status: 400 },
      );
    }

    // Atualizar no banco local
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: { id },
      data: {
        formaPagamento,
        updatedAt: new Date(),
      },
    });

    // Registrar log de alteração
    await prisma.logFinanceiro.create({
      data: {
        contaId,
        usuarioId: user.id,
        cobrancaId: id,
        acao: 'FORMA_PAGAMENTO_ALTERADA',
        detalhes: {
          formaAnterior: cobranca.formaPagamento,
          formaNova: formaPagamento,
          billingTypeAsaas: billingType,
          asaasPaymentId: cobranca.asaasPaymentId,
          dataAlteracao: new Date().toISOString(),
        },
      },
    });

    // Registrar webhook simulado (PAYMENT_UPDATED) para auditoria
    try {
      await prisma.webhookAsaas.create({
        data: {
          contaId,
          evento: 'PAYMENT_UPDATED',
          eventId: `manual_${Date.now()}_${cobranca.id}`,
          payload: {
            event: 'PAYMENT_UPDATED',
            payment: {
              id: cobranca.asaasPaymentId,
              billingType,
              formaPagamento,
              updatedAt: new Date().toISOString(),
            },
          },
          status: 'PROCESSADO',
          processadoEm: new Date(),
        },
      });
    } catch (webhookError) {
      console.error('[PUT forma-pagamento] Erro ao registrar webhook:', webhookError);
      // Não falha a operação por erro no webhook
    }

    return NextResponse.json({
      success: true,
      message: 'Forma de pagamento atualizada com sucesso',
      data: {
        cobranca: cobrancaAtualizada,
        asaasData,
      },
    });
  } catch (error) {
    console.error('[PUT forma-pagamento] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
