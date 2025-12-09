import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment, isAsaasEnabled, AsaasEnvError } from '@alusa/lib/asaas';
import { StatusCobranca } from '@prisma/client';

/**
 * POST /api/cobrancas/[id]/sync-asaas
 * Sincroniza manualmente uma cobrança com dados do Asaas
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da cobrança é obrigatório' },
        { status: 400 },
      );
    }

    // Verificar se integração está habilitada
    if (!isAsaasEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Integração com Asaas não está habilitada',
        },
        { status: 503 },
      );
    }

    // Buscar cobrança local
    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        matricula: {
          include: { aluno: true },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json(
        { success: false, error: 'Cobrança não encontrada' },
        { status: 404 },
      );
    }

    if (!cobranca.asaasPaymentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Esta cobrança não possui ID do Asaas para sincronizar',
        },
        { status: 400 },
      );
    }

    // Buscar dados atuais do Asaas
    console.log('[Sync Asaas] Buscando dados do Asaas para payment:', cobranca.asaasPaymentId);
    
    const contaId = cobranca.matricula.aluno.contaId;
    let asaasData;
    
    try {
      asaasData = await getPayment(
        cobranca.asaasPaymentId,
        contaId ? { contaId } : undefined,
      );
      
      console.log('[Sync Asaas] Dados recebidos do Asaas:', {
        status: asaasData.status,
        value: asaasData.value,
        dueDate: asaasData.dueDate,
      });
    } catch (error) {
      if (error instanceof AsaasEnvError) {
        return NextResponse.json(
          {
            success: false,
            error: `Configuração do Asaas inválida: ${error.message}`,
          },
          { status: 500 },
        );
      }
      
      console.error('[Sync Asaas] Erro ao buscar pagamento do Asaas:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar dados do Asaas',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }

    // Mapear status do Asaas para StatusCobranca
    const statusMap: Record<string, StatusCobranca> = {
      PENDING: 'PENDENTE',
      RECEIVED: 'PAGO',
      CONFIRMED: 'PAGO',
      OVERDUE: 'ATRASADO',
      REFUNDED: 'ESTORNADO',
      RECEIVED_IN_CASH: 'PAGO',
    };

    const novoStatus = statusMap[asaasData.status] || cobranca.status;

    // Preparar dados para atualização
    const dadosParaAtualizar: {
      status: StatusCobranca;
      valor: number;
      vencimento: Date;
      dataPagamento?: Date | null;
    } = {
      status: novoStatus,
      valor: asaasData.value,
      vencimento: new Date(asaasData.dueDate),
    };

    // Se pagamento foi confirmado, adicionar data de pagamento
    if (
      (asaasData.status === 'RECEIVED' ||
        asaasData.status === 'CONFIRMED' ||
        asaasData.status === 'RECEIVED_IN_CASH') &&
      asaasData.paymentDate
    ) {
      dadosParaAtualizar.dataPagamento = new Date(asaasData.paymentDate);
      
      // Criar ou atualizar registro de pagamento
      await prisma.pagamento.upsert({
        where: { asaasPaymentId: cobranca.asaasPaymentId },
        update: {
          dataPagamento: new Date(asaasData.paymentDate),
          valorPago: asaasData.value,
          status: 'CONFIRMADO',
        },
        create: {
          cobrancaId: cobranca.id,
          dataPagamento: new Date(asaasData.paymentDate),
          formaPagamento: cobranca.formaPagamento,
          valorPago: asaasData.value,
          status: 'CONFIRMADO',
          asaasPaymentId: cobranca.asaasPaymentId,
        },
      });
    }

    // Atualizar cobrança no banco
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: { id },
      data: dadosParaAtualizar,
    });

    console.log('[Sync Asaas] Cobrança atualizada com sucesso:', {
      id: cobrancaAtualizada.id,
      statusAnterior: cobranca.status,
      statusNovo: cobrancaAtualizada.status,
      valorAnterior: Number(cobranca.valor),
      valorNovo: Number(cobrancaAtualizada.valor),
    });

    // Registrar log de sincronização
    await prisma.logFinanceiro.create({
      data: {
        contaId,
        usuarioId: 'system', // Sincronização manual via sistema
        cobrancaId: cobranca.id,
        acao: 'SINCRONIZACAO_MANUAL_ASAAS',
        detalhes: {
          asaasPaymentId: cobranca.asaasPaymentId,
          statusAnterior: cobranca.status,
          statusNovo: cobrancaAtualizada.status,
          valorAnterior: Number(cobranca.valor),
          valorNovo: Number(cobrancaAtualizada.valor),
          vencimentoAnterior: cobranca.vencimento.toISOString(),
          vencimentoNovo: cobrancaAtualizada.vencimento.toISOString(),
          dataSincronizacao: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      data: {
        cobranca: cobrancaAtualizada,
        asaasData,
      },
    });
  } catch (error) {
    console.error('[POST /api/cobrancas/[id]/sync-asaas] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao sincronizar com Asaas',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


