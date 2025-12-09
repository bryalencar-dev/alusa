import { NextRequest, NextResponse } from 'next/server';
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

    // 4. Buscar matrículas dos alunos
    const matriculas = await prisma.matricula.findMany({
      where: {
        alunoId: { in: alunoIds },
      },
      include: {
        aluno: {
          select: {
            nome: true,
            foto: true,
          },
        },
        turma: {
          select: {
            nome: true,
            diasSemana: true,
            horaInicio: true,
            horaFim: true,
            modalidade: {
              select: {
                nome: true,
              },
            },
          },
        },
        matriculaTurmas: {
          include: {
            turma: {
              select: {
                nome: true,
                diasSemana: true,
                horaInicio: true,
                horaFim: true,
                modalidade: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        plano: {
          select: {
            nome: true,
            valor: true,
            periodicidade: true,
          },
        },
        cobrancas: {
          where: {
            OR: [{ status: 'PENDENTE' }, { status: 'ATRASADO' }],
          },
          select: {
            id: true,
            status: true,
            valor: true,
          },
        },
      },
      orderBy: {
        dataInicio: 'desc',
      },
    });

    // 5. Formatar dados
    const matriculasFormatadas = matriculas.map((m) => {
      const turmaFallback = m.matriculaTurmas.find((mt) => mt.turma)?.turma;
      const turmaSelecionada = m.turma ?? turmaFallback ?? null;

      return {
        id: m.id,
        status: m.status,
        dataInicio: m.dataInicio.toISOString(),
        dataFimContrato: m.dataFimContrato.toISOString(),
        aluno: {
          nome: m.aluno.nome,
          foto: m.aluno.foto,
        },
        turma: turmaSelecionada
          ? {
              nome: turmaSelecionada.nome,
              modalidade: {
                nome: turmaSelecionada.modalidade?.nome,
              },
            }
          : null,
        diasSemana: turmaSelecionada?.diasSemana ?? null,
        horaInicio: turmaSelecionada?.horaInicio ?? null,
        horaFim: turmaSelecionada?.horaFim ?? null,
        plano: m.plano
          ? {
              nome: m.plano.nome,
              valor: Number(m.plano.valor),
              periodicidade: m.plano.periodicidade,
            }
          : null,
        cobrancas: {
          pendentes: m.cobrancas.length,
          totalPendente: Number(m.cobrancas.reduce((sum, c) => sum + Number(c.valor), 0)),
        },
      };
    });

    // 6. Retornar dados
    return NextResponse.json({
      matriculas: matriculasFormatadas,
    });
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    return NextResponse.json({ error: 'Erro ao carregar matrículas' }, { status: 500 });
  }
}
