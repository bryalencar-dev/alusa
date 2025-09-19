import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implementar listagem de matrículas
    // - Buscar matrículas no banco de dados
    // - Aplicar filtros por escola se necessário
    // - Retornar lista paginada
    
    return NextResponse.json({ matriculas: [] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching matriculas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // const body = await req.json();
    
    // TODO: Implementar criação de matrícula
    // - Validar dados com schema Zod
    // - Criar matrícula no banco de dados
    // - Retornar matrícula criada
    
    return NextResponse.json({ message: 'Matrícula criada com sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Error creating matricula:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}