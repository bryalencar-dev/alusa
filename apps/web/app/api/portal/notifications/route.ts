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
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const cobrancas = await prisma.cobranca.findMany({
      where: {
        matricula: {
          alunoId: { in: alunoIds },
        },
        OR: [
          { status: 'PENDENTE' },
          { status: 'ATRASADO' },
        ],
      },
      select: {
        id: true,
        status: true,
        vencimento: true,
      },
    });

    // 5. Calcular notificações
    let cobrancasPendentes = 0;
    let cobrancasAtrasadas = 0;

    for (const c of cobrancas) {
      const vencimento = new Date(c.vencimento);
      vencimento.setHours(0, 0, 0, 0);

      if (vencimento < hoje) {
        cobrancasAtrasadas++;
      } else if (c.status === 'PENDENTE') {
        cobrancasPendentes++;
      }
    }

    // 6. Buscar próximos eventos (próximos 30 dias)
    const daqui30Dias = new Date();
    daqui30Dias.setDate(daqui30Dias.getDate() + 30);

    const proximosEventos = await prisma.portalEvento.findMany({
      where: {
        contaId,
        status: 'ATIVO',
        dataInicio: {
          gte: hoje,
          lte: daqui30Dias,
        },
        inscricoes: {
          some: {
            alunoId: { in: alunoIds },
            status: 'CONFIRMADA',
          },
        },
      },
      select: { id: true },
    });

    // 7. Retornar notificações
    return NextResponse.json({
      cobrancasPendentes,
      cobrancasAtrasadas,
      proximosEventos: proximosEventos.length,
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar notificações' },
      { status: 500 },
    );
  }
}




