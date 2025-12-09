import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AsaasEnvError,
  deletePayment,
  getPayment,
  isAsaasEnabled,
  updatePayment,
  type CreatePaymentInput,
} from '@alusa/lib/asaas';

/**
 * GET /api/cobrancas/[id]
 * Retorna detalhes completos de uma cobrança específica
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da cobrança é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar cobrança com relações necessárias
    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            aluno: true,
            plano: true,
            turma: {
              include: {
                sala: true,
                modalidade: true,
              },
            },
          },
        },
        pagamentos: {
          orderBy: { createdAt: 'desc' },
        },
        logsFinanceiros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Últimos 50 logs
        },
      },
    });

    if (!cobranca) {
      return NextResponse.json(
        { success: false, error: 'Cobrança não encontrada' },
        { status: 404 },
      );
    }

    // Calcular se está atrasado (comparação date-only para evitar fuso)
    const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const hoje = toDateOnly(new Date());
    const vencimento = toDateOnly(new Date(cobranca.vencimento));
    const atrasado = cobranca.status !== 'PAGO' && cobranca.status !== 'CANCELADO' && vencimento < hoje;

    // Buscar informações adicionais do Asaas se houver asaasPaymentId
    let asaasData = null;
    if (isAsaasEnabled() && cobranca.asaasPaymentId) {
      const contaId = cobranca.matricula?.aluno?.contaId;
      try {
        const opts = contaId ? { contaId } : undefined;
        asaasData = await getPayment(cobranca.asaasPaymentId, opts);
      } catch (error) {
        if (error instanceof AsaasEnvError) {
          console.warn('[GET /api/cobrancas/[id]] Integração Asaas indisponível:', error.message);
        } else {
          console.error('[GET /api/cobrancas/[id]] Erro ao buscar dados do Asaas:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...cobranca,
        atrasado,
        asaasData,
      },
    });
  } catch (error) {
    console.error('[GET /api/cobrancas/[id]] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar detalhes da cobrança',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/cobrancas/[id]
 * Atualiza dados de uma cobrança (valor, vencimento, juros, multa, desconto)
 * Apenas permite edição se status for PENDENTE ou A_VENCER
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da cobrança é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar cobrança atual
    const cobrancaAtual = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    if (!cobrancaAtual) {
      return NextResponse.json(
        { success: false, error: 'Cobrança não encontrada' },
        { status: 404 },
      );
    }

    // Validar se pode editar
    const statusEditaveis = ['PENDENTE', 'A_VENCER'];
    if (!statusEditaveis.includes(cobrancaAtual.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível editar cobrança com status ${cobrancaAtual.status}`,
        },
        { status: 400 },
      );
    }

    // Extrair campos editáveis
    const {
      valor,
      vencimento,
      descricao,
      formaPagamento, // não é atualizado por esta rota; existe rota dedicada
      // Campos detalhados de juros
      jurosPercentual,
      jurosValorFixo,
      juros,
      // Campos detalhados de multa
      multaTipo,
      multaPercentual,
      multaValorFixo,
      multa,
      // Campos detalhados de desconto
      descontoTipo,
      descontoPercentual,
      descontoValorFixo,
      descontoPrazoMaximo,
      desconto,
      // Valor final
      valorFinal,
    } = body;

    // Bloquear atualização de formaPagamento por esta rota para manter regras/auditoria
    if (typeof formaPagamento !== 'undefined') {
      return NextResponse.json(
        {
          success: false,
          error: 'Use /api/cobrancas/[id]/forma-pagamento para alterar a forma de pagamento.',
        },
        { status: 400 },
      );
    }

    const parseDateOnly = (value: string | Date) => {
      if (value instanceof Date) return value;
      // Espera YYYY-MM-DD – cria data estável sem shift de fuso
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T12:00:00Z`);
      }
      const d = new Date(value);
      return d;
    };

    const normalizeTipo = (tipo?: string | null) => {
      if (!tipo) {
        return undefined;
      }

      const upper = tipo.toUpperCase();

      if (upper === 'FIXO' || upper === 'VALOR_FIXO') {
        return 'VALOR_FIXO';
      }

      if (upper === 'PERCENTUAL' || upper === 'PERCENTAGE') {
        return 'PERCENTUAL';
      }

      return upper;
    };

    const normalizedMultaTipo = normalizeTipo(multaTipo);
    const normalizedDescontoTipo = normalizeTipo(descontoTipo);

    // Validações básicas de domínio
    const isNeg = (n: unknown) => typeof n === 'number' && n < 0;
    if (typeof valor !== 'undefined' && isNeg(Number(valor))) {
      return NextResponse.json(
        { success: false, error: 'Valor não pode ser negativo' },
        { status: 400 },
      );
    }
    const percentInRange = (v: unknown) =>
      typeof v === 'number' && v >= 0 && v <= 100;
    if (typeof jurosPercentual !== 'undefined' && !percentInRange(Number(jurosPercentual))) {
      return NextResponse.json(
        { success: false, error: 'Juros percentual deve estar entre 0 e 100' },
        { status: 400 },
      );
    }
    if (typeof multaPercentual !== 'undefined' && !percentInRange(Number(multaPercentual))) {
      return NextResponse.json(
        { success: false, error: 'Multa percentual deve estar entre 0 e 100' },
        { status: 400 },
      );
    }
    if (
      typeof descontoPercentual !== 'undefined' &&
      !percentInRange(Number(descontoPercentual))
    ) {
      return NextResponse.json(
        { success: false, error: 'Desconto percentual deve estar entre 0 e 100' },
        { status: 400 },
      );
    }
    if (
      isNeg(Number(jurosValorFixo)) ||
      isNeg(Number(multaValorFixo)) ||
      isNeg(Number(descontoValorFixo))
    ) {
      return NextResponse.json(
        { success: false, error: 'Valores fixos não podem ser negativos' },
        { status: 400 },
      );
    }

    // Atualizar cobrança
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: { id },
      data: {
        ...(valor !== undefined && { valor }),
        ...(vencimento !== undefined && { vencimento: parseDateOnly(vencimento) }),
        ...(descricao !== undefined && { descricao }),
        // Atualizar campos de juros
        ...(jurosPercentual !== undefined && { jurosPercentual }),
        ...(jurosValorFixo !== undefined && { jurosValorFixo }),
        ...(juros !== undefined && { juros }),
        // Atualizar campos de multa
        ...(normalizedMultaTipo !== undefined && { multaTipo: normalizedMultaTipo }),
        ...(multaPercentual !== undefined && { multaPercentual }),
        ...(multaValorFixo !== undefined && { multaValorFixo }),
        ...(multa !== undefined && { multa }),
        // Atualizar campos de desconto
        ...(normalizedDescontoTipo !== undefined && { descontoTipo: normalizedDescontoTipo }),
        ...(descontoPercentual !== undefined && { descontoPercentual }),
        ...(descontoValorFixo !== undefined && { descontoValorFixo }),
        ...(descontoPrazoMaximo !== undefined && { descontoPrazoMaximo }),
        ...(desconto !== undefined && { desconto }),
        // Valor final
        ...(valorFinal !== undefined && { valorFinal }),
      },
      include: {
        matricula: {
          include: {
            aluno: true,
          },
        },
      },
    });

    // Se tiver asaasPaymentId, atualizar no Asaas também
    if (isAsaasEnabled() && cobrancaAtualizada.asaasPaymentId) {
      const contaId = cobrancaAtualizada.matricula?.aluno?.contaId;
      try {
        const updatePayload: Partial<CreatePaymentInput> = {};

        if (valor !== undefined) {
          updatePayload.value = Number(valor);
        }

        if (vencimento !== undefined) {
          // Garantir formato YYYY-MM-DD para Asaas
          let dueDate: string;
          if (typeof vencimento === 'string') {
            dueDate = vencimento.includes('T') ? vencimento.split('T')[0] : vencimento;
          } else {
            dueDate = new Date(vencimento).toISOString().slice(0, 10);
          }
          updatePayload.dueDate = dueDate;
        }

        if (descricao !== undefined) {
          updatePayload.description = descricao;
        }

        // Juros: Asaas aceita percentual ao mês. Não enviar valores fixos.
        if (jurosPercentual !== undefined && Number(jurosPercentual) > 0) {
          updatePayload.interest = { value: Number(jurosPercentual) };
        }

        // Multa: Asaas aceita percentual. Não enviar valores fixos.
        if (multaPercentual !== undefined && Number(multaPercentual) > 0) {
          updatePayload.fine = { value: Number(multaPercentual) };
        }

        // Desconto: prioriza campos detalhados, senão usa campo simples
        // Calcular dueDateLimitDays a partir de descontoPrazoMaximo
        let dueDateLimitDays = 0;
        if (descontoPrazoMaximo) {
          if (descontoPrazoMaximo === 'ATE_VENCIMENTO') {
            dueDateLimitDays = 0;
          } else {
            const match = String(descontoPrazoMaximo).match(/(\d+)_DIAS/);
            dueDateLimitDays = match ? parseInt(match[1]) : 0;
          }
        }

        if (descontoPercentual !== undefined && Number(descontoPercentual) > 0) {
          updatePayload.discount = {
            value: Number(descontoPercentual),
            type: 'PERCENTAGE',
            dueDateLimitDays,
          };
        } else if (descontoValorFixo !== undefined && Number(descontoValorFixo) > 0) {
          updatePayload.discount = {
            value: Number(descontoValorFixo),
            type: 'FIXED',
            dueDateLimitDays,
          };
        } else if (desconto !== undefined && Number(desconto) > 0) {
          const descontoType: 'FIXED' | 'PERCENTAGE' =
            normalizedDescontoTipo === 'VALOR_FIXO'
              ? 'FIXED'
              : normalizedDescontoTipo === 'PERCENTUAL'
                ? 'PERCENTAGE'
                : 'PERCENTAGE';

          updatePayload.discount = {
            value: Number(desconto),
            type: descontoType,
            dueDateLimitDays,
          };
        }

        if (Object.keys(updatePayload).length > 0) {
          const opts = contaId ? { contaId } : undefined;
          await updatePayment(cobrancaAtualizada.asaasPaymentId, updatePayload, opts);
        }
      } catch (error) {
        if (error instanceof AsaasEnvError) {
          console.warn('[PUT /api/cobrancas/[id]] Integração Asaas indisponível:', error.message);
        } else {
          console.error('[PUT /api/cobrancas/[id]] Erro ao atualizar no Asaas:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: cobrancaAtualizada,
      message: 'Cobrança atualizada com sucesso',
    });
  } catch (error) {
    console.error('[PUT /api/cobrancas/[id]] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar cobrança',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/cobrancas/[id]
 * Remove uma cobrança (apenas se status for PENDENTE)
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da cobrança é obrigatório' },
        { status: 400 },
      );
    }

    // Buscar cobrança
    const cobranca = await prisma.cobranca.findUnique({
      where: { id },
      include: {
        matricula: {
          include: {
            aluno: {
              select: { contaId: true },
            },
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

    // Validar se pode remover (apenas PENDENTE ou A_VENCER)
    const statusRemoveveis = ['PENDENTE', 'A_VENCER'];
    if (!statusRemoveveis.includes(cobranca.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível remover cobrança com status ${cobranca.status}. Apenas cobranças PENDENTES ou A_VENCER podem ser removidas.`,
        },
        { status: 400 },
      );
    }

    // Se tiver asaasPaymentId, deletar no Asaas também
    if (isAsaasEnabled() && cobranca.asaasPaymentId) {
      const contaId = cobranca.matricula?.aluno?.contaId;
      try {
        const opts = contaId ? { contaId } : undefined;
        await deletePayment(cobranca.asaasPaymentId, opts);
      } catch (error) {
        if (error instanceof AsaasEnvError) {
          console.warn(
            '[DELETE /api/cobrancas/[id]] Integração Asaas indisponível:',
            error.message,
          );
        } else {
          console.error('[DELETE /api/cobrancas/[id]] Erro ao deletar no Asaas:', error);
        }
      }
    }

    // Deletar cobrança
    await prisma.cobranca.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cobrança removida com sucesso',
    });
  } catch (error) {
    console.error('[DELETE /api/cobrancas/[id]] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao remover cobrança',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
