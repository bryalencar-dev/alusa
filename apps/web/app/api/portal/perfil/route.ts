import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para atualização de perfil
const perfilSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  enderecoCep: z.string().optional(),
  enderecoLogradouro: z.string().optional(),
  enderecoNumero: z.string().optional(),
  enderecoComplemento: z.string().optional(),
  enderecoBairro: z.string().optional(),
  enderecoCidade: z.string().optional(),
  enderecoUf: z.string().optional(),
});

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

    // 3. Buscar dados baseado no tipo de usuário
    if (user.role === 'ALUNO') {
      const aluno = await prisma.aluno.findFirst({
        where: {
          usuario: { id: userId },
          contaId,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cpf: true,
          dataNasc: true,
          enderecoCep: true,
          enderecoLogradouro: true,
          enderecoNumero: true,
          enderecoComplemento: true,
          enderecoBairro: true,
          enderecoCidade: true,
          enderecoUf: true,
        },
      });

      if (!aluno) {
        return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
      }

      return NextResponse.json({
        tipo: 'ALUNO',
        nome: aluno.nome,
        email: aluno.email,
        telefone: aluno.telefone,
        cpf: aluno.cpf,
        dataNasc: aluno.dataNasc?.toISOString(),
        enderecoCep: aluno.enderecoCep,
        enderecoLogradouro: aluno.enderecoLogradouro,
        enderecoNumero: aluno.enderecoNumero,
        enderecoComplemento: aluno.enderecoComplemento,
        enderecoBairro: aluno.enderecoBairro,
        enderecoCidade: aluno.enderecoCidade,
        enderecoUf: aluno.enderecoUf,
      });
    } else if (user.role === 'RESPONSAVEL') {
      const responsavel = await prisma.responsavel.findFirst({
        where: {
          usuarioId: userId,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cpf: true,
          enderecoCep: true,
          enderecoLogradouro: true,
          enderecoNumero: true,
          enderecoComplemento: true,
          enderecoBairro: true,
          enderecoCidade: true,
          enderecoUf: true,
        },
      });

      if (!responsavel) {
        return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 });
      }

      return NextResponse.json({
        tipo: 'RESPONSAVEL',
        nome: responsavel.nome,
        email: responsavel.email,
        telefone: responsavel.telefone,
        cpf: responsavel.cpf,
        enderecoCep: responsavel.enderecoCep,
        enderecoLogradouro: responsavel.enderecoLogradouro,
        enderecoNumero: responsavel.enderecoNumero,
        enderecoComplemento: responsavel.enderecoComplemento,
        enderecoBairro: responsavel.enderecoBairro,
        enderecoCidade: responsavel.enderecoCidade,
        enderecoUf: responsavel.enderecoUf,
      });
    }

    return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    // 3. Validar dados recebidos
    const body = await req.json();
    const validation = perfilSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 },
      );
    }

    const data = validation.data;

    // 4. Atualizar dados baseado no tipo de usuário
    if (user.role === 'ALUNO') {
      const aluno = await prisma.aluno.findFirst({
        where: {
          usuario: { id: userId },
          contaId,
        },
        select: { id: true },
      });

      if (!aluno) {
        return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
      }

      const updated = await prisma.aluno.update({
        where: { id: aluno.id },
        data: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          enderecoCep: data.enderecoCep || null,
          enderecoLogradouro: data.enderecoLogradouro || null,
          enderecoNumero: data.enderecoNumero || null,
          enderecoComplemento: data.enderecoComplemento || null,
          enderecoBairro: data.enderecoBairro || null,
          enderecoCidade: data.enderecoCidade || null,
          enderecoUf: data.enderecoUf || null,
        },
        select: {
          nome: true,
          email: true,
          telefone: true,
          cpf: true,
          dataNasc: true,
          enderecoCep: true,
          enderecoLogradouro: true,
          enderecoNumero: true,
          enderecoComplemento: true,
          enderecoBairro: true,
          enderecoCidade: true,
          enderecoUf: true,
        },
      });

      // Atualizar também o nome no usuário se mudou
      await prisma.usuario.update({
        where: { id: userId },
        data: { nome: data.nome },
      });

      return NextResponse.json({
        tipo: 'ALUNO',
        nome: updated.nome,
        email: updated.email,
        telefone: updated.telefone,
        cpf: updated.cpf,
        dataNasc: updated.dataNasc?.toISOString(),
        enderecoCep: updated.enderecoCep,
        enderecoLogradouro: updated.enderecoLogradouro,
        enderecoNumero: updated.enderecoNumero,
        enderecoComplemento: updated.enderecoComplemento,
        enderecoBairro: updated.enderecoBairro,
        enderecoCidade: updated.enderecoCidade,
        enderecoUf: updated.enderecoUf,
      });
    } else if (user.role === 'RESPONSAVEL') {
      const responsavel = await prisma.responsavel.findFirst({
        where: {
          usuarioId: userId,
        },
        select: { id: true },
      });

      if (!responsavel) {
        return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 });
      }

      const updated = await prisma.responsavel.update({
        where: { id: responsavel.id },
        data: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          enderecoCep: data.enderecoCep || null,
          enderecoLogradouro: data.enderecoLogradouro || null,
          enderecoNumero: data.enderecoNumero || null,
          enderecoComplemento: data.enderecoComplemento || null,
          enderecoBairro: data.enderecoBairro || null,
          enderecoCidade: data.enderecoCidade || null,
          enderecoUf: data.enderecoUf || null,
        },
        select: {
          nome: true,
          email: true,
          telefone: true,
          cpf: true,
          enderecoCep: true,
          enderecoLogradouro: true,
          enderecoNumero: true,
          enderecoComplemento: true,
          enderecoBairro: true,
          enderecoCidade: true,
          enderecoUf: true,
        },
      });

      // Atualizar também o nome no usuário se mudou
      await prisma.usuario.update({
        where: { id: userId },
        data: { nome: data.nome },
      });

      return NextResponse.json({
        tipo: 'RESPONSAVEL',
        nome: updated.nome,
        email: updated.email,
        telefone: updated.telefone,
        cpf: updated.cpf,
        enderecoCep: updated.enderecoCep,
        enderecoLogradouro: updated.enderecoLogradouro,
        enderecoNumero: updated.enderecoNumero,
        enderecoComplemento: updated.enderecoComplemento,
        enderecoBairro: updated.enderecoBairro,
        enderecoCidade: updated.enderecoCidade,
        enderecoUf: updated.enderecoUf,
      });
    }

    return NextResponse.json({ error: 'Tipo de usuário inválido' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
