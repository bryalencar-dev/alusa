import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BLOCKED_MESSAGE =
  'A emissão de boletos foi centralizada na secretaria. Entre em contato para solicitar sua fatura.';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = session.user as { id?: string; role?: string };

    if (user?.role !== 'ALUNO' && user?.role !== 'RESPONSAVEL') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    console.info(
      `[PortalFinanceiro][boleto] Bloqueado para o usuário ${user?.id ?? 'sem-id'} (role: ${
        user?.role ?? 'sem-role'
      }) na cobrança ${params.id}`,
    );

    return NextResponse.json(
      {
        error: 'Boleto indisponível no portal',
        message: BLOCKED_MESSAGE,
      },
      { status: 403 },
    );
  } catch (error) {
    console.error('Erro ao buscar boleto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar boleto' }, 
      { status: 500 }
    );
  }
}

