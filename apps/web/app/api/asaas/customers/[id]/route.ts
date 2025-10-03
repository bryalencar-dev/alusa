/**
 * API Route: Operações em Customer específico
 *
 * GET    /api/asaas/customers/[id]  - Buscar customer
 * PATCH  /api/asaas/customers/[id]  - Atualizar customer
 * DELETE /api/asaas/customers/[id]  - Deletar customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/prisma';
import {
  getCustomer,
  updateCustomer,
  deleteCustomer,
  isAsaasEnabled,
  AsaasEnvError,
} from '@alusa/lib/asaas';

/**
 * Schema de atualização
 */
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notifications: z
    .object({
      enabled: z.boolean().optional(),
      emailEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
    })
    .optional(),
});

/**
 * GET /api/asaas/customers/[id]
 * Busca customer no Asaas
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    console.log('[API GET /asaas/customers/:id]', { customerId: id });

    const customer = await getCustomer(id);

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('[API GET /asaas/customers/:id] Erro:', error);

    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao buscar customer',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/asaas/customers/[id]
 * Atualiza customer no Asaas e sincroniza com banco
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    console.log('[API PATCH /asaas/customers/:id]', { customerId: id, data });

    // Atualizar no Asaas
    const customer = await updateCustomer(id, data);

    // Sincronizar com banco (se o customer pertence a um aluno/responsável)
    if (data.name) {
      // Atualizar nome no aluno
      await prisma.aluno.updateMany({
        where: { asaasCustomerId: id },
        data: { nome: data.name },
      });

      // Atualizar nome no responsável
      await prisma.responsavel.updateMany({
        where: { asaasCustomerId: id },
        data: { nome: data.name },
      });
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error('[API PATCH /asaas/customers/:id] Erro:', error);

    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao atualizar customer',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/asaas/customers/[id]
 * Remove customer no Asaas e limpa referência no banco
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    console.log('[API DELETE /asaas/customers/:id]', { customerId: id });

    // Verificar se customer tem matrículas com assinaturas ativas
    const matriculasAtivas = await prisma.matricula.count({
      where: {
        aluno: { asaasCustomerId: id },
        asaasSubscriptionId: { not: null },
        status: 'ATIVA',
      },
    });

    if (matriculasAtivas > 0) {
      return NextResponse.json(
        {
          error: 'Customer possui assinaturas ativas',
          message: 'Cancele as assinaturas antes de deletar o customer',
        },
        { status: 409 },
      );
    }

    // Deletar no Asaas
    await deleteCustomer(id);

    // Limpar referência no banco
    await prisma.aluno.updateMany({
      where: { asaasCustomerId: id },
      data: { asaasCustomerId: null },
    });

    await prisma.responsavel.updateMany({
      where: { asaasCustomerId: id },
      data: { asaasCustomerId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deletado com sucesso',
    });
  } catch (error) {
    console.error('[API DELETE /asaas/customers/:id] Erro:', error);

    if (error instanceof AsaasEnvError) {
      return NextResponse.json(
        {
          error: 'Configuração Asaas ausente',
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao deletar customer',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
