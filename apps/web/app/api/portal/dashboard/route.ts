import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
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

    // 2.1. Verificar se foi solicitado dados de um aluno específico (para responsáveis)
    const searchParams = req.nextUrl.searchParams;
    const alunoIdParam = searchParams.get('alunoId');

    // 3. Buscar dados baseado no tipo de usuário
    let matriculas: any[] = [];
    let cobrancas: any[] = [];

    if (user.role === 'ALUNO') {
      // Buscar dados do aluno
      const aluno = await prisma.aluno.findFirst({
        where: {
          usuario: { id: userId },
          contaId,
        },
        select: { id: true },
      });

      if (aluno) {
        matriculas = await prisma.matricula.findMany({
          where: {
            alunoId: aluno.id,
            status: 'ATIVA',
          },
          select: { id: true },
        });

        cobrancas = await prisma.cobranca.findMany({
          where: {
            matricula: {
              alunoId: aluno.id,
            },
          },
          select: {
            id: true,
            status: true,
            valor: true,
            vencimento: true,
          },
        });
      }
    } else if (user.role === 'RESPONSAVEL') {
      // Buscar dados dos alunos vinculados ao responsável
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
        let alunoIds = responsavel.alunos.map((ar) => ar.aluno.id);

        // Se foi solicitado um aluno específico, filtrar apenas ele
        if (alunoIdParam) {
          // Verificar se o aluno pertence ao responsável
          if (alunoIds.includes(alunoIdParam)) {
            alunoIds = [alunoIdParam];
          } else {
            // Aluno não pertence ao responsável
            return NextResponse.json({ error: 'Acesso negado a este aluno' }, { status: 403 });
          }
        }

        matriculas = await prisma.matricula.findMany({
          where: {
            alunoId: { in: alunoIds },
            status: 'ATIVA',
          },
          select: { id: true },
        });

        cobrancas = await prisma.cobranca.findMany({
          where: {
            matricula: {
              alunoId: { in: alunoIds },
            },
          },
          select: {
            id: true,
            status: true,
            valor: true,
            vencimento: true,
          },
        });
      }
    }

    // 4. Calcular métricas
    const totalMatriculas = matriculas.length;
    const matriculasAtivas = matriculas.length;

    const cobrancasPendentes = cobrancas.filter(
      (c) => c.status === 'PENDENTE' || c.status === 'ATRASADO',
    );
    const totalPendente = Number(cobrancasPendentes.reduce((sum, c) => sum + Number(c.valor), 0));

    // Próximo vencimento
    const proximasCobrancas = cobrancasPendentes
      .filter((c) => new Date(c.vencimento) >= new Date())
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

    const proxVencimento = proximasCobrancas[0]
      ? {
          data: proximasCobrancas[0].vencimento.toISOString(),
          valor: Number(proximasCobrancas[0].valor),
        }
      : undefined;

    // Eventos (placeholder - implementar quando o módulo de eventos estiver completo)
    const eventosProximos = 0;

    // 5. Retornar dados
    return NextResponse.json({
      matriculas: {
        ativas: matriculasAtivas,
        total: totalMatriculas,
      },
      financeiro: {
        pendentes: cobrancasPendentes.length,
        totalPendente,
        proxVencimento,
      },
      eventos: {
        proximos: eventosProximos,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do dashboard' },
      { status: 500 },
    );
  }
}
