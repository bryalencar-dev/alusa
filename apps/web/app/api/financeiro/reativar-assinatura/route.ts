/**
 * API Route: Reativar Assinatura
 *
 * POST /api/financeiro/reativar-assinatura
 *
 * Reativa uma assinatura criando uma nova assinatura com os mesmos dados.
 * No Asaas, não há endpoint direto para reativar, então criamos uma nova.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@alusa/lib';
import { reativarAssinatura, registrarLogFinanceiro, formatDate } from '@alusa/lib/asaas';
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
    const matriculaId = body.matriculaId as string;

    if (!matriculaId) {
      return NextResponse.json(
        { success: false, message: 'ID da matrícula é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar matrícula com relações
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            email: true,
            contaId: true,
            asaasCustomerId: true,
          },
        },
        plano: {
          select: {
            nome: true,
            valor: true,
          },
        },
      },
    });

    if (!matricula) {
      return NextResponse.json(
        { success: false, message: 'Matrícula não encontrada' },
        { status: 404 },
      );
    }

    // Verificar se matrícula está cancelada
    if (matricula.status !== 'CANCELADA') {
      return NextResponse.json(
        { success: false, message: 'Apenas matrículas canceladas podem ser reativadas' },
        { status: 400 },
      );
    }

    // Verificar permissão
    const contaId = matricula.aluno?.contaId;
    if (contaId !== session.user.contaId) {
      return NextResponse.json(
        { success: false, message: 'Sem permissão para reativar esta matrícula' },
        { status: 403 },
      );
    }

    // Verificar se tem asaasCustomerId
    if (!matricula.aluno?.asaasCustomerId) {
      return NextResponse.json(
        { success: false, message: 'Aluno não tem ID de cliente no Asaas' },
        { status: 400 },
      );
    }

    // Calcular próxima data de vencimento (próximo mês, dia 10)
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(10);
    const nextDueDate = formatDate(nextMonth); // ✅ Usa formatDate (timezone-safe)

    // Chamar service para reativar (criar nova assinatura)
    const result = await reativarAssinatura({
      customer: matricula.aluno.asaasCustomerId,
      billingType: 'BOLETO',
      nextDueDate,
      value: Number(matricula.plano?.valor ?? 0),
      cycle: 'MONTHLY',
      description: `Mensalidade ${matricula.plano?.nome ?? 'Plano'}`,
      contaId,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Atualizar matrícula local
    const newSubscriptionId =
      result.data && typeof result.data === 'object' && 'id' in result.data
        ? (result.data as { id: string }).id
        : undefined;

    await prisma.matricula.update({
      where: { id: matriculaId },
      data: {
        status: 'ATIVA',
        asaasSubscriptionId: newSubscriptionId || matricula.asaasSubscriptionId,
        dataInicio: new Date(),
        // dataFimContrato permanece inalterado ao reativar
      },
    });

    // Registrar log de auditoria
    await registrarLogFinanceiro({
      contaId,
      usuarioId: session.user.id,
      acao: 'REATIVAR',
      detalhes: {
        matriculaId,
        newSubscriptionId,
        valor: matricula.plano?.valor?.toString() ?? '0',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Assinatura reativada com sucesso',
      data: result.data,
    });
  } catch (error) {
    console.error('[API] Erro ao reativar assinatura:', error);

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
        message: 'Erro interno ao reativar assinatura',
      },
      { status: 500 },
    );
  }
}
