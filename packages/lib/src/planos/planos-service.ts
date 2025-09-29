import type { Plano, Prisma } from '@prisma/client';
import { PeriodicidadePlano, Status } from '@prisma/client';
import { prisma } from '../prisma';
import {
  planoCreateSchema,
  planoUpdateSchema,
  planoFilterSchema,
  type PlanoCreateInput,
  type PlanoUpdateInput,
  type PlanoFilterInput,
  type PlanoDTO,
} from './planos-schema';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const planoSelect = {
  id: true,
  contaId: true,
  nome: true,
  descricao: true,
  periodicidade: true,
  valor: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

function toDTO(plano: Plano): PlanoDTO {
  const valorNumber = plano.valor.toNumber();
  return {
    id: plano.id,
    contaId: plano.contaId,
    nome: plano.nome,
    descricao: plano.descricao ?? null,
    periodicidade: plano.periodicidade,
    valorDecimal: plano.valor.toFixed(2),
    valorCentavos: Math.round(valorNumber * 100),
    valor: valorNumber,
    valorFormatado: currencyFormatter.format(valorNumber),
    status: (plano.status as Status) ?? Status.ATIVO,
    createdAt: plano.createdAt,
    updatedAt: plano.updatedAt,
  };
}

export async function listPlanos(input: PlanoFilterInput): Promise<PlanoDTO[]> {
  const filters = planoFilterSchema.parse(input);
  const where: Prisma.PlanoWhereInput = {
    contaId: filters.contaId,
    status: filters.status,
  };

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    where.OR = [
      { nome: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } },
    ];
  }

  const planos = await prisma.plano.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: planoSelect,
  });

  return planos.map(toDTO);
}

export async function createPlano(data: PlanoCreateInput): Promise<PlanoDTO> {
  const parsed = planoCreateSchema.parse(data);

  const duplicate = await prisma.plano.findFirst({
    where: {
      contaId: parsed.contaId,
      nome: parsed.nome,
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error('Já existe um plano com este nome nesta conta.');
  }

  const plano = await prisma.plano.create({
    data: {
      contaId: parsed.contaId,
      nome: parsed.nome,
      descricao: parsed.descricao ?? null,
      periodicidade: parsed.periodicidade as PeriodicidadePlano,
      valor: parsed.valor,
      status: parsed.status ?? Status.ATIVO,
    },
    select: planoSelect,
  });

  return toDTO(plano);
}

export type PlanoUpdateData = Omit<PlanoUpdateInput, 'id'>;

export async function updatePlano(id: string, data: PlanoUpdateData): Promise<PlanoDTO> {
  const parsed = planoUpdateSchema.parse({ ...data, id });

  const current = await prisma.plano.findFirst({
    where: { id: parsed.id, contaId: parsed.contaId },
    select: planoSelect,
  });
  if (!current) {
    throw new Error('Plano não encontrado.');
  }

  if (parsed.nome && parsed.nome !== current.nome) {
    const duplicate = await prisma.plano.findFirst({
      where: {
        contaId: parsed.contaId,
        nome: parsed.nome,
        id: { not: parsed.id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error('Já existe um plano com este nome nesta conta.');
    }
  }

  const plano = await prisma.plano.update({
    where: { id: parsed.id },
    data: {
      nome: parsed.nome ?? undefined,
      descricao:
        parsed.descricao === undefined
          ? undefined
          : parsed.descricao === null
            ? null
            : parsed.descricao,
      periodicidade: parsed.periodicidade
        ? (parsed.periodicidade as PeriodicidadePlano)
        : undefined,
      valor: parsed.valor ?? undefined,
      status: parsed.status ?? undefined,
    },
    select: planoSelect,
  });

  return toDTO(plano);
}

export async function deletePlano(id: string, contaId: string): Promise<PlanoDTO> {
  const plano = await prisma.plano.findFirst({ 
    where: { id, contaId },
    select: planoSelect,
  });
  if (!plano) {
    throw new Error('Plano não encontrado.');
  }
  if (plano.status === 'INATIVO') {
    return toDTO(plano);
  }

  const updated = await prisma.plano.update({
    where: { id },
    data: { status: Status.INATIVO },
    select: planoSelect,
  });

  return toDTO(updated);
}
