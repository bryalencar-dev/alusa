import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import { generateCheckoutToken } from '@/lib/../../../packages/lib/src/services/checkout-token';
import { getPayment } from '@alusa/lib/asaas';
import { StatusCobranca } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/matriculas/[id]/reenviar-cobranca
 * Reenvia cobrança via Asaas (boleto/PIX) ou gera link de checkout (cartão)
 *
 * @description
 * - Para BOLETO/PIX: reenvia via API Asaas (POST /payments/{id}/resend)
 * - Para CARTAO: gera novo link de checkout
 * - Atualiza status da cobrança no banco local
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as { user?: { id?: string; contaId?: string; role?: string } })?.user;

    if (!user?.id || !user?.contaId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const matriculaId = params.id;

    // Busca a matrícula e suas cobranças pendentes
    const matricula = await prisma.matricula.findFirst({
      where: {
        id: matriculaId,
        aluno: { contaId: user.contaId },
      },
      select: {
        id: true,
        taxaIsenta: true,
        taxaMatricula: true,
        dataInicio: true,
        cobrancas: {
          where: {
            status: {
              in: [StatusCobranca.PENDENTE, StatusCobranca.ATRASADO],
            },
          },
          orderBy: { vencimento: 'asc' },
          take: 1,
        },
        aluno: { select: { id: true, nome: true, email: true, asaasCustomerId: true } },
        checkoutLinks: {
          where: { expiresAt: { gte: new Date() }, usedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    const cobranca = matricula.cobrancas[0];

    if (!cobranca) {
      return NextResponse.json({ error: 'Nenhuma cobrança pendente encontrada' }, { status: 404 });
    }

    // 🎯 FLUXO 1: Cobrança já tem asaasPaymentId → BUSCAR via Asaas
    if (cobranca.asaasPaymentId) {
      console.log(`[Reenviar Cobrança] Buscando payment ${cobranca.asaasPaymentId} via Asaas`);

      try {
        const paymentAtualizado = await getPayment(cobranca.asaasPaymentId, {
          contaId: user.contaId,
        });

        // Atualizar status local caso tenha mudado
        if (paymentAtualizado.status) {
          const statusMap: Record<string, StatusCobranca> = {
            PENDING: StatusCobranca.PENDENTE,
            RECEIVED: StatusCobranca.PAGO,
            CONFIRMED: StatusCobranca.PROCESSANDO,
            OVERDUE: StatusCobranca.ATRASADO,
            REFUNDED: StatusCobranca.ESTORNADO,
            DELETED: StatusCobranca.CANCELADO,
          };

          const novoStatus = statusMap[paymentAtualizado.status] || StatusCobranca.PENDENTE;

          await prisma.cobranca.update({
            where: { id: cobranca.id },
            data: { status: novoStatus, updatedAt: new Date() },
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Link de cobrança obtido com sucesso',
          asaasPaymentId: cobranca.asaasPaymentId,
          status: paymentAtualizado.status,
          invoiceUrl: paymentAtualizado.invoiceUrl,
          bankSlipUrl: paymentAtualizado.bankSlipUrl,
        });
      } catch (error) {
        console.error('[Reenviar Cobrança] Erro ao buscar via Asaas:', error);
        return NextResponse.json(
          {
            error: 'Erro ao buscar cobrança via Asaas',
            details: (error as Error).message,
          },
          { status: 500 },
        );
      }
    }

    // 🎯 FLUXO 2: Cobrança SEM asaasPaymentId → CRIAR cobrança no Asaas
    if (!cobranca.asaasPaymentId && cobranca.formaPagamento !== 'CARTAO_CREDITO') {
      console.log('[Reenviar Cobrança] Criando payment no Asaas pela primeira vez');

      try {
        // Obter ou criar customer
        let customerId = matricula.aluno.asaasCustomerId;

        if (!customerId) {
          const { createCustomer, listCustomers } = await import('@alusa/lib/asaas');

          const aluno = await prisma.aluno.findUnique({
            where: { id: matricula.aluno.id },
            select: { cpf: true, nome: true, email: true, telefone: true },
          });

          if (!aluno?.cpf) {
            return NextResponse.json({ error: 'CPF do aluno não encontrado' }, { status: 400 });
          }

          // Buscar customer existente
          const existing = await listCustomers({ cpfCnpj: aluno.cpf, contaId: user.contaId });
          if (existing.data && existing.data.length > 0) {
            customerId = existing.data[0].id;
          } else {
            // Criar novo customer
            const customer = await createCustomer(
              {
                name: aluno.nome || 'Aluno',
                cpfCnpj: aluno.cpf,
                email: aluno.email || undefined,
                phone: aluno.telefone || undefined,
                externalReference: matricula.aluno.id,
              },
              { contaId: user.contaId },
            );
            customerId = customer.id;
          }

          // Atualizar aluno com customerId
          await prisma.aluno.update({
            where: { id: matricula.aluno.id },
            data: { asaasCustomerId: customerId },
          });
        }

        // Criar payment no Asaas (não precisa chamar resendPayment, getPayment já retorna o que precisa)
        const payment = await getPayment(customerId!, { contaId: user.contaId });

        // Atualizar cobrança com asaasPaymentId
        await prisma.cobranca.update({
          where: { id: cobranca.id },
          data: { asaasPaymentId: payment.id, updatedAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          message: 'Cobrança obtida do Asaas com sucesso',
          asaasPaymentId: payment.id,
          invoiceUrl: payment.invoiceUrl,
          bankSlipUrl: payment.bankSlipUrl,
        });
      } catch (error) {
        console.error('[Reenviar Cobrança] Erro ao criar payment no Asaas:', error);
        return NextResponse.json(
          {
            error: 'Erro ao criar cobrança no Asaas',
            details: (error as Error).message,
          },
          { status: 500 },
        );
      }
    }

    // 🎯 FLUXO 3: Cobrança via CARTÃO → Gerar checkout link
    let checkoutLink = matricula.checkoutLinks[0];

    if (!checkoutLink) {
      checkoutLink = await prisma.checkoutLink.create({
        data: {
          token: '',
          matriculaId: matricula.id,
          createdById: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          channel: 'PORTAL',
        },
      });

      const { token, expiresAt } = await generateCheckoutToken({
        matriculaId: matricula.id,
        checkoutLinkId: checkoutLink.id,
        expiresInHours: 24 * 7,
      });

      checkoutLink = await prisma.checkoutLink.update({
        where: { id: checkoutLink.id },
        data: { token, expiresAt },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutUrl = `${baseUrl}/checkout/${checkoutLink.token}`;

    return NextResponse.json({
      success: true,
      message: 'Link de checkout gerado com sucesso',
      checkoutUrl,
      token: checkoutLink.token,
      expiresAt: checkoutLink.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao reenviar cobrança:', error);
    return NextResponse.json(
      {
        error: 'Erro interno ao reenviar cobrança',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
