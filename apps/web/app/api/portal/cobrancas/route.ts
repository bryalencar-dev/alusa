import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Aluno vinculado via email (simplificação MVP) - como email não é unique em Aluno, usar findFirst
    const aluno = await prisma.aluno.findFirst({ where: { email: session.user.email } });
    if (!aluno) return NextResponse.json([]);

    const cobrancas = await prisma.cobranca.findMany({
      where: { matricula: { alunoId: aluno.id } },
      include: {
        matricula: { include: { plano: { select: { nome: true } } } },
        evento: { select: { nome: true } }
      },
      orderBy: { vencimento: 'asc' }
    });

    const data = cobrancas.map(c => ({
      id: c.id,
      status: c.status,
      vencimento: c.vencimento,
      matricula: c.matricula ? { plano: c.matricula.plano ? { nome: c.matricula.plano.nome } : undefined } : null,
      evento: c.evento ? { nome: c.evento.nome } : null
    }));
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/portal/cobrancas error', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
