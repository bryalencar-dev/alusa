import { z } from 'zod';
import type { Desconto, Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';

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
  const subtotal = Math.max(0, round2(plano - totalDescontos));
  const total = round2(subtotal + taxa);

  return {
    plano: round2(plano),
    taxa: round2(taxa),
    descontosAplicados,
    total,
  };
}

// ----------------- criarMatricula -----------------
const criarMatriculaSchema = z.object({
  alunoId: z.string().min(1),
  turmaId: z.string().min(1),
  planoId: z.string().min(1),
  taxaMatricula: z.number().nonnegative().optional(),
  descontosIds: z.array(z.string().min(1)).optional(),
});

export type CriarMatriculaInput = z.infer<typeof criarMatriculaSchema>;

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function criarMatricula(data: CriarMatriculaInput) {
  const input = criarMatriculaSchema.parse(data);

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Carrega plano para obter valor
    const plano = await tx.plano.findUnique({ where: { id: input.planoId } });
    if (!plano) throw new Error('Plano não encontrado');

    // Cria matrícula
    const matricula = await tx.matricula.create({
      data: {
        alunoId: input.alunoId,
        turmaId: input.turmaId,
        planoId: input.planoId,
        dataInicio: new Date(),
        status: 'ATIVA',
      },
    });

    // Busca descontos (se houver)
    let descontosAplicaveis: Desconto[] = [];
    if (input.descontosIds?.length) {
      descontosAplicaveis = await tx.desconto.findMany({
        where: { id: { in: input.descontosIds } },
      });
    }

    // Calcula preço
    const calc = calcularPrecoMatricula({
      planoValor: Number(plano.valor),
      taxaMatricula: input.taxaMatricula ?? 0,
      descontos: descontosAplicaveis.map((d) => ({
        tipo: d.tipo === 'PERCENTUAL' ? 'PERCENTUAL' : 'FIXO',
        valor: Number(d.valor),
        // por padrão não cumulativo (poderá evoluir futuramente via campo no DB)
        cumulativo: false,
      })),
    });

    // Vincula descontos efetivamente aplicados
    if (descontosAplicaveis.length && calc.descontosAplicados.length) {
      // mapeia quais descontos foram aplicados (pode ser apenas o maior)
      const valoresOrdenados = descontosAplicaveis
        .map((d) => ({ desconto: d, valor:
          d.tipo === 'PERCENTUAL' ? round2(Number(plano.valor) * (Number(d.valor) / 100)) : round2(Number(d.valor))
        }))
        .sort((a, b) => b.valor - a.valor);

      const aplicados = calc.descontosAplicados;

      // cria na ordem dos maiores, correspondendo por valor
  const remaining = [...aplicados];
      for (const item of valoresOrdenados) {
        const idx = remaining.findIndex((v) => v === item.valor);
        if (idx >= 0) {
          await tx.descontoMatricula.create({
            data: {
              matriculaId: matricula.id,
              descontoId: item.desconto.id,
              valorFinal: item.valor,
            },
          });
          remaining.splice(idx, 1);
          if (!remaining.length) break;
        }
      }
    }

    // Cria cobrança inicial stub (vencimento hoje + 7d)
    const cobranca = await tx.cobranca.create({
      data: {
        matriculaId: matricula.id,
        competenciaInicio: new Date(),
        valor: calc.total,
        vencimento: addDays(new Date(), 7),
        status: 'PENDENTE',
        tipo: 'RECORRENTE',
      },
    });

    return { matricula, cobranca, preco: calc };
  });
}

// ----------------- listarMatriculas -----------------
export async function listarMatriculas(alunoId: string) {
  if (!alunoId) throw new Error('alunoId obrigatório');
  const list = await prisma.matricula.findMany({
    where: { alunoId },
    include: {
      turma: { select: { id: true, nome: true } },
      plano: { select: { id: true, nome: true } },
      cobrancas: { select: { id: true, valor: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return list;
}
