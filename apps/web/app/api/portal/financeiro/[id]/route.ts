import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getPayment, isAsaasEnabled, AsaasEnvError, type AsaasPayment } from '@alusa/lib/asaas';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string; contaId: string };
    
    // 2. Autorização: apenas aluno/responsável
    if (user.role !== 'ALUNO' && user.role !== 'RESPONSAVEL') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 3. Buscar cobrança com todos os detalhes
    const cobranca = await prisma.cobranca.findUnique({
      where: { id: params.id },
      include: {
        matricula: {
          include: {
            aluno: {
              select: { 
                id: true,
                usuarioId: true,
                nome: true,
                cpf: true,
                email: true,
                telefone: true,
              }
            },
            turma: {
              include: {
                modalidade: {
                  select: {
                    nome: true,
                  }
                }
              }
            },
            responsavelFinanceiro: {
              select: {
                id: true,
                asaasCreditCardToken: true,
                creditCardBrand: true,
                creditCardLast4: true,
                creditCardExpiryMonth: true,
                creditCardExpiryYear: true,
              }
            }
          }
        },
        pagamentos: {
          orderBy: {
            dataPagamento: 'desc'
          }
        }
      }
    });

    if (!cobranca) {
      return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    }

    // 4. Verificar se usuário tem acesso a esta cobrança
    let hasAccess = false;
    
    if (user.role === 'ALUNO') {
      // Aluno só pode acessar suas próprias cobranças
      hasAccess = cobranca.matricula.aluno.usuarioId === user.id;
    } else if (user.role === 'RESPONSAVEL') {
      // Responsável pode acessar cobranças dos seus alunos
      const responsavel = await prisma.responsavel.findFirst({
        where: {
          usuarioId: user.id,
          alunos: {
            some: {
              alunoId: cobranca.matricula.aluno.id
            }
          }
        }
      });
      hasAccess = !!responsavel;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a esta cobrança' }, { status: 403 });
    }

    // 5. Sincronizar com Asaas para obter links atualizados
    let asaasData: AsaasPayment | null = null;
    if (isAsaasEnabled() && cobranca.asaasPaymentId) {
      try {
        const opts = user.contaId ? { contaId: user.contaId } : undefined;
        asaasData = await getPayment(cobranca.asaasPaymentId, opts);
      } catch (asaasError) {
        if (asaasError instanceof AsaasEnvError) {
          console.warn('[Portal Financeiro] Integração Asaas indisponível:', asaasError.message);
        } else {
          console.error('[Portal Financeiro] Erro ao consultar Asaas:', asaasError);
        }
      }
    }

    const invoiceUrl = asaasData?.invoiceUrl ?? null;
    const transactionReceiptUrl = asaasData?.transactionReceiptUrl ?? null;

    // 6. Formatar e retornar
    const response = {
      id: cobranca.id,
      tipo: cobranca.tipo,
      valor: Number(cobranca.valor),
      vencimento: cobranca.vencimento.toISOString(),
      status: cobranca.status,
      formaPagamento: cobranca.formaPagamento,
      asaasId: cobranca.asaasId,
      asaasPaymentId: cobranca.asaasPaymentId,
      invoiceUrl,
      transactionReceiptUrl,
      descricao: cobranca.descricao,
      valorJuros: cobranca.juros ? Number(cobranca.juros) : null,
      valorMulta: cobranca.multa ? Number(cobranca.multa) : null,
      valorDesconto: cobranca.desconto ? Number(cobranca.desconto) : null,
      asaasData,
      matricula: {
        aluno: {
          nome: cobranca.matricula.aluno.nome,
          cpf: cobranca.matricula.aluno.cpf,
          email: cobranca.matricula.aluno.email,
          telefone: cobranca.matricula.aluno.telefone,
        },
        turma: cobranca.matricula.turma
          ? {
              nome: cobranca.matricula.turma.nome,
              modalidade: {
                nome: cobranca.matricula.turma.modalidade.nome,
              },
            }
          : null,
        responsavelFinanceiro: cobranca.matricula.responsavelFinanceiro ? {
          asaasCreditCardToken: cobranca.matricula.responsavelFinanceiro.asaasCreditCardToken,
          creditCardBrand: cobranca.matricula.responsavelFinanceiro.creditCardBrand,
          creditCardLast4: cobranca.matricula.responsavelFinanceiro.creditCardLast4,
          creditCardExpiryMonth: cobranca.matricula.responsavelFinanceiro.creditCardExpiryMonth,
          creditCardExpiryYear: cobranca.matricula.responsavelFinanceiro.creditCardExpiryYear,
        } : null,
      },
      pagamentos: cobranca.pagamentos.map(p => ({
        id: p.id,
        dataPagamento: p.dataPagamento ? p.dataPagamento.toISOString() : null,
        valorPago: Number(p.valorPago),
        status: p.status,
        formaPagamento: p.formaPagamento,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar cobrança:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cobrança' }, 
      { status: 500 }
    );
  }
}

