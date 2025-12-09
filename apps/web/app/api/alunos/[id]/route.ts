import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { alunoUpdateSchema, updateAluno, deleteAluno, getAluno } from '@alusa/lib';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const aluno = await getAluno(params.id);
    if (!aluno) return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });

    // ✅ Transformar responsaveis (array) para responsavel (singular) para compatibilidade com frontend
    const responsavelFinanceiro = aluno.responsaveis?.find(
      (ar) =>
        ar.responsavel.financeiro ||
        ar.tipoVinculo === 'FINANCEIRO' ||
        ar.tipoVinculo === 'PRINCIPAL',
    )?.responsavel;

    const alunoTransformado = {
      ...aluno,
      responsavel: responsavelFinanceiro
        ? {
            id: responsavelFinanceiro.id,
            nome: responsavelFinanceiro.nome,
            cpf: responsavelFinanceiro.cpf,
            email: responsavelFinanceiro.email,
            telefone: responsavelFinanceiro.telefone,
          }
        : null,
    };

    return NextResponse.json(alunoTransformado);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message || 'Erro ao buscar aluno.' },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    // Obter contaId da sessão para sincronização com Asaas
    const session = await getServerSession(authOptions);
    const contaId = (session as { user?: { contaId?: string } } | null)?.user?.contaId;

    if (!contaId) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = alunoUpdateSchema.parse({ ...body, id: params.id });
    const aluno = await updateAluno({ ...parsed, contaId });
    return NextResponse.json(aluno);
  } catch (e: unknown) {
    const err = e as Partial<{
      issues: Array<{ path: string[]; message: string }>;
      code: string;
      meta: { target?: string[] };
    }>;
    if (err.issues && err.issues.length) {
      const first = err.issues[0];
      const field = first.path.join('.') || 'geral';
      return NextResponse.json(
        {
          error: `Erro de validação${field !== 'geral' ? ` no campo ${field}` : ''}: ${first.message}`,
          field,
          details: err.issues,
        },
        { status: 400 },
      );
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
    }
    if (err.code === 'P2002') {
      const targets = (err.meta?.target || []) as string[];
      const key = targets.join('_');
      const map: Record<string, string> = {
        cpf: 'CPF já cadastrado.',
        email: 'Email já em uso nesta conta.',
        codigoInterno: 'Código interno já existe nesta conta.',
        contaId_email: 'Email já em uso nesta conta.',
        contaId_codigoInterno: 'Código interno já existe nesta conta.',
      };
      return NextResponse.json(
        { error: map[key] || 'Dados duplicados.', field: targets.join(', ') },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message || 'Erro ao atualizar.' },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Obter contaId da sessão para sincronização com Asaas
    const session = await getServerSession(authOptions);
    const contaId = (session as { user?: { contaId?: string } } | null)?.user?.contaId;

    if (!contaId) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const motivo = url.searchParams.get('motivo') || undefined;
    const aluno = await deleteAluno(params.id, contaId, motivo);
    return NextResponse.json(aluno);
  } catch (e: unknown) {
    const err = e as Partial<{ code: string }>;
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(
      { error: (e as Error).message || 'Erro ao excluir.' },
      { status: 400 },
    );
  }
}
