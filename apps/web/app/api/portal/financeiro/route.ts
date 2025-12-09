import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string; contaId?: string };

    // 2. Autorização: Apenas ALUNO ou RESPONSAVEL
    if (user.role !== 'ALUNO' && user.role !== 'RESPONSAVEL') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const userId = user.id;
    const contaId = user.contaId;

    if (!userId || !contaId) {
      return NextResponse.json({ error: 'Dados de usuário incompletos' }, { status: 400 });
    }

    // 3. Buscar IDs dos alunos baseado no tipo de usuário
    let alunoIds: string[] = [];

    if (user.role === 'ALUNO') {
      const aluno = await prisma.aluno.findFirst({
        where: {
          usuario: { id: userId },
          contaId,
        },
        select: { id: true },
      });

      if (aluno) {
        alunoIds = [aluno.id];
      }
    } else if (user.role === 'RESPONSAVEL') {
      const responsavel = await prisma.responsavel.findFirst({
        where: {
          usuarioId: userId,
        },
        include: {
          alunos: {
            include: {
              aluno: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (responsavel && responsavel.alunos.length > 0) {
        alunoIds = responsavel.alunos.map((ar) => ar.aluno.id);
      }
    }

    // 4. Buscar cobranças dos alunos
    const cobrancas = await prisma.cobranca.findMany({
      where: {
        matricula: {
          alunoId: { in: alunoIds },
        },
      },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                nome: true,
              },
            },
            turma: {
              select: {
                nome: true,
                modalidade: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
            responsavelFinanceiro: {
              select: {
                asaasCreditCardToken: true,
                creditCardBrand: true,
                creditCardLast4: true,
              }
            },
          },
        },
        pagamentos: {
          select: {
            id: true,
            dataPagamento: true,
            valorPago: true,
            status: true,
          },
          orderBy: {
            dataPagamento: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        vencimento: 'desc',
      },
    });

    // 5. Formatar dados e atualizar status de atrasadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const cobrancasFormatadas = cobrancas.map((c) => {
      const vencimento = new Date(c.vencimento);
      vencimento.setHours(0, 0, 0, 0);

      // Atualizar status se a cobrança está atrasada
      let status = c.status;
      if (status === 'PENDENTE' && vencimento < hoje) {
        status = 'ATRASADO';
      }

      return {
        id: c.id,
        valor: Number(c.valor),
        vencimento: c.vencimento.toISOString(),
        status,
        formaPagamento: c.formaPagamento,
        asaasId: c.asaasId,
        matricula: {
          aluno: {
            nome: c.matricula.aluno.nome,
          },
          turma: c.matricula.turma ? {
            nome: c.matricula.turma.nome,
            modalidade: {
              nome: c.matricula.turma.modalidade.nome,
            },
          } : null,
          responsavelFinanceiro: c.matricula.responsavelFinanceiro ? {
            asaasCreditCardToken: c.matricula.responsavelFinanceiro.asaasCreditCardToken,
            creditCardBrand: c.matricula.responsavelFinanceiro.creditCardBrand,
            creditCardLast4: c.matricula.responsavelFinanceiro.creditCardLast4,
          } : null,
        },
        pagamentos: c.pagamentos.map((p) => ({
          id: p.id,
          dataPagamento: p.dataPagamento ? p.dataPagamento.toISOString() : null,
          valorPago: Number(p.valorPago),
          status: p.status,
        })),
      };
    });

    // 6. Retornar dados
    return NextResponse.json({
      cobrancas: cobrancasFormatadas,
    });
  } catch (error) {
    console.error('Erro ao buscar cobranças:', error);
    return NextResponse.json({ error: 'Erro ao carregar cobranças' }, { status: 500 });
  }
}
