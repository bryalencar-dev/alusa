/**
 * API: Processar Checkout com Cartão de Crédito
 *
 * POST /api/checkout/[token]/process
 *
 * Processa o pagamento via cartão de crédito usando Asaas:
 * 1. Valida o token do checkout
 * 2. Busca ou cria customer no Asaas
 * 3. Tokeniza o cartão via Asaas
 * 4. Cria/atualiza a cobrança com o token do cartão
 * 5. Processa o pagamento
 * 6. Atualiza status no banco
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCheckoutToken } from '@/lib/../../../packages/lib/src/services/checkout-token';
import { prisma } from '@/lib/prisma';
import { getAsaasClientForConta } from '@alusa/lib';
import { formatDate } from '@alusa/lib/asaas';
import type { TipoCobranca } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Schema de validação do cartão
const cardDataSchema = z.object({
  holderName: z.string().min(3, 'Nome do titular é obrigatório'),
  number: z.string().regex(/^\d{13,19}$/, 'Número do cartão inválido'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inválido'),
  expiryYear: z.string().regex(/^\d{2}$/, 'Ano inválido'),
  ccv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
});

type CardData = z.infer<typeof cardDataSchema>;

interface ProcessCheckoutRequest {
  cardData: CardData;
}

export async function POST(
  req: NextRequest,
  context: { params: { token: string } },
): Promise<NextResponse> {
  try {
    const { token } = context.params;

    // 1. Validar token JWT
    let tokenPayload;
    try {
      tokenPayload = await validateCheckoutToken(token);
    } catch (err) {
      const error = err as Error;
      console.error('[Checkout Process] Token inválido:', error.message);
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
    }

    const { matriculaId, checkoutLinkId } = tokenPayload;

    // 2. Validar dados do cartão
    const body: ProcessCheckoutRequest = await req.json();
    const cardData = cardDataSchema.parse(body.cardData);

    // 3. Buscar dados completos da matrícula
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      include: {
        aluno: {
          include: {
            responsaveis: {
              include: {
                responsavel: true,
              },
            },
            conta: true,
          },
        },
        responsavelFinanceiro: true, // Responsável financeiro da matrícula
        cobrancas: {
          where: {
            status: 'PENDENTE',
            tipo: { in: ['MENSALIDADE', 'TAXA_MATRICULA', 'AVULSA'] },
          },
          orderBy: [{ tipo: 'asc' }, { vencimento: 'asc' }],
          take: 1,
        },
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    if (!matricula.cobrancas.length) {
      return NextResponse.json({ error: 'Nenhuma cobrança pendente' }, { status: 400 });
    }

    const cobranca = matricula.cobrancas[0];
    const aluno = matricula.aluno;
    const contaId = aluno.contaId;

    // Calcular idade do aluno
    const hoje = new Date();
    const dataNasc = new Date(aluno.dataNasc);
    const idade = hoje.getFullYear() - dataNasc.getFullYear();
    const isMaiorDeIdade = idade >= 18;

    // Se aluno é maior de idade, usar dados do próprio aluno
    // Se é menor, usar responsável financeiro ou primeiro responsável
    const responsavel = isMaiorDeIdade
      ? null
      : matricula.responsavelFinanceiro || aluno.responsaveis[0]?.responsavel;

    // Dados da pessoa que vai pagar (aluno maior ou responsável de menor)
    const pagador = isMaiorDeIdade
      ? {
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf!,
          email: aluno.email!,
          telefone: aluno.telefone!,
          enderecoCep: aluno.enderecoCep,
          enderecoNumero: aluno.enderecoNumero,
          asaasCustomerId: aluno.asaasCustomerId,
          asaasCreditCardToken: null, // Aluno não tem campo para token de cartão
        }
      : responsavel!;

    // Validar se temos os dados necessários
    if (!pagador) {
      return NextResponse.json(
        {
          error: 'Aluno menor de idade sem responsável financeiro cadastrado',
        },
        { status: 400 },
      );
    }

    if (!pagador.cpf || !pagador.email || !pagador.telefone) {
      return NextResponse.json(
        {
          error: `${isMaiorDeIdade ? 'Aluno' : 'Responsável'} sem dados completos (CPF, email ou telefone)`,
        },
        { status: 400 },
      );
    }

    // 4. Buscar ou criar customer no Asaas
    const client = await getAsaasClientForConta(contaId);

    let customerId = pagador.asaasCustomerId;

    if (!customerId) {
      // Criar customer no Asaas
      const createCustomerResponse = await client.post('/customers', {
        name: pagador.nome,
        cpfCnpj: pagador.cpf,
        email: pagador.email,
        mobilePhone: pagador.telefone,
        notificationDisabled: false,
      });

      customerId = createCustomerResponse.data.id;

      // Atualizar no banco (aluno ou responsável)
      if (isMaiorDeIdade) {
        await prisma.aluno.update({
          where: { id: aluno.id },
          data: { asaasCustomerId: customerId },
        });
      } else {
        await prisma.responsavel.update({
          where: { id: pagador.id },
          data: { asaasCustomerId: customerId },
        });
      }
    }

    // 5. Tokenizar cartão no Asaas
    const tokenizeResponse = await client.post('/creditCard/tokenize', {
      customer: customerId,
      creditCard: {
        holderName: cardData.holderName,
        number: cardData.number,
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv,
      },
      creditCardHolderInfo: {
        name: pagador.nome,
        email: pagador.email,
        cpfCnpj: pagador.cpf,
        postalCode: pagador.enderecoCep || '00000000',
        addressNumber: pagador.enderecoNumero || 'S/N',
        phone: pagador.telefone,
      },
      remoteIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
    });

    const creditCardToken = tokenizeResponse.data.creditCardToken;

    if (!creditCardToken) {
      return NextResponse.json(
        { error: 'Falha ao tokenizar cartão. Verifique os dados e tente novamente.' },
        { status: 400 },
      );
    }

    // 6. Criar ou atualizar cobrança no Asaas
    let asaasPaymentId = cobranca.asaasPaymentId;

    if (!asaasPaymentId) {
      // Criar nova cobrança no Asaas
      const createPaymentResponse = await client.post('/payments', {
        customer: customerId,
        billingType: 'CREDIT_CARD',
        value: Number(cobranca.valor),
        dueDate: formatDate(cobranca.vencimento), // ✅ Usa formatDate (timezone-safe)
        description: getTipoCobrancaLabel(cobranca.tipo),
        externalReference: cobranca.id,
        creditCard: {
          holderName: cardData.holderName,
          number: cardData.number,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv,
        },
        creditCardHolderInfo: {
          name: pagador.nome,
          email: pagador.email,
          cpfCnpj: pagador.cpf,
          postalCode: pagador.enderecoCep || '00000000',
          addressNumber: pagador.enderecoNumero || 'S/N',
          phone: pagador.telefone,
        },
        creditCardToken,
        remoteIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      });

      asaasPaymentId = createPaymentResponse.data.id;

      // Atualizar cobrança no banco
      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: {
          asaasPaymentId,
          status: 'PROCESSANDO',
        },
      });
    } else {
      // Atualizar cobrança existente no Asaas com o token
      await client.post(`/payments/${asaasPaymentId}/payWithCreditCard`, {
        creditCard: {
          holderName: cardData.holderName,
          number: cardData.number,
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          ccv: cardData.ccv,
        },
        creditCardHolderInfo: {
          name: pagador.nome,
          email: pagador.email,
          cpfCnpj: pagador.cpf,
          postalCode: pagador.enderecoCep || '00000000',
          addressNumber: pagador.enderecoNumero || 'S/N',
          phone: pagador.telefone,
        },
        creditCardToken,
        remoteIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      });

      await prisma.cobranca.update({
        where: { id: cobranca.id },
        data: { status: 'PROCESSANDO' },
      });
    }

    // 7. Marcar checkout link como usado
    await prisma.checkoutLink.update({
      where: { id: checkoutLinkId },
      data: { usedAt: new Date() },
    });

    // 8. Salvar token do cartão para futuras cobranças (se mensalidade)
    // Apenas responsáveis têm campo para token (alunos maiores não usam débito automático)
    if (cobranca.tipo === 'MENSALIDADE' && !isMaiorDeIdade && responsavel) {
      await prisma.responsavel.update({
        where: { id: responsavel.id },
        data: {
          asaasCreditCardToken: creditCardToken,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      paymentId: asaasPaymentId,
      cobrancaId: cobranca.id,
      matriculaId: matricula.id,
    });
  } catch (error) {
    console.error('[Checkout Process] Erro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Dados do cartão inválidos',
          details: error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar pagamento',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

function getTipoCobrancaLabel(tipo: TipoCobranca): string {
  switch (tipo) {
    case 'MENSALIDADE':
      return 'Mensalidade';
    case 'TAXA_MATRICULA':
      return 'Taxa de Matrícula';
    case 'AVULSA':
      return 'Cobrança Avulsa';
    default:
      return 'Cobrança';
  }
}
