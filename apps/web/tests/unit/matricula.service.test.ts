import { describe, it, expect, beforeAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Precisa mockar o alias '@/prisma/client' antes de importar o serviço
vi.mock('@/prisma/client', async () => await import('../../prisma/client'));

import type { CalcularPrecoOutput, CalcularPrecoInput, CriarMatriculaInput } from '@alusa/lib/src/services/matricula';
let calcularPrecoMatricula: (_: CalcularPrecoInput) => CalcularPrecoOutput;
let criarMatricula: (_: CriarMatriculaInput) => Promise<{ matricula: unknown; cobranca: unknown; preco: CalcularPrecoOutput }>;
let listarMatriculas: (_alunoId: string) => Promise<unknown[]>;
beforeAll(async () => {
  const mod = await import('@alusa/lib/src/services/matricula');
  calcularPrecoMatricula = mod.calcularPrecoMatricula;
  criarMatricula = mod.criarMatricula;
  listarMatriculas = mod.listarMatriculas;
});

const prisma = new PrismaClient();

describe('serviço de matrícula', () => {
  describe('calcularPrecoMatricula', () => {
    it('aplica desconto fixo', () => {
      const r = calcularPrecoMatricula({ planoValor: 200, taxaMatricula: 0, descontos: [{ tipo: 'FIXO', valor: 50 }] });
      expect(r.plano).toBe(200);
      expect(r.descontosAplicados).toEqual([50]);
      expect(r.total).toBe(150);
    });

    it('aplica desconto percentual', () => {
      const r = calcularPrecoMatricula({ planoValor: 300, taxaMatricula: 0, descontos: [{ tipo: 'PERCENTUAL', valor: 10 }] });
      expect(r.descontosAplicados[0]).toBe(30);
      expect(r.total).toBe(270);
    });

    it('múltiplos cumulativos', () => {
      const r = calcularPrecoMatricula({
        planoValor: 300,
        taxaMatricula: 20,
        descontos: [
          { tipo: 'PERCENTUAL', valor: 10, cumulativo: true }, // 30
          { tipo: 'FIXO', valor: 25, cumulativo: true } // 25
        ],
      });
      expect(r.descontosAplicados).toEqual([30, 25]);
      expect(r.total).toBe(300 - 30 - 25 + 20);
    });

    it('múltiplos não cumulativos aplica o maior', () => {
      const r = calcularPrecoMatricula({
        planoValor: 400,
        descontos: [
          { tipo: 'PERCENTUAL', valor: 10 }, // 40
          { tipo: 'FIXO', valor: 60 } // 60 => maior
        ],
      });
      expect(r.descontosAplicados).toEqual([60]);
      expect(r.total).toBe(340);
    });
  });

  describe('integração com Prisma', () => {
    let alunoId: string;
    let turmaId: string;
    let planoId: string;

    async function ensureData() {
      // Conta
      const conta = await prisma.conta.upsert({
        where: { id: 'conta-test' },
        update: { nome: 'Conta Test', cpfCnpj: '00000000000191' },
        create: { id: 'conta-test', nome: 'Conta Test', cpfCnpj: '00000000000191' },
      });

      // Turma
      const turma = await prisma.turma.upsert({
        where: { id: 'turma-test' },
        update: {
          contaId: conta.id,
          nome: 'Turma Teste',
          modalidade: 'Teste',
          sala: 'S1',
          diasSemana: ['SEGUNDA'],
          horarioInicio: '09:00',
          horarioFim: '10:00',
          status: 'ATIVA',
        },
        create: {
          id: 'turma-test',
          contaId: conta.id,
          nome: 'Turma Teste',
          modalidade: 'Teste',
          sala: 'S1',
          diasSemana: ['SEGUNDA'],
          horarioInicio: '09:00',
          horarioFim: '10:00',
        },
      });

      // Plano
      const plano = await prisma.plano.upsert({
        where: { id: 'plano-test' },
        update: {
          contaId: conta.id,
          nome: 'Plano Teste',
          descricao: 'Plano para testes',
          valor: '123.45',
          vencimentoDia: 10,
          frequenciaSemanal: 1,
          status: 'ATIVO',
        },
        create: {
          id: 'plano-test',
          contaId: conta.id,
          nome: 'Plano Teste',
          descricao: 'Plano para testes',
          valor: '123.45',
          vencimentoDia: 10,
          frequenciaSemanal: 1,
        },
      });

      // Aluno
      const uniqueEmail = `aluno.test+${Date.now()}@example.com`;
      const aluno = await prisma.aluno.create({
        data: {
          contaId: conta.id,
          nome: 'Aluno Teste',
          dataNasc: new Date('2000-01-01'),
          email: uniqueEmail,
          status: 'ATIVO',
        },
      });

      return { aluno, turma, plano };
    }

    beforeAll(async () => {
      const { aluno, turma, plano } = await ensureData();
      alunoId = aluno.id;
      turmaId = turma.id;
      planoId = plano.id;
    });

    it('criarMatricula cria matrícula e cobrança inicial', async () => {
  const { matricula, cobranca, preco } = await criarMatricula({ alunoId, turmaId, planoId, taxaMatricula: 15 });
  const m = matricula as { id: string };
  const c = cobranca as { id: string; status: string };
  expect(m.id).toBeTruthy();
  expect(c.id).toBeTruthy();
  expect(c.status).toBe('PENDENTE');
      expect(preco.total).toBeGreaterThan(0);
    });

    it('listarMatriculas retorna matrículas do aluno', async () => {
  const list = (await listarMatriculas(alunoId)) as Array<{ turma?: { nome: string }; plano?: { nome?: string | null } | null; cobrancas: Array<{ valor: unknown; status: string }> }>;
  expect(Array.isArray(list)).toBe(true);
  expect(list.length).toBeGreaterThan(0);
      // conferir shape mínimo
      const m = list[0];
      expect(m.turma?.nome).toBeTruthy();
  expect(m.plano?.nome).toBeTruthy();
      expect(Array.isArray(m.cobrancas)).toBe(true);
    });
  });
});
