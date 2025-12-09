/**
 * API de Auditoria Financeira
 *
 * Fornece visão completa do histórico de uma cobrança incluindo:
 * - Timeline de mudanças de status
 * - Logs de todas as operações (cancelamentos, estornos, pagamentos)
 * - Campos de auditoria detalhados
 * - Webhooks recebidos
 */

import { NextResponse } from 'next/server';
import { prisma } from '@alusa/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/cobrancas/[id]/auditoria
 *
 * Retorna histórico completo de auditoria de uma cobrança
 */
export async function GET(_: unknown, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se usuário tem permissão (ADMIN ou FINANCEIRO)
    if (!['ADMIN', 'FINANCEIRO'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar auditoria' },
        { status: 403 },
      );
    }

    const cobrancaId = params.id;

    // Buscar cobrança com todos os dados relacionados
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpf: true,
              },
            },
            responsavelFinanceiro: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpf: true,
              },
            },
            plano: {
              select: {
                id: true,
                nome: true,
                valor: true,
                periodicidade: true,
              },
            },
          },
        },
        pagamentos: {
          orderBy: {
            dataPagamento: 'desc',
          },
        },
        logsFinanceiros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    // Buscar webhooks relacionados a esta cobrança
    // WebhookAsaas não tem paymentId/data, filtrar por payload JSON
    const webhooks = await prisma.webhookAsaas.findMany({
      where: {
        OR: [
          // payload.payment.id === cobranca.asaasPaymentId
          {
            payload: {
              path: ['payment', 'id'],
              equals: cobranca.asaasPaymentId ?? undefined,
            },
          },
          // payload.id === cobranca.asaasPaymentId (caso payload seja flat)
          {
            payload: {
              path: ['id'],
              equals: cobranca.asaasPaymentId ?? undefined,
            },
          },
        ],
      },
      orderBy: {
        recebidoEm: 'desc',
      },
      take: 20,
    });

    // Construir timeline de eventos
    const timeline = [
      // Criação da cobrança
      {
        tipo: 'CRIACAO',
        data: cobranca.createdAt,
        descricao: 'Cobrança criada',
        detalhes: {
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          formaPagamento: cobranca.formaPagamento,
        },
      },
    ];

    // Adicionar logs financeiros à timeline
    cobranca.logsFinanceiros.forEach((log) => {
      // detalhes pode ser qualquer Json, mas para manter o contrato da timeline, padronize para shape esperado ou null
      timeline.push({
        tipo: log.acao,
        data: log.createdAt,
        descricao: getDescricaoAcao(log.acao),
        detalhes: {
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          formaPagamento: cobranca.formaPagamento,
        },
      });
    });

    // Adicionar pagamentos à timeline
    cobranca.pagamentos.forEach((pagamento) => {
      if (pagamento.dataPagamento) {
        // Cast seguro para enum FormaPagamento
        let formaPagamentoEnum = cobranca.formaPagamento;
        if (pagamento.formaPagamento && typeof pagamento.formaPagamento === 'string') {
          if (
            ['BOLETO', 'PIX', 'CARTAO_CREDITO', 'INDEFINIDO'].includes(pagamento.formaPagamento)
          ) {
            formaPagamentoEnum = pagamento.formaPagamento as typeof cobranca.formaPagamento;
          }
        }
        timeline.push({
          tipo: 'PAGAMENTO',
          data: pagamento.dataPagamento,
          descricao: `Pagamento ${pagamento.status.toLowerCase()}`,
          detalhes: {
            valor: pagamento.valorPago,
            vencimento: cobranca.vencimento,
            formaPagamento: formaPagamentoEnum,
          },
        });
      }
    });

    // Adicionar eventos de auditoria da própria cobrança
    if (cobranca.pagoEm) {
      timeline.push({
        tipo: 'CONFIRMACAO_PAGAMENTO',
        data: cobranca.pagoEm,
        descricao: 'Pagamento confirmado',
        detalhes: {
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          formaPagamento: cobranca.formaPagamento,
        },
      });
    }

    if (cobranca.canceladoEm) {
      timeline.push({
        tipo: 'CANCELAMENTO',
        data: cobranca.canceladoEm,
        descricao: 'Cobrança cancelada',
        detalhes: {
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          formaPagamento: cobranca.formaPagamento,
        },
      });
    }

    if (cobranca.estornadoEm) {
      timeline.push({
        tipo: 'ESTORNO',
        data: cobranca.estornadoEm,
        descricao:
          cobranca.status === 'ESTORNADO_PARCIAL'
            ? 'Estorno parcial realizado'
            : 'Estorno total realizado',
        detalhes: {
          valor: cobranca.valor,
          vencimento: cobranca.vencimento,
          formaPagamento: cobranca.formaPagamento,
        },
      });
    }

    // Ordenar timeline por data (mais recente primeiro)
    timeline.sort((a, b) => b.data.getTime() - a.data.getTime());

    // Calcular estatísticas
    const stats = {
      diasDesdeVencimento: Math.floor(
        (new Date().getTime() - new Date(cobranca.vencimento).getTime()) / (1000 * 60 * 60 * 24),
      ),
      totalPago: cobranca.pagamentos.reduce((sum, p) => sum + Number(p.valorPago), 0),
      totalEstornado: Number(cobranca.estornadoValor || 0),
      saldoDevedor:
        Number(cobranca.valor) -
        cobranca.pagamentos.reduce((sum, p) => sum + Number(p.valorPago), 0) +
        Number(cobranca.estornadoValor || 0),
      totalWebhooks: webhooks.length,
      totalLogs: cobranca.logsFinanceiros.length,
    };

    return NextResponse.json({
      cobranca: {
        ...cobranca,
        // Informações derivadas
        isPago: cobranca.status === 'PAGO',
        isCancelado: cobranca.status === 'CANCELADO',
        isEstornado: ['ESTORNADO', 'ESTORNADO_PARCIAL'].includes(cobranca.status),
        isAtrasado: cobranca.status === 'ATRASADO',
      },
      timeline,
      webhooks,
      stats,
    });
  } catch (error) {
    console.error('[API Auditoria] Erro ao buscar auditoria:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados de auditoria' }, { status: 500 });
  }
}

/**
 * Retorna descrição humanizada para cada ação
 */
function getDescricaoAcao(acao: string): string {
  const descricoes: Record<string, string> = {
    DELETAR: 'Cobrança deletada',
    PAUSAR: 'Cobrança pausada',
    REENVIAR: 'Cobrança reenviada',
    SEGUNDA_VIA: 'Segunda via solicitada',
    CONFIRMAR_MANUAL: 'Pagamento confirmado manualmente',
    REFUND: 'Reembolso processado',
    REATIVAR: 'Cobrança reativada',
    ESTORNO_PARCIAL: 'Estorno parcial realizado',
    ESTORNO_TOTAL: 'Estorno total realizado',
    CANCELAMENTO: 'Cobrança cancelada',
    CRIAR_COBRANCA_MANUAL: 'Cobrança criada manualmente',
  };

  return descricoes[acao] || acao;
}
