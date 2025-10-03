import { z } from 'zod';

/**
 * Schema completo de validação da matrícula antes da submissão
 */
export const resumoMatriculaSchema = z
  .object({
    // Dados do aluno
    aluno: z.object({
      id: z.string().min(1, 'Aluno é obrigatório'),
      nome: z.string().min(1, 'Nome do aluno é obrigatório'),
      dataNasc: z.string().optional(),
      responsavel: z
        .object({
          id: z.string().min(1, 'Responsável é obrigatório'),
          nome: z.string().min(1, 'Nome do responsável é obrigatório'),
        })
        .optional(),
    }),

    // Turmas ou Combo
    modoTurmas: z.enum(['COMBO', 'TURMAS']),
    turmaIds: z.array(z.string()).optional(),
    comboId: z.string().optional(),

    // Plano
    planoId: z.string().min(1, 'Plano é obrigatório'),
    planoValor: z.number().positive('Valor do plano inválido'),

    // Taxa
    taxaIsenta: z.boolean(),
    taxaMatricula: z.number().min(0, 'Taxa não pode ser negativa'),

    // Financeiro
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida'),
    vencimentoDia: z.number().min(1).max(28, 'Dia de vencimento inválido'),
    formaPagamento: z.enum(['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO']),

    // Confirmação
    confirmacaoRevisao: z.boolean().refine((val) => val === true, {
      message: 'Você deve revisar e confirmar os dados antes de continuar',
    }),
  })
  .refine(
    (data) => {
      // Se modo TURMAS, deve ter pelo menos uma turma
      if (data.modoTurmas === 'TURMAS') {
        return data.turmaIds && data.turmaIds.length > 0;
      }
      // Se modo COMBO, deve ter comboId
      return !!data.comboId;
    },
    {
      message: 'Selecione uma turma ou combo',
      path: ['turmaIds'],
    },
  );

/**
 * Valida se todos os dados necessários estão preenchidos
 */
export function validarMatriculaCompleta(state: Record<string, unknown>): {
  valido: boolean;
  camposFaltando: string[];
  mensagens: string[];
} {
  const camposFaltando: string[] = [];
  const mensagens: string[] = [];

  // Valida aluno
  if (!state.aluno || typeof state.aluno !== 'object') {
    camposFaltando.push('aluno');
    mensagens.push('Selecione um aluno');
  } else {
    const aluno = state.aluno as Record<string, unknown>;
    if (!aluno.id) {
      camposFaltando.push('aluno.id');
      mensagens.push('Aluno não foi selecionado corretamente');
    }
  }

  // Valida turmas/combo
  if (state.modoTurmas === 'TURMAS') {
    const turmaIds = state.turmaIds as unknown[];
    if (!turmaIds || !Array.isArray(turmaIds) || turmaIds.length === 0) {
      camposFaltando.push('turmaIds');
      mensagens.push('Selecione pelo menos uma turma');
    }
  } else if (state.modoTurmas === 'COMBO') {
    if (!state.comboId) {
      camposFaltando.push('comboId');
      mensagens.push('Selecione um combo');
    }
  }

  // Valida plano
  if (!state.planoId) {
    camposFaltando.push('planoId');
    mensagens.push('Selecione um plano');
  }

  // Valida taxa (apenas se não for isenta)
  if (state.taxaIsenta !== true) {
    const taxaMatricula = Number(state.taxaMatricula || 0);
    if (taxaMatricula < 0) {
      camposFaltando.push('taxaMatricula');
      mensagens.push('Taxa de matrícula não pode ser negativa');
    }
  }

  // Valida dados financeiros
  if (!state.dataInicio) {
    camposFaltando.push('dataInicio');
    mensagens.push('Defina a data de início');
  }

  if (!state.vencimentoDia) {
    camposFaltando.push('vencimentoDia');
    mensagens.push('Defina o dia de vencimento');
  }

  if (!state.formaPagamento) {
    camposFaltando.push('formaPagamento');
    mensagens.push('Selecione a forma de pagamento');
  }

  // REMOVIDO: validação de confirmacaoRevisao aqui - isso é responsabilidade do UI

  return {
    valido: camposFaltando.length === 0,
    camposFaltando,
    mensagens,
  };
}

/**
 * Calcula idade do aluno
 */
export function calcularIdadeAluno(dataNasc: string | undefined): number | null {
  if (!dataNasc) return null;

  const nasc = new Date(dataNasc);
  if (isNaN(nasc.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const monthDiff = hoje.getMonth() - nasc.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && hoje.getDate() < nasc.getDate())) {
    idade -= 1;
  }

  return idade;
}

/**
 * Gera resumo financeiro completo
 */
export function gerarResumoFinanceiro(state: {
  planoValor?: number;
  taxaMatricula?: number;
  taxaIsenta?: boolean;
  descontoTipo?: 'FIXO' | 'PERCENTUAL';
  descontoValor?: number;
}): {
  valorPlano: number;
  valorTaxa: number;
  descontoAplicado: number;
  mensalidadeFinal: number;
  totalInicial: number;
} {
  const valorPlano = state.planoValor ?? 0;
  const valorTaxa = state.taxaIsenta ? 0 : (state.taxaMatricula ?? 0);

  let descontoAplicado = 0;
  if (state.descontoTipo && state.descontoValor && state.descontoValor > 0) {
    if (state.descontoTipo === 'FIXO') {
      descontoAplicado = state.descontoValor;
    } else {
      // PERCENTUAL
      descontoAplicado = (valorPlano * state.descontoValor) / 100;
    }
  }

  const mensalidadeFinal = Math.max(0, valorPlano - descontoAplicado);
  const totalInicial = valorTaxa + mensalidadeFinal;

  return {
    valorPlano,
    valorTaxa,
    descontoAplicado,
    mensalidadeFinal,
    totalInicial,
  };
}

/**
 * Formata forma de pagamento para exibição
 */
export function formatarFormaPagamento(forma: string | undefined): string {
  if (!forma) return '—';

  const mapa: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO: 'Cartão de Crédito',
    BOLETO: 'Boleto Bancário',
  };

  return mapa[forma] ?? forma;
}

/**
 * Gera texto descritivo do modo de turmas
 */
export function descreverModoTurmas(state: {
  modoTurmas: 'COMBO' | 'TURMAS';
  turmaLabel?: string;
  comboLabel?: string;
  turmaIds?: string[];
  comboId?: string;
}): string {
  if (state.modoTurmas === 'COMBO') {
    return state.comboLabel ?? `Combo ${state.comboId}`;
  }

  // Modo TURMAS
  if (state.turmaIds && state.turmaIds.length === 1) {
    return state.turmaLabel ?? `Turma ${state.turmaIds[0]}`;
  }

  if (state.turmaIds && state.turmaIds.length > 1) {
    return `${state.turmaIds.length} turmas selecionadas`;
  }

  return '—';
}

/**
 * Valida e retorna warnings importantes para revisão
 */
export function gerarWarningsRevisao(state: {
  taxaIsenta?: boolean;
  taxaJustificativa?: string;
  descontoValor?: number;
  descontoTipo?: 'FIXO' | 'PERCENTUAL';
  planoValor?: number;
  dataInicio?: string;
}): string[] {
  const warnings: string[] = [];

  // Warning: Taxa isenta sem justificativa
  if (
    state.taxaIsenta &&
    (!state.taxaJustificativa || state.taxaJustificativa.trim().length < 10)
  ) {
    warnings.push('⚠️ Taxa isenta sem justificativa detalhada');
  }

  // Warning: Desconto alto
  if (state.descontoValor && state.descontoValor > 0 && state.planoValor) {
    const percentual =
      state.descontoTipo === 'PERCENTUAL'
        ? state.descontoValor
        : (state.descontoValor / state.planoValor) * 100;

    if (percentual > 30) {
      warnings.push(`⚠️ Desconto alto aplicado (${percentual.toFixed(0)}%)`);
    }
  }

  // Warning: Data de início muito distante
  if (state.dataInicio) {
    const data = new Date(state.dataInicio);
    const hoje = new Date();
    const diffDias = Math.floor((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias > 60) {
      warnings.push(`⚠️ Data de início está ${diffDias} dias no futuro`);
    }
  }

  return warnings;
}

/**
 * Prepara payload para submissão da matrícula
 */
export function prepararPayloadMatricula(state: Record<string, unknown>): {
  valido: boolean;
  payload?: Record<string, unknown>;
  erros: string[];
} {
  console.log('[prepararPayloadMatricula] Estado recebido:', JSON.stringify(state, null, 2));

  const validacao = validarMatriculaCompleta(state);

  if (!validacao.valido) {
    console.log('[prepararPayloadMatricula] Validação falhou:', validacao.mensagens);
    return {
      valido: false,
      erros: validacao.mensagens,
    };
  }

  // Monta payload
  const payload = {
    // Aluno e responsável
    alunoId: (state.aluno as Record<string, unknown>)?.id,
    responsavelFinanceiroId: (
      (state.aluno as Record<string, unknown>)?.responsavel as Record<string, unknown>
    )?.id,

    // Turma ou Combo
    turmaId: state.modoTurmas === 'TURMAS' ? (state.turmaIds as string[])[0] : undefined,
    comboId: state.modoTurmas === 'COMBO' ? state.comboId : undefined,

    // Plano
    planoId: state.planoId,

    // Taxa
    taxaMatricula: state.taxaIsenta ? 0 : (state.taxaMatricula ?? 0),
    taxaIsenta: state.taxaIsenta ?? false,
    taxaJustificativa: state.taxaJustificativa,
    pagarTaxaAgora: state.pagarTaxaAgora ?? false,
    gerarCobrancaTaxa: state.gerarCobrancaTaxa ?? false,

    // Financeiro
    dataInicio: state.dataInicio,
    vencimentoDia: state.vencimentoDia,
    formaPagamento: state.formaPagamento,
    descontoTipo: state.descontoTipo,
    descontoValor: state.descontoValor,

    // Metadata
    criarCobranca: state.criarCobranca ?? true,
    contaId: state.contaId,
  };

  console.log('[prepararPayloadMatricula] Payload criado:', JSON.stringify(payload, null, 2));

  return {
    valido: true,
    payload,
    erros: [],
  };
}
