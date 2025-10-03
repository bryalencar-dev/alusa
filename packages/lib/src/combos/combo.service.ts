import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import {
  comboCreateSchema,
  comboUpdateSchema,
  comboFilterSchema,
  type ComboCreateInput,
  type ComboUpdateInput,
  type ComboFilterInput,
  type ComboDTO,
} from './combo.schema';

function toDecimal(n: number) {
  return new Prisma.Decimal(n).toDecimalPlaces(2);
}

interface RawCombo {
  id: string;
  contaId: string;
  nome: string;
  descricao: string | null;
  valorMensal: Prisma.Decimal | number;
  taxaMatricula: Prisma.Decimal | number | null;
  categoriaMensal: string | null;
  categoriaTaxa: string | null;
  status: string;
  modoMatricula: string;
  vigenciaIni: Date | null;
  vigenciaFim: Date | null;
  vagasLimite: number | null;
  createdAt: Date;
  updatedAt: Date;
  turmas?: { turma: { id: string; nome: string } }[];
}

function toComboDTO(combo: RawCombo): ComboDTO {
  return {
    id: combo.id,
    contaId: combo.contaId,
    nome: combo.nome,
    descricao: combo.descricao ?? null,
    valorMensal: Number(combo.valorMensal),
    taxaMatricula: combo.taxaMatricula == null ? null : Number(combo.taxaMatricula),
    categoriaMensal: combo.categoriaMensal ?? null,
    categoriaTaxa: combo.categoriaTaxa ?? null,
    status: combo.status,
    modoMatricula: combo.modoMatricula,
    vigenciaIni: combo.vigenciaIni ?? null,
    vigenciaFim: combo.vigenciaFim ?? null,
    vagasLimite: combo.vagasLimite ?? null,
    turmas: (combo.turmas || []).map((ct: { turma: { id: string; nome: string } }) => ({
      id: ct.turma.id,
      nome: ct.turma.nome,
    })),
    createdAt: combo.createdAt,
    updatedAt: combo.updatedAt,
  };
}

export async function listCombos(input: ComboFilterInput): Promise<ComboDTO[]> {
  const parsed = comboFilterSchema.parse(input);
  const where: Prisma.ComboWhereInput = { contaId: parsed.contaId };
  if (parsed.status) where.status = parsed.status;
  if (parsed.search) {
    where.OR = [
      { nome: { contains: parsed.search, mode: 'insensitive' } },
      { descricao: { contains: parsed.search, mode: 'insensitive' } },
    ];
  }
  const combos = await prisma.combo.findMany({
    where,
    include: { turmas: { include: { turma: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return combos.map(toComboDTO);
}

export async function createCombo(input: ComboCreateInput): Promise<ComboDTO> {
  const parsed = comboCreateSchema.parse(input);
  const exists = await prisma.combo.findFirst({
    where: { contaId: parsed.contaId, nome: parsed.nome },
  });
  if (exists) throw new Error('Já existe um combo com este nome.');

  const combo = await prisma.combo.create({
    data: {
      contaId: parsed.contaId,
      nome: parsed.nome,
      descricao: parsed.descricao,
      valorMensal: toDecimal(parsed.valorMensal),
      taxaMatricula:
        parsed.taxaMatricula === undefined ? undefined : toDecimal(parsed.taxaMatricula),
      categoriaMensal: parsed.categoriaMensal,
      categoriaTaxa: parsed.categoriaTaxa,
      status: parsed.status ?? 'ATIVO',
      modoMatricula: parsed.modoMatricula,
      vigenciaIni: parsed.vigenciaIni,
      vigenciaFim: parsed.vigenciaFim,
      vagasLimite: parsed.vagasLimite,
      turmas:
        parsed.turmaIds && parsed.turmaIds.length
          ? {
              createMany: {
                data: parsed.turmaIds.map((tid: string) => ({ turmaId: tid })),
              },
            }
          : undefined,
    },
    include: { turmas: { include: { turma: true } } },
  });
  return toComboDTO(combo);
}

export async function updateCombo(input: ComboUpdateInput): Promise<ComboDTO> {
  const parsed = comboUpdateSchema.parse(input);
  const current = await prisma.combo.findFirst({
    where: { id: parsed.id, contaId: parsed.contaId },
    include: { turmas: true },
  });
  if (!current) throw new Error('Combo não encontrado.');

  // Nome duplicado
  if (parsed.nome && parsed.nome !== current.nome) {
    const dup = await prisma.combo.findFirst({
      where: { contaId: parsed.contaId, nome: parsed.nome, id: { not: parsed.id } },
    });
    if (dup) throw new Error('Já existe um combo com este nome.');
  }

  const data: Prisma.ComboUpdateInput = {};
  if (parsed.nome !== undefined) data.nome = parsed.nome;
  if (parsed.descricao !== undefined) data.descricao = parsed.descricao;
  if (parsed.valorMensal !== undefined) data.valorMensal = toDecimal(parsed.valorMensal);
  if (parsed.taxaMatricula !== undefined)
    data.taxaMatricula = parsed.taxaMatricula == null ? null : toDecimal(parsed.taxaMatricula);
  if (parsed.categoriaMensal !== undefined) data.categoriaMensal = parsed.categoriaMensal;
  if (parsed.categoriaTaxa !== undefined) data.categoriaTaxa = parsed.categoriaTaxa;
  if (parsed.status !== undefined) data.status = parsed.status;
  if (parsed.modoMatricula !== undefined) data.modoMatricula = parsed.modoMatricula;
  if (parsed.vigenciaIni !== undefined) data.vigenciaIni = parsed.vigenciaIni;
  if (parsed.vigenciaFim !== undefined) data.vigenciaFim = parsed.vigenciaFim;
  if (parsed.vagasLimite !== undefined) data.vagasLimite = parsed.vagasLimite;

  const turmasUpdate = parsed.turmaIds
    ? {
        deleteMany: {},
        createMany: {
          data: parsed.turmaIds.map((tid: string) => ({ turmaId: tid })),
        },
      }
    : undefined;

  const combo = await prisma.combo.update({
    where: { id: current.id },
    data: { ...data, turmas: turmasUpdate },
    include: { turmas: { include: { turma: true } } },
  });
  return toComboDTO(combo);
}

export async function deleteCombo(id: string, contaId: string): Promise<ComboDTO> {
  const combo = await prisma.combo.findFirst({
    where: { id, contaId },
    include: { turmas: { include: { turma: true } } },
  });
  if (!combo) throw new Error('Combo não encontrado.');
  await prisma.combo.delete({ where: { id: combo.id } });
  return toComboDTO(combo);
}
