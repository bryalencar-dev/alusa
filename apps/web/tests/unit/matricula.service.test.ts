import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { PeriodicidadePlano, Status } from '@prisma/client';
import { prisma } from '@alusa/lib';

// Precisa mockar o alias '@/prisma/client' antes de importar o serviço
vi.mock('@/prisma/client', async () => await import('../../prisma/client'));

process.env.NEXTAUTH_SECRET ??= 'test-secret-32-bytes-sign-key-alusa!';

import type { CalcularPrecoOutput, CalcularPrecoInput } from '@alusa/lib';
let calcularPrecoMatricula: (_: CalcularPrecoInput) => CalcularPrecoOutput;
let criarMatricula: (typeof import('@alusa/lib'))['criarMatricula'];
let listarMatriculas: (typeof import('@alusa/lib'))['listarMatriculas'];
beforeAll(async () => {
  const mod = await import('@alusa/lib');
  const checkoutMod = await import('../../../../packages/lib/src/services/checkout-token');
  vi.spyOn(checkoutMod, 'generateCheckoutToken').mockResolvedValue({
    token: 'fake-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  calcularPrecoMatricula = mod.calcularPrecoMatricula;
  criarMatricula = mod.criarMatricula;
  listarMatriculas = mod.listarMatriculas;
});

// Serviço oficial para criar conta com owner atendendo ao schema
import { createFirstUser } from '@/lib/first-user-service';

describe('serviço de matrícula', () => {
  describe('calcularPrecoMatricula', () => {
    it('aplica desconto fixo', () => {
      const r = calcularPrecoMatricula({
        planoValor: 200,
        taxaMatricula: 0,
        descontos: [{ tipo: 'FIXO', valor: 50 }],
      });
      expect(r.plano).toBe(200);
      expect(r.descontosAplicados).toEqual([50]);
      expect(r.total).toBe(150);
    });

    it('aplica desconto percentual', () => {
      const r = calcularPrecoMatricula({
        planoValor: 300,
        taxaMatricula: 0,
        descontos: [{ tipo: 'PERCENTUAL', valor: 10 }],
      });
      expect(r.descontosAplicados[0]).toBe(30);
      expect(r.total).toBe(270);
    });

    it('múltiplos cumulativos', () => {
      const r = calcularPrecoMatricula({
        planoValor: 300,
        taxaMatricula: 20,
        descontos: [
          { tipo: 'PERCENTUAL', valor: 10, cumulativo: true }, // 30
          { tipo: 'FIXO', valor: 25, cumulativo: true }, // 25
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
          { tipo: 'FIXO', valor: 60 }, // 60 => maior
        ],
      });
      expect(r.descontosAplicados).toEqual([60]);
      expect(r.total).toBe(340);
    });
  });

  const hasDb = !!process.env.DATABASE_URL;
  (hasDb ? describe : describe.skip)('integração com Prisma', () => {
    let contaId: string;
    let alunoId: string;
    let turmaId: string;
    let planoId: string;
    let ownerId: string;

    async function ensureData() {
      // Garante a existência de uma conta com owner usando o fluxo oficial
      const base = {
        escolaNome: 'Conta Test',
        cpfCnpj: '00000000000191',
        nome: 'Owner Matricula',
        email: 'owner+matricula.test@example.com',
        senha: 'SenhaFort3!',
      };
      // Se já existir, ignora erro de duplicidade (teste pode rodar mais de uma vez)
      try {
        await createFirstUser(base);
      } catch {
        /* noop */
      }

      const conta = await prisma.conta.findFirstOrThrow({ where: { cpfCnpj: '00000000000191' } });
      const owner = await prisma.usuario.findFirstOrThrow({ where: { contaId: conta.id } });

      // Modalidade & Sala compatíveis com novo modelo
      const modalidade = await prisma.modalidade.upsert({
        where: { id: 'mod-matricula-test' },
        update: { nome: 'Modalidade Teste', status: 'ATIVO', contaId: conta.id },
        create: {
          id: 'mod-matricula-test',
          contaId: conta.id,
          nome: 'Modalidade Teste',
          status: 'ATIVO',
        },
      });
      const sala = await prisma.sala.upsert({
        where: { id: 'sala-matricula-test' },
        update: { nome: 'Sala M1', status: Status.ATIVO, contaId: conta.id, capacidade: 15 },
        create: {
          id: 'sala-matricula-test',
          contaId: conta.id,
          nome: 'Sala M1',
          status: Status.ATIVO,
          capacidade: 15,
        },
      });

      const turma = await prisma.turma.upsert({
        where: { id: 'turma-test' },
        update: {
          contaId: conta.id,
          nome: 'Turma Teste',
          modalidadeId: modalidade.id,
          salaId: sala.id,
          diasSemana: ['SEG'],
          horaInicio: '09:00',
          horaFim: '10:00',
          status: Status.ATIVO,
          capacidade: 20,
        },
        create: {
          id: 'turma-test',
          contaId: conta.id,
          nome: 'Turma Teste',
          modalidadeId: modalidade.id,
          salaId: sala.id,
          diasSemana: ['SEG'],
          horaInicio: '09:00',
          horaFim: '10:00',
          status: Status.ATIVO,
          capacidade: 20,
        },
      });

      // Plano
      const plano = await prisma.plano.upsert({
        where: { id: 'plano-test' },
        update: {
          contaId: conta.id,
          nome: 'Plano Teste',
          descricao: 'Plano para testes',
          periodicidade: PeriodicidadePlano.MENSAL,
          valor: '123.45',
        },
        create: {
          id: 'plano-test',
          contaId: conta.id,
          nome: 'Plano Teste',
          descricao: 'Plano para testes',
          periodicidade: PeriodicidadePlano.MENSAL,
          valor: '123.45',
        },
      } as unknown as Parameters<typeof prisma.plano.upsert>[0]);

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

      return { conta, aluno, turma, plano, owner };
    }

    beforeAll(async () => {
      const { conta, aluno, turma, plano, owner } = await ensureData();
      contaId = conta.id;
      alunoId = aluno.id;
      turmaId = turma.id;
      planoId = plano.id;
      ownerId = owner.id;
    });

    afterEach(async () => {
      if (!alunoId) return;
      await prisma.cobranca.deleteMany({ where: { matricula: { alunoId } } });
      await prisma.matricula.deleteMany({ where: { alunoId } });
    });

    it('criarMatricula mantém taxa pendente sem gerar cobrança imediata por padrão', async () => {
      const dataInicio = new Date();
      const dataFimContrato = new Date(dataInicio);
      dataFimContrato.setMonth(dataFimContrato.getMonth() + 12);

      const { matricula, cobrancas, preco, checkoutLink, primeiroVencimento } =
        await criarMatricula({
          contaId,
          alunoId,
          turmaId,
          planoId,
          taxaMatricula: 15,
          taxaIsenta: false,
          formaPagamento: 'BOLETO',
          criarCobranca: true,
          gerarCobrancaTaxa: false,
          pagarTaxaAgora: false,
          dataInicio,
          dataFimContrato,
          vencimentoDia: 5,
          createdById: ownerId,
        });
      const m = matricula as { id: string; taxaStatus?: string };
      expect(m.id).toBeTruthy();
      expect(cobrancas.taxa).toBeNull();
      expect(checkoutLink).toBeNull();
      expect(preco.total).toBeGreaterThan(0);
      expect(primeiroVencimento instanceof Date).toBe(true);
    });

    it('criarMatricula gera cobrança da taxa quando explicitamente habilitado', async () => {
      const dataInicio = new Date();
      const dataFimContrato = new Date(dataInicio);
      dataFimContrato.setMonth(dataFimContrato.getMonth() + 12);

      const { cobrancas, checkoutLink } = await criarMatricula({
        contaId,
        alunoId,
        turmaId,
        planoId,
        taxaMatricula: 15,
        taxaIsenta: false,
        formaPagamento: 'CARTAO_CREDITO',
        criarCobranca: true,
        gerarCobrancaTaxa: true,
        pagarTaxaAgora: true,
        dataInicio,
        dataFimContrato,
        vencimentoDia: 5,
        createdById: ownerId,
      });

      const taxa = cobrancas.taxa as { id: string; status: string } | null;
      expect(taxa?.id).toBeTruthy();
      expect(taxa?.status).toBe('PENDENTE');
      expect(checkoutLink?.token).toBeTruthy();
    });

    it('listarMatriculas retorna matrículas do aluno', async () => {
      const dataInicio = new Date();
      const dataFimContrato = new Date(dataInicio);
      dataFimContrato.setMonth(dataFimContrato.getMonth() + 12);

      await criarMatricula({
        contaId,
        alunoId,
        turmaId,
        planoId,
        taxaMatricula: 0,
        taxaIsenta: true,
        formaPagamento: 'PIX',
        criarCobranca: false,
        gerarCobrancaTaxa: false,
        pagarTaxaAgora: false,
        dataInicio,
        dataFimContrato,
        vencimentoDia: 10,
        createdById: ownerId,
      });

      const { data: list } = await listarMatriculas({ contaId, alunoId });
      const typed = list as Array<{
        turma?: { nome: string };
        plano?: { nome?: string | null } | null;
        cobrancas: Array<{ valor: unknown; status: string }>;
      }>;
      expect(Array.isArray(typed)).toBe(true);
      expect(typed.length).toBeGreaterThan(0);
      // conferir shape mínimo
      const m = typed[0];
      expect(m.turma?.nome).toBeTruthy();
      expect(m.plano?.nome).toBeTruthy();
      expect(Array.isArray(m.cobrancas)).toBe(true);
    });
  });
});
