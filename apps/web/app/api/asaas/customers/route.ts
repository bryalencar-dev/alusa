/**
 * API Route: Criação de Customers no Asaas
 *
 * POST /api/asaas/customers
 *
 * Body:
 * - alunoId?: string (criar customer a partir do aluno)
 * - responsavelId?: string (criar customer a partir do responsável)
 * - customData?: CreateCustomerInput (dados customizados)
 *
 * Fluxo:
 * 1. Busca dados do aluno ou responsável
 * 2. Cria customer no Asaas
 * 3. Atualiza asaasCustomerId no banco
 * 4. Retorna customer criado
 */

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
import { z } from 'zod';
// import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import {
  createCustomer,
  isAsaasEnabled,
  AsaasEnvError,
  type CreateCustomerInput,
} from '@alusa/lib/asaas';

/**
 * Schema de validação do request
 */
const requestSchema = z
  .object({
    alunoId: z.string().optional(),
    responsavelId: z.string().optional(),
    customData: z
      .object({
        name: z.string().min(1),
        cpfCnpj: z.string().min(11),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        mobilePhone: z.string().optional(),
        address: z.string().optional(),
        addressNumber: z.string().optional(),
        complement: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => data.alunoId || data.responsavelId || data.customData, {
    message: 'É necessário fornecer alunoId, responsavelId ou customData',
  });

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação (comentado para testes)
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    // }

    // Verificar feature flag
    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    // Validar request
    const body = await req.json();
    const { alunoId, responsavelId, customData } = requestSchema.parse(body);

    // Preparar dados do customer
    let customerData: CreateCustomerInput;

    if (customData) {
      // Usar dados customizados
      customerData = customData;
    } else if (alunoId) {
      // Buscar dados do aluno
      const aluno = await prisma.aluno.findUnique({
        where: { id: alunoId },
      });

      if (!aluno) {
        return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
      }

      // Verificar se já possui customer
      if (aluno.asaasCustomerId) {
        return NextResponse.json(
          {
            error: 'Aluno já possui customer Asaas',
            customerId: aluno.asaasCustomerId,
          },
          { status: 409 },
        );
      }

      customerData = {
        name: aluno.nome,
        cpfCnpj: aluno.cpf || '',
        email: aluno.email || undefined,
        phone: aluno.telefone || undefined,
        mobilePhone: aluno.telefone || undefined,
        address: aluno.enderecoLogradouro || undefined,
        addressNumber: aluno.enderecoNumero || undefined,
        complement: aluno.enderecoComplemento || undefined,
        province: aluno.enderecoBairro || undefined,
        postalCode: aluno.enderecoCep || undefined,
        externalReference: aluno.id,
      };
    } else if (responsavelId) {
      // Buscar dados do responsável
      const responsavel = await prisma.responsavel.findUnique({
        where: { id: responsavelId },
      });

      if (!responsavel) {
        return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 });
      }

      // Verificar se já possui customer
      if (responsavel.asaasCustomerId) {
        return NextResponse.json(
          {
            error: 'Responsável já possui customer Asaas',
            customerId: responsavel.asaasCustomerId,
          },
          { status: 409 },
        );
      }

      customerData = {
        name: responsavel.nome,
        cpfCnpj: responsavel.cpf,
        email: responsavel.email,
        phone: responsavel.telefone,
        mobilePhone: responsavel.telefone,
        address: responsavel.enderecoLogradouro || undefined,
        addressNumber: responsavel.enderecoNumero || undefined,
        complement: responsavel.enderecoComplemento || undefined,
        province: responsavel.enderecoBairro || undefined,
        postalCode: responsavel.enderecoCep || undefined,
        externalReference: responsavel.id,
      };
    } else {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    // Criar customer no Asaas
    const customer = await createCustomer(customerData);

    // Atualizar banco de dados
    if (alunoId) {
      await prisma.aluno.update({
        where: { id: alunoId },
        data: { asaasCustomerId: customer.id },
      });
    } else if (responsavelId) {
      await prisma.responsavel.update({
        where: { id: responsavelId },
        data: { asaasCustomerId: customer.id },
      });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('[API /asaas/customers] Erro:', error);

    // Erro de configuração do Asaas
    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    // Erro de validação
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 },
      );
    }

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro ao criar customer',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
