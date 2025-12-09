/**
 * API de Cobranças com Cálculo Dinâmico de Status
 *
 * Esta API implementa o padrão profissional onde:
 * 1. Status são calculados dinamicamente baseados na data de vencimento
 * 2. Status finais (PAGO, CANCELADO, ESTORNADO) são imutáveis
 * 3. Retorna dados enriquecidos com informações de matrícula e aluno
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@alusa/lib/prisma';
import { calculateDynamicStatus } from '@/lib/asaas-status-mapper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/cobrancas
 *
 * Lista cobranças com filtros e cálculo dinâmico de status
 *
 * Query params:
 * - matriculaId: ID da matrícula (opcional)
 * - status: Filtrar por status (opcional)
 * - tipo: Filtrar por tipo (opcional)
 * - dataInicio: Data inicial para filtro de vencimento (opcional)
 * - dataFim: Data final para filtro de vencimento (opcional)
 * - limit: Limite de resultados (padrão: 50)
 * - offset: Offset para paginação (padrão: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Extrair parâmetros de query
    const matriculaId = searchParams.get('matriculaId');
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const where: Record<string, unknown> = {};

    if (matriculaId) {
      where.matriculaId = matriculaId;
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (dataInicio || dataFim) {
      const vencimentoFilter: { gte?: Date; lte?: Date } = {};
      if (dataInicio) {
        vencimentoFilter.gte = new Date(dataInicio);
      }
      if (dataFim) {
        vencimentoFilter.lte = new Date(dataFim);
      }
      where.vencimento = vencimentoFilter;
    }

    // Buscar cobranças
    const [cobrancas, total] = await Promise.all([
      prisma.cobranca.findMany({
        where,
        include: {
          matricula: {
            include: {
              aluno: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  telefone: true,
                  foto: true,
                },
              },
              plano: {
                select: {
                  id: true,
                  nome: true,
                  valor: true,
                },
              },
              turma: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          pagamentos: {
            orderBy: {
              dataPagamento: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          vencimento: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.cobranca.count({ where }),
    ]);

    // ⭐ APLICAR CÁLCULO DINÂMICO DE STATUS
    const cobrancasComStatusAtualizado = cobrancas.map((cobranca) => ({
      ...cobranca,
      // Calcular status dinâmico mantendo imutabilidade de status finais
      statusCalculado: calculateDynamicStatus(cobranca.status, cobranca.vencimento),
      // Informações derivadas úteis para UI
      diasAteVencimento: Math.floor(
        (new Date(cobranca.vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      ),
      isPago: cobranca.status === 'PAGO',
      isEstornado: ['ESTORNADO', 'ESTORNADO_PARCIAL'].includes(cobranca.status),
      isCancelado: cobranca.status === 'CANCELADO',
      podeReenviar: ['PENDENTE', 'ATRASADO', 'A_VENCER'].includes(cobranca.status),
    }));

    return NextResponse.json({
      data: cobrancasComStatusAtualizado,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[API Cobranças] Erro ao listar cobranças:', error);
    return NextResponse.json({ error: 'Erro ao listar cobranças' }, { status: 500 });
  }
}

/**
 * POST /api/cobrancas
 *
 * Cria uma nova cobrança (uso interno/administrativo)
 *
 * ⚠️ IMPORTANTE: Cobranças normalmente são criadas automaticamente
 * durante o processo de matrícula. Esta rota é para casos especiais.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se usuário tem permissão (ADMIN ou FINANCEIRO)
    if (!['ADMIN', 'FINANCEIRO'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Sem permissão para criar cobranças' }, { status: 403 });
    }

    const body = await req.json();

    // Validar campos obrigatórios
    const requiredFields = [
      'matriculaId',
      'valor',
      'vencimento',
      'competenciaInicio',
      'competenciaFim',
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` },
        { status: 400 },
      );
    }

    // Verificar se matrícula existe
    const matricula = await prisma.matricula.findUnique({
      where: { id: body.matriculaId },
      include: {
        aluno: true,
      },
    });

    if (!matricula) {
      return NextResponse.json({ error: 'Matrícula não encontrada' }, { status: 404 });
    }

    // Calcular status inicial baseado na data de vencimento
    const vencimento = new Date(body.vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);

    let statusInicial: 'PENDENTE' | 'A_VENCER' | 'ATRASADO' = 'PENDENTE';
    if (vencimento > hoje) {
      statusInicial = 'A_VENCER';
    } else if (vencimento < hoje) {
      statusInicial = 'ATRASADO';
    }

    // Criar cobrança
    const cobranca = await prisma.cobranca.create({
      data: {
        matriculaId: body.matriculaId,
        tipo: body.tipo || 'MENSALIDADE',
        descricao: body.descricao,
        competenciaInicio: new Date(body.competenciaInicio),
        competenciaFim: new Date(body.competenciaFim),
        valor: body.valor,
        vencimento: vencimento,
        formaPagamento: body.formaPagamento || 'BOLETO',
        status: statusInicial,
      },
      include: {
        matricula: {
          include: {
            aluno: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Registrar no log financeiro
    await prisma.logFinanceiro.create({
      data: {
        contaId: matricula.aluno.contaId,
        usuarioId: session.user.id,
        cobrancaId: cobranca.id,
        acao: 'CRIAR_COBRANCA_MANUAL',
        detalhes: {
          valor: body.valor,
          vencimento: body.vencimento,
          tipo: body.tipo,
          descricao: body.descricao,
          criadoPor: session.user.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: cobranca,
    });
  } catch (error) {
    console.error('[API Cobranças] Erro ao criar cobrança:', error);
    return NextResponse.json({ error: 'Erro ao criar cobrança' }, { status: 500 });
  }
}
