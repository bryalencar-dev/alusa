import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BLOCKED_MESSAGE =
  'Pagamentos com cartão são processados internamente pela secretaria. Solicite suporte diretamente com a equipe financeira.';

export async function POST(
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
      `[PortalFinanceiro][process-card] Bloqueado para o usuário ${user?.id ?? 'sem-id'} (role: ${
        user?.role ?? 'sem-role'
      }) na cobrança ${params.id}`,
    );

    return NextResponse.json(
      {
        error: 'Pagamento com cartão indisponível',
        message: BLOCKED_MESSAGE,
      },
      { status: 403 },
    );

  } catch (error: any) {
    console.error('Erro ao processar pagamento:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar pagamento',
        details: error.message || 'Erro desconhecido'
      }, 
      { status: 500 }
    );
  }
}






