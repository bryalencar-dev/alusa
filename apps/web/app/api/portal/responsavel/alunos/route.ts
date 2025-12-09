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

    // 2. Autorização: Apenas RESPONSAVEL
    if (user.role !== 'RESPONSAVEL') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const userId = user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Dados de usuário incompletos' }, { status: 400 });
    }

    // 3. Buscar alunos vinculados ao responsável
    const responsavel = await prisma.responsavel.findFirst({
      where: {
        usuarioId: userId,
      },
      include: {
        alunos: {
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                foto: true,
                dataNasc: true,
              },
            },
          },
        },
      },
    });

    if (!responsavel) {
      return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 });
    }

    // 4. Calcular idade dos alunos
    const calcularIdade = (dataNasc: Date): number => {
      const hoje = new Date();
      const nascimento = new Date(dataNasc);
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }
      return idade;
    };

    // 5. Formatar dados
    const alunos = responsavel.alunos.map((ar) => ({
      id: ar.aluno.id,
      nome: ar.aluno.nome,
      foto: ar.aluno.foto,
      idade: ar.aluno.dataNasc ? calcularIdade(ar.aluno.dataNasc) : null,
    }));

    // 6. Retornar dados
    return NextResponse.json({
      alunos,
    });
  } catch (error) {
    console.error('Erro ao buscar alunos do responsável:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar alunos' },
      { status: 500 },
    );
  }
}




