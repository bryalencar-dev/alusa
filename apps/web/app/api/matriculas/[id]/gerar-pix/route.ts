import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAsaasClientForConta } from '@alusa/lib';
import { formatDate } from '@alusa/lib/asaas';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.contaId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const matriculaId = params.id;

    // Buscar matrícula com cobrança de taxa
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
          },
        },
        responsavelFinanceiro: true,
        cobrancas: {
          where: {
            tipo: 'TAXA_MATRICULA',
            status: 'PENDENTE',
          },
        },
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    if (matricula.taxaIsenta) {
      return NextResponse.json({ error: 'Taxa de matrícula isenta' }, { status: 400 });
    }

    const taxaCobranca = matricula.cobrancas[0];

    if (!taxaCobranca) {
      return NextResponse.json({ error: 'Nenhuma cobrança pendente' }, { status: 400 });
    }

    const aluno = matricula.aluno;
    const contaId = aluno.contaId;

    // Calcular idade do aluno
    const hoje = new Date();
    const dataNasc = new Date(aluno.dataNasc);
    const idade = hoje.getFullYear() - dataNasc.getFullYear();
    const isMaiorDeIdade = idade >= 18;

    // Definir pagador
    const responsavel = isMaiorDeIdade
      ? null
      : matricula.responsavelFinanceiro || aluno.responsaveis[0]?.responsavel;

    const pagador = isMaiorDeIdade
      ? {
          id: aluno.id,
          nome: aluno.nome,
          cpf: aluno.cpf!,
          email: aluno.email!,
          telefone: aluno.telefone!,
          asaasCustomerId: aluno.asaasCustomerId,
        }
      : responsavel!;

    if (!pagador || !pagador.cpf || !pagador.email) {
      return NextResponse.json({ error: 'Dados do pagador incompletos' }, { status: 400 });
    }

    // Cliente Asaas
    const client = await getAsaasClientForConta(contaId);

    let customerId = pagador.asaasCustomerId;

    // Criar customer se não existir
    if (!customerId) {
      const createCustomerResponse = await client.post('/customers', {
        name: pagador.nome,
        cpfCnpj: pagador.cpf,
        email: pagador.email,
        mobilePhone: pagador.telefone,
        notificationDisabled: false,
      });

      customerId = createCustomerResponse.data.id;

      // Atualizar no banco
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

    // Verificar se já tem cobrança no Asaas
    let asaasPaymentId = taxaCobranca.asaasPaymentId;

    if (!asaasPaymentId) {
      // Criar cobrança no Asaas com PIX
      const createPaymentResponse = await client.post('/payments', {
        customer: customerId,
        billingType: 'PIX',
        value: Number(taxaCobranca.valor),
        dueDate: formatDate(taxaCobranca.vencimento), // ✅ Usa formatDate (timezone-safe)
        description: 'Taxa de Matrícula',
        externalReference: taxaCobranca.id,
      });

      asaasPaymentId = createPaymentResponse.data.id;

      // Atualizar cobrança no banco
      await prisma.cobranca.update({
        where: { id: taxaCobranca.id },
        data: {
          asaasPaymentId,
          formaPagamento: 'PIX',
        },
      });
    }

    // Buscar dados do PIX
    const pixResponse = await client.get(`/payments/${asaasPaymentId}/pixQrCode`);

    return NextResponse.json({
      success: true,
      pixId: asaasPaymentId,
      cobrancaId: taxaCobranca.id,
      matriculaId: matricula.id,
      qrCode: pixResponse.data.encodedImage,
      payload: pixResponse.data.payload,
      valor: Number(taxaCobranca.valor),
      vencimento: taxaCobranca.vencimento,
    });
  } catch (error) {
    console.error('[Gerar PIX] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PIX', details: (error as Error).message },
      { status: 500 },
    );
  }
}
