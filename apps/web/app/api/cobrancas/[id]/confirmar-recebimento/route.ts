/**
 * API Route: Confirmar Recebimento Manual de Cobrança
 *
 * POST /api/cobrancas/[id]/confirmar-recebimento
 *
 * Permite que um gestor confirme manualmente o recebimento de uma cobrança
 * (pagamento em dinheiro, transferência, Pix externo, etc.) e sincroniza
 * com o Asaas se a cobrança tiver asaasPaymentId.
 *
 * Fluxo:
 * 1. Valida autenticação e permissões (ADMIN, FINANCEIRO)
 * 2. Busca cobrança no banco
 * 3. Valida se pode dar baixa (status PENDENTE)
 * 4. Se tem asaasPaymentId, chama API Asaas (POST /payments/{id}/receiveInCash)
 * 5. Atualiza status local para PAGO
 * 6. Registra log de auditoria
 * 7. Atualiza status financeiro da matrícula
 * 8. Retorna 200 OK
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { StatusCobranca, StatusFinanceiro, FormaPagamento } from '@prisma/client';
import { AsaasEnvError, confirmCashPayment, isAsaasEnabled, getCurrentBrasiliaDate } from '@alusa/lib/asaas';

const allowedRoles = new Set(['ADMIN', 'FINANCEIRO']);

interface ConfirmarRecebimentoBody {
  dataPagamento?: string; // ISO date string
  formaPagamentoManual?: 'DINHEIRO' | 'PIX' | 'TRANSFERENCIA'; // Forma de pagamento manual
  observacao?: string;
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: code, message }, { status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: cobrancaId } = await params;

    // Parse do body
    const body = (await req.json().catch(() => null)) as ConfirmarRecebimentoBody | null;
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'PAYLOAD_INVALIDO', 'Payload inválido');
    }

    // Autenticação e autorização
    const session = await getServerSession(authOptions).catch(() => null);
    const user = (session as { user?: { id: string; role?: string } } | null)?.user ?? null;

    if (!user?.id) {
      return jsonError(403, 'NAO_AUTENTICADO', 'Usuário não autenticado');
    }
    if (!user.role || !allowedRoles.has(String(user.role).toUpperCase())) {
      return jsonError(
        403,
        'PERMISSAO_NEGADA',
        `Usuário com papel "${user.role}" não tem permissão para confirmar recebimentos.`,
      );
    }

    // Buscar cobrança
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: cobrancaId },
      include: {
        matricula: {
          include: {
            aluno: { select: { id: true, nome: true, contaId: true } },
          },
        },
      },
    });

    if (!cobranca) {
      return jsonError(404, 'COBRANCA_NAO_ENCONTRADA', 'Cobrança não encontrada');
    }

    // Validar se pode dar baixa
    if (cobranca.status !== StatusCobranca.PENDENTE) {
      return jsonError(
        400,
        'STATUS_INVALIDO',
        `Cobrança com status "${cobranca.status}" não pode receber baixa manual. Apenas cobranças pendentes podem ser confirmadas.`,
      );
    }

    // ✅ Obter data atual no timezone de Brasília (timezone-safe)
    const brasiliaDate = getCurrentBrasiliaDate();
    
    const dataPagamentoStr = body.dataPagamento || brasiliaDate.dateStr;
    const dataPagamentoDate = body.dataPagamento 
      ? new Date(body.dataPagamento + 'T12:00:00.000Z')
      : brasiliaDate.dateObj;
    const formaPagamentoManual = body.formaPagamentoManual ?? 'DINHEIRO';
    const observacao = body.observacao ?? 'Confirmação manual de recebimento';

    console.log('[Confirmar Recebimento] Dados recebidos:', {
      cobrancaId,
      dataPagamentoStr,
      dataPagamentoDate,
      formaPagamentoManual,
      brasiliaCurrentDate: brasiliaDate.dateStr,
      brasiliaDateComponents: { year: brasiliaDate.year, month: brasiliaDate.month, day: brasiliaDate.day },
    });

    // Se tem asaasPaymentId, sincronizar com Asaas
    let asaasSynced = false;
    if (isAsaasEnabled() && cobranca.asaasPaymentId) {
      const contaId = cobranca.matricula.aluno.contaId;
      try {
        console.log('[Confirmar Recebimento] Enviando para Asaas:', {
          paymentId: cobranca.asaasPaymentId,
          paymentDate: dataPagamentoStr, // ← String direta, sem conversão!
          value: Number(cobranca.valor),
        });

        await confirmCashPayment(
          cobranca.asaasPaymentId,
          dataPagamentoStr, // ✅ Usar string direta, sem conversão Date!
          Number(cobranca.valor),
          contaId ? { contaId } : undefined,
        );

        console.log('[Confirmar Recebimento] Resposta Asaas: pagamento confirmado');
        asaasSynced = true;
      } catch (error) {
        if (error instanceof AsaasEnvError) {
          console.warn('[Confirmar Recebimento] Integração Asaas indisponível:', error.message);
        } else {
          console.error('[Confirmar Recebimento] Erro ao chamar API Asaas:', error);
        }
        // Não bloqueia a baixa local se Asaas falhar
      }
    }

    // Atualizar cobrança local
    const cobrancaAtualizada = await prisma.cobranca.update({
      where: { id: cobrancaId },
      data: {
        status: StatusCobranca.PAGO,
        dataPagamento: dataPagamentoDate, // ✅ Usar Date para o banco
        formaPagamento:
          formaPagamentoManual === 'DINHEIRO'
            ? FormaPagamento.INDEFINIDO // Dinheiro não é suportado, usar INDEFINIDO
            : formaPagamentoManual === 'PIX'
              ? FormaPagamento.PIX
              : FormaPagamento.INDEFINIDO, // Transferência também vira INDEFINIDO
      },
    });

    // Registrar log de auditoria
    await prisma.matriculaLog.create({
      data: {
        matriculaId: cobranca.matriculaId,
        action: 'COBRANCA_CONFIRMADA_MANUALMENTE',
        actorId: user.id,
        metadata: {
          cobrancaId: cobranca.id,
          valor: Number(cobranca.valor),
          dataPagamento: dataPagamentoDate.toISOString(), // ✅ Usar Date para ISO string
          dataPagamentoStr, // ✅ Também guardar string original
          formaPagamentoManual,
          observacao,
          asaasSynced,
          asaasPaymentId: cobranca.asaasPaymentId ?? null,
          confirmedBy: user.id,
          confirmedByRole: user.role,
        },
      },
    });

    // Verificar se todas as cobranças da matrícula estão pagas
    const cobrancasPendentes = await prisma.cobranca.count({
      where: {
        matriculaId: cobranca.matriculaId,
        status: StatusCobranca.PENDENTE,
      },
    });

    // Se não há mais cobranças pendentes, atualizar status financeiro da matrícula
    if (cobrancasPendentes === 0) {
      await prisma.matricula.update({
        where: { id: cobranca.matriculaId },
        data: { statusFinanceiro: StatusFinanceiro.ADIMPLENTE },
      });

      await prisma.matriculaLog.create({
        data: {
          matriculaId: cobranca.matriculaId,
          action: 'STATUS_FINANCEIRO_ATUALIZADO',
          actorId: 'system',
          metadata: {
            statusAnterior: cobranca.matricula.statusFinanceiro,
            statusNovo: StatusFinanceiro.ADIMPLENTE,
            motivo: 'Todas as cobranças foram pagas',
          },
        },
      });
    }

    console.log('[Confirmar Recebimento] Baixa manual confirmada com sucesso:', {
      cobrancaId,
      asaasSynced,
      matriculaId: cobranca.matriculaId,
      statusFinanceiro: cobrancasPendentes === 0 ? 'ADIMPLENTE' : 'Ainda há cobranças pendentes',
    });

    return NextResponse.json({
      success: true,
      cobranca: {
        id: cobrancaAtualizada.id,
        status: cobrancaAtualizada.status,
        dataPagamento: cobrancaAtualizada.dataPagamento,
        formaPagamento: cobrancaAtualizada.formaPagamento,
      },
      asaasSynced,
      message: asaasSynced
        ? 'Recebimento confirmado e sincronizado com Asaas'
        : 'Recebimento confirmado (sincronização com Asaas não disponível)',
    });
  } catch (error) {
    console.error('[Confirmar Recebimento] Erro:', error);
    return jsonError(500, 'ERRO_INTERNO', (error as Error).message);
  }
}
