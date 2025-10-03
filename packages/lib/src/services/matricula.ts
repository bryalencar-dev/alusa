import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
  Prisma,
  type Desconto,
  PeriodicidadePlano,
  StatusMatricula,
  StatusCobranca,
  FormaPagamento,
  StatusTaxaMatricula,
  TipoCobranca,
  StatusFinanceiro,
} from '@prisma/client';
import { prisma } from '@/prisma/client';
import { generateCheckoutToken } from './checkout-token';

// ----------------- Tipos -----------------
export type DescontoInput = {
  tipo: 'FIXO' | 'PERCENTUAL';
  valor: number; // FIXO => R$, PERCENTUAL => %
  cumulativo?: boolean; // quando true, aplica junto com outros
};

export type CalcularPrecoInput = {
  planoValor: number;
  taxaMatricula?: number;
  descontos?: DescontoInput[];
};

export type CalcularPrecoOutput = {
  plano: number;
  planoLiquido: number;
  taxa: number;
  descontosAplicados: number[]; // valores absolutos (R$) aplicados
  total: number;
};

// Utilitário para arredondar com 2 casas
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcularPrecoMatricula(input: CalcularPrecoInput): CalcularPrecoOutput {
  const plano = Math.max(0, Number(input.planoValor || 0));
  const taxa = Math.max(0, Number(input.taxaMatricula || 0));
  const descontos = input.descontos ?? [];

  // converte cada desconto em valor absoluto (R$) calculado sobre o plano
  const valores = descontos.map((d) => {
    const v = Number(d.valor || 0);
    if (d.tipo === 'PERCENTUAL') return round2(plano * (v / 100));
    return round2(v);
  });

  const hasCumulativo = descontos.some((d) => d.cumulativo);

  let descontosAplicados: number[] = [];
  if (hasCumulativo) {
    descontosAplicados = valores;
  } else {
    // aplica apenas o maior
    const max = valores.length ? Math.max(...valores) : 0;
    descontosAplicados = valores.length ? [max] : [];
  }

  const totalDescontos = round2(descontosAplicados.reduce((acc, n) => acc + n, 0));
  const planoLiquido = Math.max(0, round2(plano - totalDescontos));
  const total = round2(planoLiquido + taxa);

  return {
    plano: round2(plano),
    planoLiquido,
    taxa: round2(taxa),
    descontosAplicados,
    total,
  };
}

// ----------------- criarMatricula -----------------
const criarMatriculaSchema = z
  .object({
    contaId: z.string().min(1),
    alunoId: z.string().min(1),
    planoId: z.string().min(1),
    turmaId: z.string().min(1).optional(),
    comboId: z.string().min(1).optional(),
    responsavelFinanceiroId: z.string().min(1).optional(),
    dataInicio: z.coerce.date().default(() => new Date()),
    vencimento: z.coerce.date().optional(),
    vencimentoDia: z.number().int().min(1).max(28).default(5),
    taxaMatricula: z.number().nonnegative().default(0),
    taxaIsenta: z.boolean().default(false),
    taxaJustificativa: z.string().max(500).optional(),
    pagarTaxaAgora: z.boolean().optional().default(false),
    descontos: z
      .array(z.object({ id: z.string().min(1), cumulativo: z.boolean().optional() }))
      .optional(),
    gerarCobrancaTaxa: z.boolean().optional().default(false),
    formaPagamento: z
      .nativeEnum(FormaPagamento)
      .optional()
      .default(FormaPagamento.BOLETO)
      .refine((value) => value !== FormaPagamento.DINHEIRO, {
        message: 'Forma de pagamento dinheiro não é suportada automaticamente.',
      }),
    observacoes: z.string().max(500).optional(),
    criarCobranca: z.boolean().default(true),
    createdById: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (!data.turmaId && !data.comboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'É necessário selecionar uma turma ou um combo.',
        path: ['turmaId'],
      });
    }
    if (data.turmaId && data.comboId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escolha entre turma ou combo, não ambos ao mesmo tempo.',
        path: ['comboId'],
      });
    }
    if (data.taxaIsenta && data.taxaMatricula > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Taxa isenta não pode ter valor maior que zero.',
        path: ['taxaMatricula'],
      });
    }
  });

export type CriarMatriculaInput = z.infer<typeof criarMatriculaSchema>;

function parseHora(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

function differenceInYears(base: Date, reference: Date): number {
  const diff = base.getTime() - reference.getTime();
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  return Math.floor(diff / yearMs);
}

function turmasOverlap(
  a: { diasSemana: string[]; horaInicio: string; horaFim: string },
  b: { diasSemana: string[]; horaInicio: string; horaFim: string },
): boolean {
  const diasA = new Set(a.diasSemana);
  const shareDay = b.diasSemana.some((dia) => diasA.has(dia));
  if (!shareDay) return false;
  const iniA = parseHora(a.horaInicio);
  const fimA = parseHora(a.horaFim);
  const iniB = parseHora(b.horaInicio);
  const fimB = parseHora(b.horaFim);
  return iniA < fimB && fimA > iniB;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addHours(date: Date, hours: number) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addQuinzena(date: Date) {
  return addDays(date, 15);
}

function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7);
}

function computeCompetenciaFim(start: Date, periodicidade: PeriodicidadePlano): Date {
  switch (periodicidade) {
    case PeriodicidadePlano.SEMANAL:
      return addDays(start, 6);
    case PeriodicidadePlano.QUINZENAL:
      return addQuinzena(start);
    case PeriodicidadePlano.MENSAL:
      return addDays(addMonths(start, 1), -1);
    case PeriodicidadePlano.TRIMESTRAL:
      return addDays(addMonths(start, 3), -1);
    case PeriodicidadePlano.ANUAL:
      return addDays(addMonths(start, 12), -1);
    default:
      return addWeeks(start, 4);
  }
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampVencimentoDia(dia: number): number {
  return Math.min(Math.max(dia, 1), 28);
}

function computePrimeiroVencimento(
  dataInicio: Date,
  periodicidade: PeriodicidadePlano,
  vencimentoDia: number,
): Date {
  const dia = clampVencimentoDia(vencimentoDia);
  switch (periodicidade) {
    case PeriodicidadePlano.SEMANAL:
      return addWeeks(dataInicio, 1);
    case PeriodicidadePlano.QUINZENAL:
      return addQuinzena(dataInicio);
    case PeriodicidadePlano.TRIMESTRAL: {
      const target = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 3, 1);
      const lastDay = lastDayOfMonth(target.getFullYear(), target.getMonth());
      target.setDate(Math.min(dia, lastDay));
      return target;
    }
    case PeriodicidadePlano.ANUAL: {
      const target = new Date(dataInicio.getFullYear() + 1, dataInicio.getMonth(), 1);
      const lastDay = lastDayOfMonth(target.getFullYear(), target.getMonth());
      target.setDate(Math.min(dia, lastDay));
      return target;
    }
    case PeriodicidadePlano.MENSAL:
    default: {
      const target = new Date(dataInicio.getFullYear(), dataInicio.getMonth() + 1, 1);
      const lastDay = lastDayOfMonth(target.getFullYear(), target.getMonth());
      target.setDate(Math.min(dia, lastDay));
      return target;
    }
  }
}

function computePrimeiroCicloInicio(dataInicio: Date, periodicidade: PeriodicidadePlano): Date {
  switch (periodicidade) {
    case PeriodicidadePlano.SEMANAL:
      return addWeeks(dataInicio, 1);
    case PeriodicidadePlano.QUINZENAL:
      return addQuinzena(dataInicio);
    case PeriodicidadePlano.TRIMESTRAL:
      return addMonths(dataInicio, 3);
    case PeriodicidadePlano.ANUAL:
      return addMonths(dataInicio, 12);
    case PeriodicidadePlano.MENSAL:
    default:
      return addMonths(dataInicio, 1);
  }
}

function isFeatureAsaasEnabled() {
  return String(process.env.FEATURE_ASAAS).toLowerCase() === 'true';
}

async function maybeCreateAsaasRecords(params: {
  alunoId: string;
  contaId: string;
  valor: number;
  vencimento: Date;
}): Promise<{ subscriptionId: string | null; chargeId: string | null }> {
  if (!isFeatureAsaasEnabled()) return { subscriptionId: null, chargeId: null };

  try {
    // Buscar aluno e responsável financeiro
    const aluno = await prisma.aluno.findUnique({
      where: { id: params.alunoId },
      include: {
        responsaveis: {
          where: { tipoVinculo: 'FINANCEIRO' },
          include: { responsavel: true },
          take: 1,
        },
      },
    });

    if (!aluno) {
      console.warn('[Asaas] Aluno não encontrado:', params.alunoId);
      return { subscriptionId: null, chargeId: null };
    }

    const responsavel = aluno.responsaveis[0]?.responsavel;

    // Importar dinamicamente para evitar circular dependency
    const { createCustomer, listCustomers } = await import('../asaas/customer');
    const { createSubscription } = await import('../asaas/subscription');

    // Verificar se o aluno/responsável já tem customer no Asaas
    const cpfBusca = responsavel?.cpf || aluno.cpf;
    if (!cpfBusca) {
      console.warn('[Asaas] CPF não encontrado para aluno:', params.alunoId);
      return { subscriptionId: null, chargeId: null };
    }

    let customerId: string | null = null;

    // Buscar customer existente por CPF
    const existingCustomers = await listCustomers({ cpfCnpj: cpfBusca });
    if (existingCustomers.data && existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('[Asaas] Customer existente encontrado:', customerId);
    } else {
      // Criar novo customer
      const customerData = {
        name: responsavel?.nome || aluno.nome || 'Aluno',
        cpfCnpj: cpfBusca,
        email: responsavel?.email || aluno.email || undefined,
        phone: responsavel?.telefone || aluno.telefone || undefined,
        mobilePhone: aluno.telefone || undefined,
        externalReference: params.alunoId,
      };

      const customer = await createCustomer(customerData);
      customerId = customer.id;
      console.log('[Asaas] Customer criado:', customerId);
    }

    if (!customerId) {
      console.warn('[Asaas] Falha ao obter/criar customer');
      return { subscriptionId: null, chargeId: null };
    }

    // Criar subscription (assinatura recorrente)
    const subscription = await createSubscription({
      customer: customerId,
      billingType: 'BOLETO',
      value: params.valor,
      nextDueDate: params.vencimento.toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: `Mensalidade - Aluno ${aluno.nome || params.alunoId}`,
      externalReference: params.alunoId,
    });

    console.log('[Asaas] Subscription criada:', subscription.id);

    // O primeiro payment é criado automaticamente pela subscription
    // O ID do payment virá via webhook e será vinculado automaticamente
    const chargeId: string | null = null;

    return {
      subscriptionId: subscription.id,
      chargeId,
    };
  } catch (error) {
    console.error('[Asaas] Erro ao criar records:', error);
    // Não bloquear a matrícula em caso de erro do Asaas
    return { subscriptionId: null, chargeId: null };
  }
}

type TurmaLite = {
  id: string;
  nome: string;
  diasSemana: string[];
  horaInicio: string;
  horaFim: string;
  idadeMin: number | null;
  idadeMax: number | null;
  capacidade: number;
};

type MatriculaWithRelations = {
  id: string;
  turma: TurmaLite | null;
  combo: {
    id: string;
    turmas: Array<{ turma: TurmaLite | null }>;
  } | null;
};

function extractTurmasFromMatricula(matricula: MatriculaWithRelations): TurmaLite[] {
  const list: TurmaLite[] = [];
  if (matricula.turma) list.push(matricula.turma);
  if (matricula.combo) {
    for (const ct of matricula.combo.turmas) {
      if (ct.turma) list.push(ct.turma);
    }
  }
  return list;
}

type DescontoPayload = { id: string; cumulativo?: boolean };

async function ensureAluno(tx: Prisma.TransactionClient, alunoId: string, contaId: string) {
  const aluno = await tx.aluno.findUnique({
    where: { id: alunoId },
    select: { id: true, contaId: true, dataNasc: true, status: true },
  });
  if (!aluno) throw new Error('Aluno não encontrado');
  if (aluno.contaId !== contaId) throw new Error('Aluno pertence a outra conta');
  if (aluno.status !== 'ATIVO') throw new Error('Aluno precisa estar ativo para nova matrícula');
  return aluno;
}

async function ensureResponsavelFinanceiro(
  tx: Prisma.TransactionClient,
  alunoId: string,
  responsavelId: string,
): Promise<{ id: string; nome: string; email: string | null; telefone: string | null }> {
  const vinculo = await tx.alunoResponsavel.findFirst({
    where: { alunoId, responsavelId },
    select: { responsavel: { select: { id: true, nome: true, email: true, telefone: true } } },
  });
  if (!vinculo) throw new Error('Responsável não vinculado ao aluno.');
  if (!vinculo.responsavel) throw new Error('Registro de responsável inválido.');
  return vinculo.responsavel;
}

async function ensureTurma(
  tx: Prisma.TransactionClient,
  turmaId: string,
  contaId: string,
): Promise<TurmaLite> {
  const turma = await tx.turma.findUnique({
    where: { id: turmaId },
    select: {
      id: true,
      nome: true,
      contaId: true,
      diasSemana: true,
      horaInicio: true,
      horaFim: true,
      idadeMin: true,
      idadeMax: true,
      capacidade: true,
    },
  });
  if (!turma) throw new Error('Turma não encontrada');
  if (turma.contaId !== contaId) throw new Error('Turma pertence a outra conta');
  return {
    id: turma.id,
    nome: turma.nome,
    diasSemana: turma.diasSemana,
    horaInicio: turma.horaInicio,
    horaFim: turma.horaFim,
    idadeMin: turma.idadeMin,
    idadeMax: turma.idadeMax,
    capacidade: turma.capacidade,
  };
}

async function ensureCombo(
  tx: Prisma.TransactionClient,
  comboId: string,
  contaId: string,
): Promise<{
  id: string;
  nome: string;
  vagasLimite: number | null;
  turmas: TurmaLite[];
}> {
  const combo = await tx.combo.findUnique({
    where: { id: comboId },
    include: {
      turmas: {
        include: {
          turma: {
            select: {
              id: true,
              nome: true,
              diasSemana: true,
              horaInicio: true,
              horaFim: true,
              idadeMin: true,
              idadeMax: true,
              capacidade: true,
              contaId: true,
            },
          },
        },
      },
    },
  });
  if (!combo) throw new Error('Combo não encontrado');
  if (combo.contaId !== contaId) throw new Error('Combo pertence a outra conta');
  const turmas: TurmaLite[] = combo.turmas
    .map((ct) => ct.turma)
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .map((t) => ({
      id: t.id,
      nome: t.nome,
      diasSemana: t.diasSemana,
      horaInicio: t.horaInicio,
      horaFim: t.horaFim,
      idadeMin: t.idadeMin,
      idadeMax: t.idadeMax,
      capacidade: t.capacidade,
    }));
  if (!turmas.length) throw new Error('Combo não possui turmas configuradas');
  return { id: combo.id, nome: combo.nome, vagasLimite: combo.vagasLimite, turmas };
}

async function ensurePlano(tx: Prisma.TransactionClient, planoId: string, contaId: string) {
  const plano = await tx.plano.findUnique({
    where: { id: planoId },
    select: { id: true, contaId: true, valor: true, nome: true, periodicidade: true },
  });
  if (!plano) throw new Error('Plano não encontrado');
  if (plano.contaId !== contaId) throw new Error('Plano pertence a outra conta');
  return plano;
}

async function ensureDescontos(
  tx: Prisma.TransactionClient,
  contaId: string,
  descontos: DescontoPayload[] | undefined,
): Promise<Array<Desconto & { cumulativo?: boolean }>> {
  if (!descontos?.length) return [];
  const ids = descontos.map((d) => d.id);
  const records = await tx.desconto.findMany({
    where: { id: { in: ids }, contaId },
  });
  return records.map((record) => ({
    ...record,
    cumulativo: descontos.find((d) => d.id === record.id)?.cumulativo,
  }));
}

async function validarIdade(
  aluno: { dataNasc: Date | null },
  turmas: TurmaLite[],
  dataInicio: Date,
) {
  if (!aluno.dataNasc) return;
  const idade = differenceInYears(dataInicio, aluno.dataNasc);
  for (const turma of turmas) {
    if (typeof turma.idadeMin === 'number' && idade < turma.idadeMin) {
      throw new Error(`Aluno não atende à idade mínima da turma ${turma.nome}`);
    }
    if (typeof turma.idadeMax === 'number' && idade > turma.idadeMax) {
      throw new Error(`Aluno excede a idade máxima da turma ${turma.nome}`);
    }
  }
}

async function validarCapacidade(
  tx: Prisma.TransactionClient,
  turmas: TurmaLite[],
  comboId: string | null,
) {
  if (!turmas.length) return;
  const comboIdsByTurma = new Map<string, string[]>();
  const comboTurmas = await tx.comboTurma.findMany({
    where: { turmaId: { in: turmas.map((t) => t.id) } },
    select: { comboId: true, turmaId: true },
  });
  for (const ct of comboTurmas) {
    if (!comboIdsByTurma.has(ct.turmaId)) comboIdsByTurma.set(ct.turmaId, []);
    comboIdsByTurma.get(ct.turmaId)?.push(ct.comboId);
  }

  await Promise.all(
    turmas.map(async (turma) => {
      const combosRelacionados = comboIdsByTurma.get(turma.id) ?? [];
      const occupied = await tx.matricula.count({
        where: {
          status: StatusMatricula.ATIVA,
          OR: [
            { turmaId: turma.id },
            combosRelacionados.length ? { comboId: { in: combosRelacionados } } : undefined,
          ].filter(Boolean) as Prisma.MatriculaWhereInput[],
        },
      });
      if (occupied >= turma.capacidade) {
        throw new Error(`Turma ${turma.nome} está sem vagas disponíveis`);
      }
    }),
  );

  if (comboId) {
    const combo = await tx.combo.findUnique({
      where: { id: comboId },
      select: { vagasLimite: true, nome: true },
    });
    if (combo?.vagasLimite) {
      const ocupados = await tx.matricula.count({
        where: {
          status: StatusMatricula.ATIVA,
          comboId,
        },
      });
      if (ocupados >= combo.vagasLimite) {
        throw new Error(`Combo ${combo.nome} atingiu o limite de vagas`);
      }
    }
  }
}

async function validarConflitos(
  tx: Prisma.TransactionClient,
  alunoId: string,
  novasTurmas: TurmaLite[],
  dataReferencia: Date,
) {
  if (!novasTurmas.length) return;
  const existentes = await tx.matricula.findMany({
    where: {
      alunoId,
      status: StatusMatricula.ATIVA,
      OR: [{ dataFim: null }, { dataFim: { gte: dataReferencia } }],
    },
    select: {
      id: true,
      turma: {
        select: {
          id: true,
          nome: true,
          diasSemana: true,
          horaInicio: true,
          horaFim: true,
          idadeMin: true,
          idadeMax: true,
          capacidade: true,
        },
      },
      combo: {
        select: {
          id: true,
          turmas: {
            include: {
              turma: {
                select: {
                  id: true,
                  nome: true,
                  diasSemana: true,
                  horaInicio: true,
                  horaFim: true,
                  idadeMin: true,
                  idadeMax: true,
                  capacidade: true,
                },
              },
            },
          },
        },
      },
    },
  });

  for (const existente of existentes) {
    const turmasExistentes = extractTurmasFromMatricula(existente as MatriculaWithRelations);
    for (const nova of novasTurmas) {
      for (const atual of turmasExistentes) {
        if (turmasOverlap(nova, atual)) {
          throw new Error(
            `Conflito de horário com a turma ${atual.nome} (matrícula ${existente.id})`,
          );
        }
      }
    }
  }
}

async function aplicarDescontos(
  tx: Prisma.TransactionClient,
  matriculaId: string,
  descontos: Array<Desconto & { cumulativo?: boolean }>,
  planoValor: number,
  calc: CalcularPrecoOutput,
) {
  if (!descontos.length || !calc.descontosAplicados.length) return;
  const detalhes = descontos
    .map((d) => {
      const valorBase =
        d.tipo === 'PERCENTUAL'
          ? round2(planoValor * (Number(d.valor) / 100))
          : round2(Number(d.valor));
      return { desconto: d, valorAplicado: valorBase };
    })
    .sort((a, b) => b.valorAplicado - a.valorAplicado);

  const restantes = [...calc.descontosAplicados];
  for (const item of detalhes) {
    const idx = restantes.findIndex((valor) => Math.abs(valor - item.valorAplicado) < 0.01);
    if (idx >= 0) {
      await tx.descontoMatricula.create({
        data: {
          matriculaId,
          descontoId: item.desconto.id,
          valorFinal: new Prisma.Decimal(item.valorAplicado),
        },
      });
      restantes.splice(idx, 1);
      if (!restantes.length) break;
    }
  }
}

export async function criarMatricula(rawData: CriarMatriculaInput) {
  console.log('[Matrícula Service] Iniciando criação de matrícula');
  console.log('[Matrícula Service] Raw data:', JSON.stringify(rawData, null, 2));

  try {
    console.log('[Matrícula Service] Iniciando validação Zod...');
    const input = criarMatriculaSchema.parse(rawData);
    console.log('[Matrícula Service] Validação Zod OK');
    console.log('[Matrícula Service] Input validado:', JSON.stringify(input, null, 2));

    const dataInicio = input.dataInicio instanceof Date ? input.dataInicio : new Date();
    const vencimentoDia = clampVencimentoDia(input.vencimentoDia);

    return prisma.$transaction(async (tx) => {
      console.log('[Matrícula Service] Iniciando transação');

      const aluno = await ensureAluno(tx, input.alunoId, input.contaId);
      const plano = await ensurePlano(tx, input.planoId, input.contaId);

      const idadeAluno = aluno.dataNasc ? differenceInYears(dataInicio, aluno.dataNasc) : null;
      const menorDeIdade = typeof idadeAluno === 'number' ? idadeAluno < 18 : false;

      let responsavelFinanceiro: {
        id: string;
        nome: string;
        email: string | null;
        telefone: string | null;
      } | null = null;
      if (menorDeIdade) {
        if (!input.responsavelFinanceiroId) {
          throw new Error('Responsável financeiro obrigatório para alunos menores de idade.');
        }
        responsavelFinanceiro = await ensureResponsavelFinanceiro(
          tx,
          input.alunoId,
          input.responsavelFinanceiroId,
        );
      } else if (input.responsavelFinanceiroId) {
        responsavelFinanceiro = await ensureResponsavelFinanceiro(
          tx,
          input.alunoId,
          input.responsavelFinanceiroId,
        );
      }

      let turma: TurmaLite | null = null;
      let combo: {
        id: string;
        nome: string;
        vagasLimite: number | null;
        turmas: TurmaLite[];
      } | null = null;
      if (input.turmaId) turma = await ensureTurma(tx, input.turmaId, input.contaId);
      if (input.comboId) combo = await ensureCombo(tx, input.comboId, input.contaId);

      const turmasSelecionadas = ([] as TurmaLite[])
        .concat(turma ? [turma] : [])
        .concat(combo ? combo.turmas : []);

      await validarIdade(aluno, turmasSelecionadas, dataInicio);
      await validarCapacidade(tx, turmasSelecionadas, combo ? combo.id : null);
      await validarConflitos(tx, input.alunoId, turmasSelecionadas, dataInicio);

      const descontos = await ensureDescontos(tx, input.contaId, input.descontos);
      const calc = calcularPrecoMatricula({
        planoValor: Number(plano.valor),
        taxaMatricula: input.taxaMatricula,
        descontos: descontos.map((d) => ({
          tipo: d.tipo === 'PERCENTUAL' ? 'PERCENTUAL' : 'FIXO',
          valor: Number(d.valor),
          cumulativo: d.cumulativo,
        })),
      });

      const primeiroVencimento = input.vencimento
        ? input.vencimento
        : computePrimeiroVencimento(dataInicio, plano.periodicidade, vencimentoDia);
      const primeiroCicloInicio = computePrimeiroCicloInicio(dataInicio, plano.periodicidade);
      const primeiroCicloFim = computeCompetenciaFim(primeiroCicloInicio, plano.periodicidade);

      // Nova lógica: matrícula sempre ativa, status financeiro separado
      const statusFinanceiroInicial = input.taxaIsenta
        ? StatusFinanceiro.ADIMPLENTE
        : StatusFinanceiro.PENDENTE_TAXA;

      const taxaStatus = input.taxaIsenta
        ? StatusTaxaMatricula.ISENTO
        : StatusTaxaMatricula.PENDENTE;

      let matricula = await tx.matricula.create({
        data: {
          alunoId: input.alunoId,
          responsavelFinanceiroId: responsavelFinanceiro?.id ?? null,
          planoId: plano.id,
          turmaId: turma?.id ?? null,
          comboId: combo?.id ?? null,
          dataInicio,
          dataFim: null,
          status: StatusMatricula.ATIVA, // Sempre ATIVA agora!
          statusFinanceiro: statusFinanceiroInicial,
          taxaMatricula: new Prisma.Decimal(calc.taxa),
          taxaStatus,
          taxaIsenta: input.taxaIsenta,
          taxaJustificativa: input.taxaIsenta ? input.taxaJustificativa : null,
          vencimentoDia,
        },
      });

      await aplicarDescontos(tx, matricula.id, descontos, Number(plano.valor), calc);

      let cobrancaTaxa: Awaited<ReturnType<typeof tx.cobranca.create>> | null = null;
      if (!input.taxaIsenta && calc.taxa > 0 && input.pagarTaxaAgora) {
        cobrancaTaxa = await tx.cobranca.create({
          data: {
            matriculaId: matricula.id,
            tipo: TipoCobranca.AVULSA,
            descricao: 'Taxa de matrícula',
            competenciaInicio: dataInicio,
            competenciaFim: dataInicio,
            valor: new Prisma.Decimal(calc.taxa),
            vencimento: dataInicio,
            formaPagamento: input.formaPagamento,
            status: StatusCobranca.PENDENTE,
          },
        });
      }

      if (!input.taxaIsenta && calc.taxa > 0 && !input.gerarCobrancaTaxa) {
        await tx.matriculaLog.create({
          data: {
            matriculaId: matricula.id,
            action: 'TAXA_COBRANCA_POSTERGADA',
            actorId: input.createdById,
            metadata: {
              motivo: 'Cobrança da taxa será criada após validação do cartão',
              taxaValor: calc.taxa,
            },
          },
        });
      }

      let cobrancaMensalidade: Awaited<ReturnType<typeof tx.cobranca.create>> | null = null;
      if (input.criarCobranca && calc.planoLiquido > 0) {
        cobrancaMensalidade = await tx.cobranca.create({
          data: {
            matriculaId: matricula.id,
            tipo: TipoCobranca.MENSALIDADE,
            competenciaInicio: primeiroCicloInicio,
            competenciaFim: primeiroCicloFim,
            valor: new Prisma.Decimal(calc.planoLiquido),
            vencimento: primeiroVencimento,
            formaPagamento: input.formaPagamento,
            status: StatusCobranca.PENDENTE,
          },
        });
      }

      if (cobrancaMensalidade) {
        const { subscriptionId, chargeId } = await maybeCreateAsaasRecords({
          alunoId: input.alunoId,
          contaId: input.contaId,
          valor: calc.planoLiquido,
          vencimento: primeiroVencimento,
        });

        if (subscriptionId) {
          matricula = await tx.matricula.update({
            where: { id: matricula.id },
            data: { asaasSubscriptionId: subscriptionId },
          });
        }
        if (chargeId) {
          cobrancaMensalidade = await tx.cobranca.update({
            where: { id: cobrancaMensalidade.id },
            data: { asaasPaymentId: chargeId },
          });
        }

        // Log da integração Asaas
        await tx.matriculaLog.create({
          data: {
            matriculaId: matricula.id,
            action: 'ASAAS_INTEGRADO',
            actorId: input.createdById,
            metadata: {
              subscriptionId,
              chargeId,
              status: subscriptionId ? 'SUCESSO' : 'PENDENTE',
            },
          },
        });
      }

      await tx.matriculaLog.create({
        data: {
          matriculaId: matricula.id,
          action: 'MATRICULA_CRIADA',
          actorId: input.createdById,
          metadata: {
            status: StatusMatricula.ATIVA,
            statusFinanceiro: statusFinanceiroInicial,
            taxaStatus,
            taxaValor: calc.taxa,
            taxaIsenta: input.taxaIsenta,
            taxaJustificativa: input.taxaJustificativa,
            pagarTaxaAgora: input.pagarTaxaAgora,
            gerarCobrancaTaxa: input.gerarCobrancaTaxa,
            planoLiquido: calc.planoLiquido,
            responsavelFinanceiroId: responsavelFinanceiro?.id ?? null,
            menorDeIdade,
          },
        },
      });

      let checkoutLink: Awaited<ReturnType<typeof tx.checkoutLink.create>> | null = null;
      if (cobrancaTaxa && input.formaPagamento === FormaPagamento.CARTAO) {
        const placeholderToken = randomUUID();
        const expiresDefault = addHours(new Date(), 24);
        const provisional = await tx.checkoutLink.create({
          data: {
            matriculaId: matricula.id,
            token: placeholderToken,
            expiresAt: expiresDefault,
            createdById: input.createdById,
            channel: 'PORTAL',
          },
        });

        const { token, expiresAt } = await generateCheckoutToken({
          matriculaId: matricula.id,
          checkoutLinkId: provisional.id,
        });

        checkoutLink = await tx.checkoutLink.update({
          where: { id: provisional.id },
          data: { token, expiresAt },
        });

        await tx.matriculaLog.create({
          data: {
            matriculaId: matricula.id,
            action: 'CHECKOUT_LINK_GERADO',
            actorId: input.createdById,
            metadata: {
              checkoutLinkId: checkoutLink.id,
              expiresAt: checkoutLink.expiresAt,
              cobrancaTaxaId: cobrancaTaxa.id,
            },
          },
        });
      } else if (input.taxaIsenta) {
        await tx.matriculaLog.create({
          data: {
            matriculaId: matricula.id,
            action: 'TAXA_ISENTA',
            actorId: input.createdById,
            metadata: {
              justificativa: 'Isenção registrada no ato da matrícula',
            },
          },
        });
      }

      console.log('[Matrícula Service] Matrícula criada com sucesso', {
        matriculaId: matricula.id,
        gerarCobrancaTaxa: input.gerarCobrancaTaxa,
        taxaValor: calc.taxa,
      });

      return {
        matricula,
        preco: calc,
        responsavelFinanceiro,
        checkoutLink,
        checkoutToken: checkoutLink?.token || null,
        cobrancas: {
          taxa: cobrancaTaxa,
          mensalidade: cobrancaMensalidade,
        },
        primeiroVencimento,
      };
    });
  } catch (error) {
    console.error('[Matrícula Service] Erro ao criar matrícula:', error);

    // Log específico para erros de validação Zod
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as { issues?: unknown[]; format?: () => unknown };
      console.error('[Matrícula Service] Erro de validação Zod:', {
        issues: zodError.issues,
        formattedError: zodError.format?.(),
      });
    }

    if (error instanceof Error) {
      console.error('[Matrícula Service] Stack:', error.stack);
    }
    throw error;
  }
}

// ----------------- listarMatriculas -----------------
export interface ListarMatriculasOptions {
  contaId: string;
  status?: StatusMatricula | StatusMatricula[];
  alunoId?: string;
  planoId?: string;
  turmaId?: string;
  comboId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type MatriculaListItem = {
  id: string;
  status: StatusMatricula;
  statusFinanceiro: StatusFinanceiro;
  dataInicio: Date;
  dataFim: Date | null;
  taxaMatricula: number;
  taxaStatus: StatusTaxaMatricula;
  taxaIsenta: boolean;
  vencimentoDia: number;
  aluno: {
    id: string;
    nome: string | null;
    cpf: string | null;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
  };
  responsavelFinanceiro: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  } | null;
  turma?: {
    id: string;
    nome: string;
    diasSemana: string[];
    horaInicio: string;
    horaFim: string;
  } | null;
  combo?: {
    id: string;
    nome: string;
  } | null;
  cobrancas: Array<{
    id: string;
    valor: number;
    status: StatusCobranca;
    formaPagamento: FormaPagamento;
    tipo: TipoCobranca;
    vencimento: Date;
  }>;
};

export async function listarMatriculas(
  options: ListarMatriculasOptions,
): Promise<{ data: MatriculaListItem[]; total: number; page: number; pageSize: number }> {
  console.log(
    '[Service listarMatriculas] Iniciando listagem com options:',
    JSON.stringify(options, null, 2),
  );

  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  const where: Prisma.MatriculaWhereInput = {
    aluno: { contaId: options.contaId },
  };
  if (options.alunoId) where.alunoId = options.alunoId;
  if (options.planoId) where.planoId = options.planoId;
  if (options.turmaId) where.turmaId = options.turmaId;
  if (options.comboId !== undefined) where.comboId = options.comboId;
  if (options.status) {
    console.log('[Service listarMatriculas] Aplicando filtro de status:', options.status);
    if (Array.isArray(options.status)) where.status = { in: options.status };
    else where.status = options.status;
  } else {
    console.log('[Service listarMatriculas] SEM filtro de status - deve trazer todas');
  }
  if (options.search?.trim()) {
    const term = options.search.trim();
    where.OR = [
      { aluno: { nome: { contains: term, mode: 'insensitive' } } },
      { plano: { nome: { contains: term, mode: 'insensitive' } } },
      { turma: { nome: { contains: term, mode: 'insensitive' } } },
      { combo: { nome: { contains: term, mode: 'insensitive' } } },
    ];
  }

  console.log('[Service listarMatriculas] Where clause:', JSON.stringify(where, null, 2));

  const [items, total] = await Promise.all([
    prisma.matricula.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        aluno: { select: { id: true, nome: true, cpf: true } },
        responsavelFinanceiro: {
          select: { id: true, nome: true, email: true, telefone: true },
        },
        turma: {
          select: {
            id: true,
            nome: true,
            diasSemana: true,
            horaInicio: true,
            horaFim: true,
          },
        },
        plano: { select: { id: true, nome: true, valor: true } },
        combo: { select: { id: true, nome: true } },
        cobrancas: {
          orderBy: { vencimento: 'asc' },
          select: {
            id: true,
            valor: true,
            status: true,
            formaPagamento: true,
            tipo: true,
            vencimento: true,
          },
        },
      },
    }),
    prisma.matricula.count({ where }),
  ]);

  console.log('[Service listarMatriculas] Resultado da query:', {
    totalItems: items.length,
    totalCount: total,
    page,
    pageSize,
  });

  const data: MatriculaListItem[] = items.map((m) => ({
    id: m.id,
    status: m.status,
    statusFinanceiro: m.statusFinanceiro,
    dataInicio: m.dataInicio,
    dataFim: m.dataFim,
    taxaMatricula: Number(m.taxaMatricula),
    taxaStatus: m.taxaStatus,
    taxaIsenta: m.taxaIsenta,
    vencimentoDia: m.vencimentoDia,
    aluno: {
      id: m.aluno.id,
      nome: m.aluno.nome,
      cpf: m.aluno.cpf,
    },
    plano: {
      id: m.plano.id,
      nome: m.plano.nome,
      valor: Number(m.plano.valor),
    },
    responsavelFinanceiro: m.responsavelFinanceiro
      ? {
          id: m.responsavelFinanceiro.id,
          nome: m.responsavelFinanceiro.nome,
          email: m.responsavelFinanceiro.email,
          telefone: m.responsavelFinanceiro.telefone,
        }
      : null,
    turma: m.turma
      ? {
          id: m.turma.id,
          nome: m.turma.nome,
          diasSemana: m.turma.diasSemana,
          horaInicio: m.turma.horaInicio,
          horaFim: m.turma.horaFim,
        }
      : null,
    combo: m.combo ? { id: m.combo.id, nome: m.combo.nome } : null,
    cobrancas: m.cobrancas.map((c) => ({
      id: c.id,
      valor: Number(c.valor),
      status: c.status,
      formaPagamento: c.formaPagamento,
      tipo: c.tipo,
      vencimento: c.vencimento,
    })),
  }));

  return { data, total, page, pageSize };
}

const atualizarStatusMatriculaSchema = z.object({
  id: z.string().min(1),
  contaId: z.string().min(1),
  status: z.nativeEnum(StatusMatricula),
  dataFim: z.coerce.date().optional(),
});

export type AtualizarStatusMatriculaInput = z.infer<typeof atualizarStatusMatriculaSchema>;

export async function atualizarStatusMatricula(raw: AtualizarStatusMatriculaInput) {
  const input = atualizarStatusMatriculaSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    const matricula = await tx.matricula.findUnique({
      where: { id: input.id },
      include: { aluno: { select: { contaId: true } } },
    });
    if (!matricula) throw new Error('Matrícula não encontrada');
    if (matricula.aluno.contaId !== input.contaId)
      throw new Error('Matrícula pertence a outra conta');
    if (matricula.status === input.status) return matricula;

    const data: Prisma.MatriculaUpdateInput = {
      status: input.status,
      dataFim: input.status === StatusMatricula.ATIVA ? null : (input.dataFim ?? new Date()),
    };

    const updated = await tx.matricula.update({
      where: { id: input.id },
      data,
    });

    if (input.status === StatusMatricula.CANCELADA) {
      await tx.cobranca.updateMany({
        where: { matriculaId: input.id, status: StatusCobranca.PENDENTE },
        data: { status: StatusCobranca.CANCELADO },
      });
    }

    return updated;
  });
}

export async function cancelarMatricula({ id, contaId }: { id: string; contaId: string }) {
  return atualizarStatusMatricula({ id, contaId, status: StatusMatricula.CANCELADA });
}

// ----------------- buscarMatriculaPorId -----------------
export type MatriculaDetalhada = {
  id: string;
  status: StatusMatricula;
  dataInicio: Date;
  dataFim: Date | null;
  taxaMatricula: number;
  taxaStatus: StatusTaxaMatricula;
  taxaIsenta: boolean;
  vencimentoDia: number;
  createdAt: Date;
  updatedAt: Date;
  aluno: {
    id: string;
    nome: string | null;
    cpf: string | null;
    dataNasc: Date | null;
    telefone: string | null;
    email: string | null;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
    periodicidade: PeriodicidadePlano;
  };
  responsavelFinanceiro: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  } | null;
  turma: {
    id: string;
    nome: string;
    diasSemana: string[];
    horaInicio: string;
    horaFim: string;
  } | null;
  combo: {
    id: string;
    nome: string;
    turmas: Array<{
      id: string;
      nome: string;
      diasSemana: string[];
      horaInicio: string;
      horaFim: string;
    }>;
  } | null;
  cobrancas: Array<{
    id: string;
    valor: number;
    status: StatusCobranca;
    formaPagamento: FormaPagamento;
    tipo: TipoCobranca;
    vencimento: Date;
    dataPagamento: Date | null;
    competenciaInicio: Date;
    competenciaFim: Date;
    createdAt: Date;
  }>;
  checkoutLinks: Array<{
    id: string;
    token: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }>;
  descontos: Array<{
    id: string;
    nome: string;
    tipo: string;
    valor: number;
  }>;
  logs: Array<{
    id: string;
    acao: string;
    detalhes: string | null;
    createdAt: Date;
    usuario: {
      id: string;
      nome: string | null;
    } | null;
  }>;
};

export async function buscarMatriculaPorId({
  id,
  contaId,
}: {
  id: string;
  contaId: string;
}): Promise<MatriculaDetalhada | null> {
  const matricula = await prisma.matricula.findUnique({
    where: { id },
    include: {
      aluno: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          dataNasc: true,
          telefone: true,
          email: true,
          contaId: true,
        },
      },
      responsavelFinanceiro: {
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
        },
      },
      turma: {
        select: {
          id: true,
          nome: true,
          diasSemana: true,
          horaInicio: true,
          horaFim: true,
        },
      },
      plano: {
        select: {
          id: true,
          nome: true,
          valor: true,
          periodicidade: true,
        },
      },
      combo: {
        include: {
          turmas: {
            include: {
              turma: {
                select: {
                  id: true,
                  nome: true,
                  diasSemana: true,
                  horaInicio: true,
                  horaFim: true,
                },
              },
            },
          },
        },
      },
      cobrancas: {
        orderBy: { vencimento: 'asc' },
        include: {
          pagamentos: {
            orderBy: { dataPagamento: 'desc' },
            take: 1,
            select: {
              dataPagamento: true,
            },
          },
        },
      },
      checkoutLinks: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          token: true,
          expiresAt: true,
          usedAt: true,
          createdAt: true,
        },
      },
      descontos: {
        include: {
          desconto: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              valor: true,
            },
          },
        },
      },
      logs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          actor: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    },
  });

  if (!matricula) return null;
  if (matricula.aluno.contaId !== contaId) return null;

  return {
    id: matricula.id,
    status: matricula.status,
    dataInicio: matricula.dataInicio,
    dataFim: matricula.dataFim,
    taxaMatricula: Number(matricula.taxaMatricula),
    taxaStatus: matricula.taxaStatus,
    taxaIsenta: matricula.taxaIsenta,
    vencimentoDia: matricula.vencimentoDia,
    createdAt: matricula.createdAt,
    updatedAt: matricula.updatedAt,
    aluno: {
      id: matricula.aluno.id,
      nome: matricula.aluno.nome,
      cpf: matricula.aluno.cpf,
      dataNasc: matricula.aluno.dataNasc,
      telefone: matricula.aluno.telefone,
      email: matricula.aluno.email,
    },
    plano: {
      id: matricula.plano.id,
      nome: matricula.plano.nome,
      valor: Number(matricula.plano.valor),
      periodicidade: matricula.plano.periodicidade,
    },
    responsavelFinanceiro: matricula.responsavelFinanceiro
      ? {
          id: matricula.responsavelFinanceiro.id,
          nome: matricula.responsavelFinanceiro.nome,
          email: matricula.responsavelFinanceiro.email,
          telefone: matricula.responsavelFinanceiro.telefone,
        }
      : null,
    turma: matricula.turma
      ? {
          id: matricula.turma.id,
          nome: matricula.turma.nome,
          diasSemana: matricula.turma.diasSemana,
          horaInicio: matricula.turma.horaInicio,
          horaFim: matricula.turma.horaFim,
        }
      : null,
    combo: matricula.combo
      ? {
          id: matricula.combo.id,
          nome: matricula.combo.nome,
          turmas: matricula.combo.turmas
            .map((ct) => ct.turma)
            .filter((t): t is NonNullable<typeof t> => Boolean(t))
            .map((t) => ({
              id: t.id,
              nome: t.nome,
              diasSemana: t.diasSemana,
              horaInicio: t.horaInicio,
              horaFim: t.horaFim,
            })),
        }
      : null,
    cobrancas: matricula.cobrancas.map((c) => ({
      id: c.id,
      valor: Number(c.valor),
      status: c.status,
      formaPagamento: c.formaPagamento,
      tipo: c.tipo,
      vencimento: c.vencimento,
      dataPagamento: c.pagamentos[0]?.dataPagamento ?? null,
      competenciaInicio: c.competenciaInicio,
      competenciaFim: c.competenciaFim,
      createdAt: c.createdAt,
    })),
    checkoutLinks: matricula.checkoutLinks.map((link) => ({
      id: link.id,
      token: link.token,
      expiresAt: link.expiresAt,
      usedAt: link.usedAt,
      createdAt: link.createdAt,
    })),
    descontos: matricula.descontos.map((md) => ({
      id: md.desconto.id,
      nome: md.desconto.nome,
      tipo: md.desconto.tipo,
      valor: Number(md.desconto.valor),
    })),
    logs: matricula.logs.map((log) => ({
      id: log.id,
      acao: log.action,
      detalhes: log.metadata ? JSON.stringify(log.metadata) : null,
      createdAt: log.createdAt,
      usuario: log.actor
        ? {
            id: log.actor.id,
            nome: log.actor.nome,
          }
        : null,
    })),
  };
}
