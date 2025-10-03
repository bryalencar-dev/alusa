/**
 * API Route: Validar Checkout Token e Buscar Dados da Matrícula
 *
 * GET /api/checkout/[token]
 *
 * Valida o token JWT e retorna:
 * - Dados da matrícula
 * - Dados do aluno
 * - Dados da cobrança (taxa de matrícula)
 * - Status do checkout link (expirado, usado, válido)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateCheckoutToken } from '@/lib/../../../packages/lib/src/services/checkout-token';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CheckoutData {
  checkoutLink: {
    id: string;
    token: string;
    expiresAt: string;
    usedAt: string | null;
    isExpired: boolean;
    isUsed: boolean;
  };
  matricula: {
    id: string;
    status: string;
    dataInicio: string | null;
    taxaMatricula: number;
    taxaStatus: string;
    taxaIsenta: boolean;
    createdAt: string;
  };
  aluno: {
    id: string;
    nome: string;
    dataNasc: string | null;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
  } | null;
  cobrancaTaxa: {
    id: string;
    valor: number;
    vencimento: string;
    status: string;
    formaPagamento: string;
  } | null;
}

export async function GET(
  _request: NextRequest,
  context: { params: { token: string } },
): Promise<NextResponse<CheckoutData | { error: string }>> {
  try {
    const { token } = context.params;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    // 1. Validar token JWT
    let tokenPayload;
    try {
      tokenPayload = await validateCheckoutToken(token);
    } catch (err) {
      const error = err as Error;
      console.error('[Checkout API] Token inválido:', error.message);
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const { matriculaId, checkoutLinkId } = tokenPayload;

    // 2. Buscar checkout link
    const checkoutLink = await prisma.checkoutLink.findUnique({
      where: { id: checkoutLinkId },
    });

    if (!checkoutLink) {
      return NextResponse.json({ error: 'Link de checkout não encontrado' }, { status: 404 });
    }

    // 3. Verificar se link está expirado ou já foi usado
    const now = new Date();
    const isExpired = checkoutLink.expiresAt < now;
    const isUsed = checkoutLink.usedAt !== null;

    // 4. Buscar dados da matrícula
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            dataNasc: true,
          },
        },
        plano: {
          select: {
            id: true,
            nome: true,
            valor: true,
          },
        },
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    // 5. Buscar cobrança de taxa de matrícula
    const cobrancaTaxa = await prisma.cobranca.findFirst({
      where: {
        matriculaId: matricula.id,
        tipo: { in: ['TAXA_MATRICULA', 'AVULSA'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 6. Montar resposta
    const response: CheckoutData = {
      checkoutLink: {
        id: checkoutLink.id,
        token: checkoutLink.token,
        expiresAt: checkoutLink.expiresAt.toISOString(),
        usedAt: checkoutLink.usedAt?.toISOString() ?? null,
        isExpired,
        isUsed,
      },
      matricula: {
        id: matricula.id,
        status: matricula.status,
        dataInicio: matricula.dataInicio?.toISOString() ?? null,
        taxaMatricula: Number(matricula.taxaMatricula),
        taxaStatus: matricula.taxaStatus,
        taxaIsenta: matricula.taxaIsenta,
        createdAt: matricula.createdAt.toISOString(),
      },
      aluno: {
        id: matricula.aluno.id,
        nome: matricula.aluno.nome,
        dataNasc: matricula.aluno.dataNasc?.toISOString() ?? null,
      },
      plano: matricula.plano
        ? {
            id: matricula.plano.id,
            nome: matricula.plano.nome,
            valor: Number(matricula.plano.valor),
          }
        : null,
      cobrancaTaxa: cobrancaTaxa
        ? {
            id: cobrancaTaxa.id,
            valor: Number(cobrancaTaxa.valor),
            vencimento: cobrancaTaxa.vencimento.toISOString(),
            status: cobrancaTaxa.status,
            formaPagamento: cobrancaTaxa.formaPagamento,
          }
        : null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Checkout API] Erro inesperado:', error);
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
