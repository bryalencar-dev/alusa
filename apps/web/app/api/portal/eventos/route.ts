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

    // 4. Buscar eventos da conta
    const eventos = await prisma.portalEvento.findMany({
      where: {
        contaId,
        status: { in: ['ATIVO', 'ENCERRADO'] }, // Mostrar eventos ativos e encerrados recentes
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        dataInicio: true,
        dataFim: true,
        local: true,
        tipo: true,
        capacidade: true,
        status: true,
        // Incluir inscrições apenas dos alunos relacionados ao usuário
        inscricoes: {
          where: {
            alunoId: { in: alunoIds },
          },
          select: {
            id: true,
            status: true,
            quantidade: true,
            valorTotal: true,
            qrCode: true,
          },
          take: 1, // Um aluno só pode ter uma inscrição por evento
        },
      },
      orderBy: {
        dataInicio: 'desc',
      },
      take: 50, // Limitar a 50 eventos mais recentes
    });

    // 5. Formatar dados
    const eventosFormatados = eventos.map((e) => ({
      id: e.id,
      nome: e.nome,
      descricao: e.descricao,
      dataInicio: e.dataInicio.toISOString(),
      dataFim: e.dataFim ? e.dataFim.toISOString() : null,
      local: e.local,
      tipo: e.tipo,
      capacidade: e.capacidade,
      status: e.status,
      inscricao: e.inscricoes[0]
        ? {
            id: e.inscricoes[0].id,
            status: e.inscricoes[0].status,
            quantidade: e.inscricoes[0].quantidade,
            valorTotal: Number(e.inscricoes[0].valorTotal),
            qrCode: e.inscricoes[0].qrCode || '',
          }
        : undefined,
    }));

    // 6. Retornar dados
    return NextResponse.json({
      eventos: eventosFormatados,
    });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: 'Erro ao carregar eventos' }, { status: 500 });
  }
}
