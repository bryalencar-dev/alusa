import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { listarMatriculas, criarMatricula } from '@alusa/lib';
import {
  StatusMatricula,
  StatusCobranca,
  StatusTaxaMatricula,
  FormaPagamento,
  TipoCobranca,
} from '@prisma/client';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, details } },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

type SessionUser = {
  id?: string;
  role?: string;
  contaId?: string;
};

async function resolveAuthContext(explicit?: string | null) {
  const session = await getServerSession(authOptions).catch(() => null);
  const user = (session as { user?: SessionUser } | null)?.user ?? null;
  const sessionContaId = user?.contaId?.trim() || null;
  const requested = explicit?.trim() || null;
  if (requested && sessionContaId && requested !== sessionContaId) {
    return { contaId: null, mismatch: true, sessionContaId, session, user };
  }
  return {
    contaId: requested || sessionContaId,
    mismatch: false,
    sessionContaId,
    session,
    user,
  };
}

const statusValues = new Set(Object.values(StatusMatricula));
const allowedRoles = new Set(['ADMIN', 'FINANCEIRO', 'RECEPCAO']);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    console.log('[API GET Matrículas] Requisição recebida:', {
      url: url.href,
      contaIdParam: url.searchParams.get('contaId'),
      statusParam: url.searchParams.get('status'),
      searchParam: url.searchParams.get('q'),
    });

    const auth = await resolveAuthContext(url.searchParams.get('contaId'));

    console.log('[API GET Matrículas] Auth resolvido:', {
      contaId: auth.contaId,
      userId: auth.user?.id,
    });

    if (auth.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!auth.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }
    if (
      !auth.user?.id ||
      !auth.user.role ||
      !allowedRoles.has(String(auth.user.role).toUpperCase())
    ) {
      return jsonError(
        403,
        'PERMISSAO_NEGADA',
        'Usuário não tem permissão para acessar matrículas.',
      );
    }

    const statusParams = url.searchParams.getAll('status');
    const statusFilter = statusParams
      .flatMap((value) =>
        value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      )
      .filter((value): value is StatusMatricula => statusValues.has(value as StatusMatricula));

    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

    const comboParam = url.searchParams.get('comboId');
    let comboFilter: string | null | undefined = undefined;
    if (comboParam === 'null') comboFilter = null;
    else if (comboParam === null) comboFilter = undefined;
    else if (comboParam.trim().length > 0) comboFilter = comboParam.trim();

    const statusToSend = statusFilter.length === 0 ? undefined : statusFilter;

    console.log('[API GET Matrículas] Parâmetros para listarMatriculas:', {
      contaId: auth.contaId,
      statusFilter: statusParams,
      statusToSend,
      page,
      pageSize,
    });

    const {
      data,
      total,
      page: currentPage,
      pageSize: currentPageSize,
    } = await listarMatriculas({
      contaId: auth.contaId,
      alunoId: url.searchParams.get('alunoId') ?? undefined,
      planoId: url.searchParams.get('planoId') ?? undefined,
      turmaId: url.searchParams.get('turmaId') ?? undefined,
      comboId: comboFilter,
      status: statusToSend,
      search: url.searchParams.get('q') ?? url.searchParams.get('search') ?? undefined,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    });

    console.log('[API GET Matrículas] Resultado:', {
      total,
      dataLength: data.length,
      currentPage,
    });

    const items = data.map((item) => ({
      id: item.id,
      status: item.status,
      statusFinanceiro: item.statusFinanceiro,
      dataInicio: item.dataInicio.toISOString(),
      dataFimContrato: item.dataFimContrato.toISOString(),
      statusContrato: item.statusContrato,
      taxaMatricula: Number(item.taxaMatricula),
      taxaStatus: item.taxaStatus,
      aluno: {
        id: item.aluno.id,
        nome: item.aluno.nome,
        cpf: item.aluno.cpf,
      },
      plano: item.plano
        ? {
            id: item.plano.id,
            nome: item.plano.nome,
            valor: Number(item.plano.valor),
          }
        : null,
      turma: item.turma
        ? {
            id: item.turma.id,
            nome: item.turma.nome,
            diasSemana: item.turma.diasSemana,
            horaInicio: item.turma.horaInicio,
            horaFim: item.turma.horaFim,
          }
        : null,
      turmas: item.turmas?.map((t) => ({
        id: t.id,
        nome: t.nome,
        diasSemana: t.diasSemana,
        horaInicio: t.horaInicio,
        horaFim: t.horaFim,
      })) ?? [],
      combo: item.combo ? { id: item.combo.id, nome: item.combo.nome } : null,
      cobrancas: item.cobrancas.map((cobranca) => ({
        id: cobranca.id,
        valor: Number(cobranca.valor),
        status: cobranca.status,
        formaPagamento: cobranca.formaPagamento,
        tipo: cobranca.tipo,
        vencimento: cobranca.vencimento.toISOString(),
        descricao: cobranca.descricao,
        asaasPaymentId: cobranca.asaasPaymentId,
        asaasId: cobranca.asaasId,
        createdAt: cobranca.createdAt.toISOString(),
        competenciaInicio: cobranca.competenciaInicio.toISOString(),
        competenciaFim: cobranca.competenciaFim.toISOString(),
        dataPagamento: cobranca.dataPagamento?.toISOString() ?? null,
      })),
      taxaIsenta: item.taxaIsenta,
      vencimentoDia: item.vencimentoDia,
      responsavelFinanceiro: item.responsavelFinanceiro,
    }));

    return NextResponse.json(
      {
        // Novo formato principal
        matriculas: items,
        total,
        page: currentPage,
        perPage: currentPageSize,
        totalPages: Math.ceil(total / currentPageSize),
        // Retrocompatibilidade com cliente antigo que aguardava { data, pageSize }
        data: items,
        pageSize: currentPageSize,
      },
      { headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    return jsonError(500, 'ERRO_LISTAR_MATRICULAS', (error as Error).message);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return jsonError(400, 'PAYLOAD_INVALIDO', 'Payload inválido');
    }

    const auth = await resolveAuthContext((body as { contaId?: string }).contaId ?? null);

    console.log('[API Matrícula] Dados de autenticação:', {
      mismatch: auth.mismatch,
      contaId: auth.contaId,
      userId: auth.user?.id,
      userRole: auth.user?.role,
      sessionContaId: auth.sessionContaId,
      session: !!auth.session,
    });

    if (auth.mismatch) {
      return jsonError(403, 'CONTA_INVALIDA', 'Conta informada não pertence ao usuário.');
    }
    if (!auth.contaId) {
      return jsonError(400, 'CONTA_OBRIGATORIA', 'contaId é obrigatório');
    }
    if (!auth.user?.id) {
      return jsonError(
        403,
        'USUARIO_NAO_AUTENTICADO',
        'Usuário não autenticado ou ID não encontrado.',
      );
    }
    if (!auth.user.role) {
      return jsonError(403, 'PAPEL_USUARIO_NAO_DEFINIDO', 'Papel do usuário não está definido.');
    }
    if (!allowedRoles.has(String(auth.user.role).toUpperCase())) {
      return jsonError(
        403,
        'PERMISSAO_NEGADA',
        `Usuário com papel "${auth.user.role}" não tem permissão para criar matrículas.`,
      );
    }

    const parseNumber = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim().length) {
        const n = Number(value.replace(',', '.'));
        if (Number.isFinite(n)) return n;
      }
      return undefined;
    };

    const parseBoolean = (value: unknown) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'sim'].includes(normalized)) return true;
        if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false;
      }
      return false;
    };

    const toDate = (value: unknown) => {
      if (value instanceof Date) return value;
      if (typeof value === 'string' && value.trim().length) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date;
      }
      return undefined;
    };

    // Função de mapeamento para normalizar formas de pagamento do wizard para o enum Prisma
    const normalizarFormaPagamento = (raw: unknown): FormaPagamento | undefined => {
      if (typeof raw !== 'string' || !raw.trim()) return undefined;
      
      const normalized = raw.trim().toUpperCase();
      
      // Mapeamento: wizard → Prisma enum
      const mapping: Record<string, FormaPagamento> = {
        'CARTAO': FormaPagamento.CARTAO_CREDITO,
        'CARTAO_CREDITO': FormaPagamento.CARTAO_CREDITO,
        'PIX': FormaPagamento.PIX,
        'BOLETO': FormaPagamento.BOLETO,
        'DINHEIRO': FormaPagamento.INDEFINIDO,
        'INDEFINIDO': FormaPagamento.INDEFINIDO,
      };
      
      const mapped = mapping[normalized];
      
      // Validar se o valor mapeado existe no enum
      return mapped && Object.values(FormaPagamento).includes(mapped) ? mapped : undefined;
    };

    const formaPagamentoRaw = (body as { formaPagamento?: unknown }).formaPagamento;
    const formaPagamentoValida = normalizarFormaPagamento(formaPagamentoRaw);

    const formaPagamentoTaxaRaw = (body as { formaPagamentoTaxa?: unknown }).formaPagamentoTaxa;
    const formaPagamentoTaxaValida = normalizarFormaPagamento(formaPagamentoTaxaRaw);

    const taxaMatriculaValue = parseNumber((body as { taxaMatricula?: unknown }).taxaMatricula);
    const taxaIsentaValue = parseBoolean((body as { taxaIsenta?: unknown }).taxaIsenta);
    const pagarTaxaAgoraValue = parseBoolean((body as { pagarTaxaAgora?: unknown }).pagarTaxaAgora);
    const gerarCobrancaTaxaValue = parseBoolean(
      (body as { gerarCobrancaTaxa?: unknown }).gerarCobrancaTaxa,
    );

    const dataInicioValue = toDate((body as { dataInicio?: unknown }).dataInicio) ?? new Date();
    const dataFimContratoValue = toDate((body as { dataFimContrato?: unknown }).dataFimContrato);
    if (!dataFimContratoValue) {
      return jsonError(400, 'DATA_FIM_CONTRATO_OBRIGATORIA', 'dataFimContrato é obrigatório.');
    }

    const payload = {
      ...body,
      contaId: auth.contaId,
      taxaMatricula: taxaMatriculaValue !== undefined ? taxaMatriculaValue : 0,
      taxaIsenta: taxaIsentaValue,
      pagarTaxaAgora: pagarTaxaAgoraValue ?? false,
      gerarCobrancaTaxa: gerarCobrancaTaxaValue ?? false,
      dataInicio: dataInicioValue,
      dataFimContrato: dataFimContratoValue,
      vencimento: toDate((body as { vencimento?: unknown }).vencimento),
      formaPagamento: formaPagamentoValida,
      formaPagamentoTaxa: formaPagamentoTaxaValida,
      createdById: auth.user.id,
    };

    console.log('[API Matrícula] Mapeamento de formas de pagamento:', {
      formaPagamentoRaw,
      formaPagamentoMapeada: formaPagamentoValida,
      formaPagamentoTaxaRaw,
      formaPagamentoTaxaMapeada: formaPagamentoTaxaValida,
    });

    console.log('[API Matrícula] Payload estruturado:', {
      hasAlunoId: !!payload.alunoId,
      hasPlanoId: !!payload.planoId,
      hasTurmaId: !!payload.turmaId,
      hasComboId: !!payload.comboId,
      hasCreatedById: !!payload.createdById,
      hasContaId: !!payload.contaId,
      taxaMatricula: payload.taxaMatricula,
      taxaIsenta: payload.taxaIsenta,
      pagarTaxaAgora: payload.pagarTaxaAgora,
      gerarCobrancaTaxa: payload.gerarCobrancaTaxa,
      formaPagamento: payload.formaPagamento,
      formaPagamentoTaxa: payload.formaPagamentoTaxa,
      dataInicio: payload.dataInicio,
      vencimentoDia: payload.vencimentoDia,
    });

    console.log(
      '[API Matrícula] Payload completo antes de criar:',
      JSON.stringify(payload, null, 2),
    );

    const result = await criarMatricula(payload);
    const matricula = result.matricula;
    const json = {
      matricula: {
        id: matricula.id,
        alunoId: matricula.alunoId,
        responsavelFinanceiroId: matricula.responsavelFinanceiroId,
        planoId: matricula.planoId,
        turmaId: matricula.turmaId,
        comboId: matricula.comboId,
        status: matricula.status,
        statusContrato: matricula.statusContrato,
        statusFinanceiro: matricula.statusFinanceiro,
        dataInicio: matricula.dataInicio.toISOString(),
        dataFimContrato: matricula.dataFimContrato.toISOString(),
        taxaMatricula: Number(matricula.taxaMatricula),
        taxaStatus: matricula.taxaStatus as StatusTaxaMatricula,
        taxaIsenta: matricula.taxaIsenta,
        taxaJustificativa: matricula.taxaJustificativa,
        vencimentoDia: matricula.vencimentoDia,
        asaasId: matricula.asaasId,
        createdAt: matricula.createdAt.toISOString(),
        updatedAt: matricula.updatedAt.toISOString(),
      },
      cobrancas: {
        taxa: result.cobrancas.taxa
          ? {
              id: result.cobrancas.taxa.id,
              tipo: result.cobrancas.taxa.tipo as TipoCobranca,
              competenciaInicio: result.cobrancas.taxa.competenciaInicio.toISOString(),
              competenciaFim: result.cobrancas.taxa.competenciaFim.toISOString(),
              valor: Number(result.cobrancas.taxa.valor),
              vencimento: result.cobrancas.taxa.vencimento.toISOString(),
              formaPagamento: result.cobrancas.taxa.formaPagamento as FormaPagamento,
              status: result.cobrancas.taxa.status as StatusCobranca,
              asaasId: result.cobrancas.taxa.asaasId,
              asaasPaymentId: result.cobrancas.taxa.asaasPaymentId,
              descricao: result.cobrancas.taxa.descricao,
              createdAt: result.cobrancas.taxa.createdAt.toISOString(),
              dataPagamento: result.cobrancas.taxa.dataPagamento?.toISOString() ?? null,
            }
          : null,
        mensalidade: result.cobrancas.mensalidade
          ? {
              id: result.cobrancas.mensalidade.id,
              tipo: result.cobrancas.mensalidade.tipo as TipoCobranca,
              competenciaInicio: result.cobrancas.mensalidade.competenciaInicio.toISOString(),
              competenciaFim: result.cobrancas.mensalidade.competenciaFim.toISOString(),
              valor: Number(result.cobrancas.mensalidade.valor),
              vencimento: result.cobrancas.mensalidade.vencimento.toISOString(),
              formaPagamento: result.cobrancas.mensalidade.formaPagamento as FormaPagamento,
              status: result.cobrancas.mensalidade.status as StatusCobranca,
              asaasId: result.cobrancas.mensalidade.asaasId,
              asaasPaymentId: result.cobrancas.mensalidade.asaasPaymentId,
              descricao: result.cobrancas.mensalidade.descricao,
              createdAt: result.cobrancas.mensalidade.createdAt.toISOString(),
              dataPagamento: result.cobrancas.mensalidade.dataPagamento?.toISOString() ?? null,
            }
          : null,
      },
      preco: result.preco,
      checkoutLink: result.checkoutLink
        ? {
            id: result.checkoutLink.id,
            token: result.checkoutLink.token,
            expiresAt: result.checkoutLink.expiresAt.toISOString(),
            usedAt: result.checkoutLink.usedAt ? result.checkoutLink.usedAt.toISOString() : null,
            channel: result.checkoutLink.channel,
          }
        : null,
      checkoutToken: result.checkoutToken,
      responsavelFinanceiro: result.responsavelFinanceiro,
      primeiroVencimento: result.primeiroVencimento.toISOString(),
    };

    return NextResponse.json(json, {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    });
  } catch (error) {
    console.error('[API Matrícula] Erro ao criar matrícula:', error);

    if ((error as { name?: string }).name === 'ZodError') {
      const zodError = error as { issues?: Array<{ path: string[]; message: string }> };
      const issues = zodError.issues || [];
      const firstIssue = issues[0];
      const errorMessage = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Erro de validação';

      console.error('[API Matrícula] Erro de validação Zod:', JSON.stringify(issues, null, 2));
      return jsonError(422, 'ERRO_VALIDACAO', errorMessage, { issues });
    }

    const message = (error as Error).message || 'Erro interno do servidor';
    const status = message.includes('já existe') ? 409 : 500;

    console.error('[API Matrícula] Erro final:', {
      message,
      status,
      stack: (error as Error).stack,
    });
    return jsonError(status, 'ERRO_CRIAR_MATRICULA', message);
  }
}
