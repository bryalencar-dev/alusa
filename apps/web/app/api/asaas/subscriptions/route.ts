/**
 * API Route: Criação de Subscriptions (Assinaturas) no Asaas
 *
 * POST /api/asaas/subscriptions
 *
 * Body:
 * - matriculaId: string (matrícula para vincular assinatura)
 * - customerId?: string (ID do customer no Asaas, se omitido busca do aluno/responsável)
 * - value?: number (valor da mensalidade, se omitido usa o valor do plano)
 * - billingType: BillingType (PIX, BOLETO, CREDIT_CARD, etc)
 * - nextDueDate?: string (YYYY-MM-DD, se omitido usa dia configurado na matrícula)
 *
 * Fluxo:
 * 1. Busca matrícula e dados relacionados (aluno, plano, responsável)
 * 2. Valida/cria customer no Asaas
 * 3. Cria subscription no Asaas
 * 4. Atualiza matricula.asaasSubscriptionId
 * 5. Retorna subscription criada
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/src/prisma';
import {
  createSubscription,
  createCustomer,
  isAsaasEnabled,
  AsaasEnvError,
  type BillingType,
  type Cycle,
} from '@alusa/lib/asaas';

/**
 * Schema de validação do request
 */
const requestSchema = z.object({
  matriculaId: z.string().min(1, 'matriculaId é obrigatório'),
  customerId: z.string().optional(),
  value: z.number().positive().optional(),
  billingType: z.enum([
    'BOLETO',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'PIX',
    'UNDEFINED',
    'TRANSFER',
    'DEPOSIT',
  ]),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cycle: z
    .enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'])
    .default('MONTHLY'),
});

/**
 * Mapeia periodicidade do Prisma para Cycle do Asaas
 */
function mapPeriodicidadeToCycle(periodicidade: string): Cycle {
  const map: Record<string, Cycle> = {
    SEMANAL: 'WEEKLY',
    QUINZENAL: 'BIWEEKLY',
    MENSAL: 'MONTHLY',
    TRIMESTRAL: 'QUARTERLY',
    ANUAL: 'YEARLY',
  };
  return (map[periodicidade] || 'MONTHLY') as Cycle;
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar feature flag
    if (!isAsaasEnabled()) {
      return NextResponse.json({ error: 'Integração com Asaas não habilitada' }, { status: 403 });
    }

    // Validar request
    const body = await req.json();
    const {
      matriculaId,
      customerId: providedCustomerId,
      value,
      billingType,
      nextDueDate,
      cycle,
    } = requestSchema.parse(body);

    // Buscar matrícula com dados relacionados
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      include: {
        aluno: true,
        responsavelFinanceiro: true,
        plano: true,
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    // Verificar se já possui subscription
    if (matricula.asaasSubscriptionId) {
      return NextResponse.json(
        {
          error: 'Matrícula já possui assinatura Asaas',
          subscriptionId: matricula.asaasSubscriptionId,
        },
        { status: 409 },
      );
    }

    // Determinar customer ID
    let customerId = providedCustomerId;

    if (!customerId) {
      // Priorizar responsável financeiro, depois aluno
      const targetEntity = matricula.responsavelFinanceiro || matricula.aluno;

      if (!targetEntity) {
        return NextResponse.json(
          { error: 'Matrícula não possui aluno vinculado' },
          { status: 400 },
        );
      }

      // Verificar se já possui customer
      if (targetEntity.asaasCustomerId) {
        customerId = targetEntity.asaasCustomerId;
      } else {
        // Criar customer no Asaas
        const cpf = matricula.responsavelFinanceiro
          ? matricula.responsavelFinanceiro.cpf
          : matricula.aluno.cpf || '';

        const customerData = {
          name: targetEntity.nome,
          cpfCnpj: cpf,
          email: targetEntity.email || undefined,
          phone: targetEntity.telefone || undefined,
          mobilePhone: targetEntity.telefone || undefined,
          externalReference: targetEntity.id,
        };

        const newCustomer = await createCustomer(customerData);
        customerId = newCustomer.id;

        // Atualizar banco com customerId
        if (matricula.responsavelFinanceiro) {
          await prisma.responsavel.update({
            where: { id: targetEntity.id },
            data: { asaasCustomerId: customerId },
          });
        } else {
          await prisma.aluno.update({
            where: { id: targetEntity.id },
            data: { asaasCustomerId: customerId },
          });
        }
      }
    }

    // Determinar valor da assinatura
    const subscriptionValue = value || Number(matricula.plano.valor);

    // Determinar próxima data de vencimento
    let dueDate = nextDueDate;
    if (!dueDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = matricula.vencimentoDia;
      dueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Determinar ciclo baseado na periodicidade do plano
    const subscriptionCycle = cycle || mapPeriodicidadeToCycle(matricula.plano.periodicidade);

    // Criar subscription no Asaas
    const subscription = await createSubscription({
      customer: customerId,
      billingType: billingType as BillingType,
      value: subscriptionValue,
      nextDueDate: dueDate,
      cycle: subscriptionCycle,
      description: `Mensalidade ${matricula.plano.nome} - ${matricula.aluno.nome}`,
      externalReference: matricula.id,
    });

    // Atualizar matrícula com subscription ID
    await prisma.matricula.update({
      where: { id: matriculaId },
      data: { asaasSubscriptionId: subscription.id },
    });

    return NextResponse.json({
      success: true,
      subscription,
      customerId,
    });
  } catch (error) {
    console.error('[API /asaas/subscriptions] Erro:', error);

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
        error: 'Erro ao criar subscription',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
