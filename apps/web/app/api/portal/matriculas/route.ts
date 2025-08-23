import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Assumimos vínculo por email (User.email == Aluno.email) no MVP
  const aluno = await prisma.aluno.findFirst({ where: { email: session.user.email } });
    if (!aluno) return NextResponse.json([]);

    const matriculas = await prisma.matricula.findMany({
      where: { alunoId: aluno.id },
      include: { plano: { select: { id: true, nome: true } }, turma: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const data = matriculas.map(m => ({
      id: m.id,
      status: m.status,
      plano: m.plano ? { id: m.plano.id, nome: m.plano.nome } : null,
      turma: m.turma ? { id: m.turma.id, nome: m.turma.nome } : null
    }));
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/portal/matriculas error', e);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
