/**
 * API Route: Deletar Cobrança
 *
 * DELETE /api/financeiro/deletar-cobranca
 *
 * Deleta uma cobrança no Asaas e atualiza o status local
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { deleteCobranca, registrarLogFinanceiro } from '@alusa/lib/asaas';
import { z } from 'zod';

export async function DELETE(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
    }

    // Parse do body
    const body = await req.json();

    // Validação simples
    const paymentId = body.paymentId as string;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'ID do pagamento é obrigatório' },
        { status: 400 },
      );
    }

    const validated = { paymentId };

    // Buscar cobrança local
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: validated.paymentId },
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

    // Verificar permissão (mesma conta)
    const contaId = cobranca.matricula?.aluno?.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para deletar esta cobrança' },
        { status: 403 },
      );
    }

    // Deletar no Asaas (se tiver ID Asaas)
    if (cobranca.asaasPaymentId) {
      const result = await deleteCobranca({
        paymentId: cobranca.asaasPaymentId,
        contaId,
      });

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // Deletar localmente
    await prisma.cobranca.delete({
      where: { id: validated.paymentId },
    });

    // Registrar log de auditoria
    await registrarLogFinanceiro({
      contaId,
      usuarioId: session.user.id,
      cobrancaId: validated.paymentId,
      acao: 'DELETAR',
      detalhes: {
        asaasPaymentId: cobranca.asaasPaymentId,
        valor: cobranca.valor.toString(),
        status: cobranca.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cobrança deletada com sucesso',
    });
  } catch (error) {
    console.error('[API] Erro ao deletar cobrança:', error);

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
        message: 'Erro interno ao deletar cobrança',
      },
      { status: 500 },
    );
  }
}
