import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const aluno = await prisma.aluno.findFirst({ where: { email: session.user.email } });
    if (!aluno) return NextResponse.json([]);

    const inscricoes = await prisma.inscricaoEvento.findMany({
      where: { alunoId: aluno.id },
      include: {
        evento: { select: { nome: true, dataInicio: true } },
        ingressos: { select: { id: true } }
      },
      orderBy: { dataReg: 'desc' }
    });

    const data = inscricoes.map(i => ({
      id: i.id,
      evento: i.evento ? { nome: i.evento.nome, dataInicio: i.evento.dataInicio } : null,
      ingressos: i.ingressos.map(g => ({ id: g.id }))
    }));
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/portal/eventos error', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
