/**
 * API Route: Confirmar Pagamento Manual
 *
 * POST /api/financeiro/confirmar-manual
 *
 * Confirma pagamento manual (dinheiro, depósito) no Asaas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { confirmarPagamentoManual, registrarLogFinanceiro, getCurrentBrasiliaDate } from '@alusa/lib/asaas';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
    }

    // Parse do body
    const body = await req.json();
    const paymentId = body.paymentId as string;
    const requestedPaymentDate = body.paymentDate as string | undefined;
    const value = body.value as number;
    const notifyCustomer = body.notifyCustomer as boolean | undefined;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 },
      );
    }

    // ✅ Obter data atual no timezone de Brasília (timezone-safe)
    const brasiliaDate = getCurrentBrasiliaDate();
    const paymentDate = requestedPaymentDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedPaymentDate)
      ? requestedPaymentDate
      : brasiliaDate.dateStr;
    
    const paymentDateObj = requestedPaymentDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedPaymentDate)
      ? new Date(requestedPaymentDate + 'T12:00:00.000Z')
      : brasiliaDate.dateObj;

    if (!value || value <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valor deve ser maior que zero' },
        { status: 400 },
      );
    }

    // Buscar cobrança local
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: paymentId },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                contaId: true,
              },
            },
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json(
        { success: false, message: 'Cobrança não encontrada' },
        { status: 404 },
      );
    }

    // Verificar se já está paga
    if (cobranca.status === 'PAGO') {
      return NextResponse.json(
        { success: false, message: 'Esta cobrança já está marcada como paga' },
        { status: 400 },
      );
    }

    // Verificar permissão
    const contaId = cobranca.matricula?.aluno?.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para confirmar esta cobrança' },
        { status: 403 },
      );
    }

    // Se tem ID Asaas, confirmar lá também
    if (cobranca.asaasPaymentId) {
      const result = await confirmarPagamentoManual({
        paymentId: cobranca.asaasPaymentId,
        paymentDate,
        value,
        notifyCustomer: notifyCustomer ?? false,
        contaId,
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // Atualizar status localmente
    await prisma.cobranca.update({
      where: { id: paymentId },
      data: {
        status: 'PAGO',
        dataPagamento: paymentDateObj,
        formaPagamento: 'INDEFINIDO', // Usar INDEFINIDO para confirmações manuais
      },
    });

    // Registrar log de auditoria
    await registrarLogFinanceiro({
      contaId,
      usuarioId: session.user.id,
      cobrancaId: paymentId,
      acao: 'CONFIRMAR_MANUAL',
      detalhes: {
        asaasPaymentId: cobranca.asaasPaymentId,
        paymentDate,
        value,
        notifyCustomer,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
    });
  } catch (error) {
    console.error('[API] Erro ao confirmar pagamento manual:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao confirmar pagamento',
      },
      { status: 500 },
    );
  }
}
