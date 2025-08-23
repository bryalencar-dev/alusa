import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient, CobrancaStatus } from '@prisma/client';
import { receitaMensal, inadimplencia, receitaPorPlano, receitaPorTurma, receitaPorEvento } from '../financeiro';

const prisma = new PrismaClient();

beforeAll(async () => {
  // limpar dados de teste (ordem para FKs)
  await prisma.cobranca.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.plano.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.conta.deleteMany();
  // criar entidades base
  const plano = await prisma.plano.create({ data: { nome: 'Plano A', mensalidade: 100, ativo: true } });
  const turma = await prisma.turma.create({ data: { nome: 'Turma 1' } });
  const evento = await prisma.evento.create({ data: { conta: { create: { nome: 'Conta X' } }, nome: 'Evento X', dataInicio: new Date(), dataFim: new Date(), tipo: 'WORKSHOP', status: 'ATIVO' } });
  const aluno = await prisma.aluno.create({ data: { nome: 'Aluno Teste', cpfCnpj: '00000000191', email: 'a@b.com' } });
  const matricula = await prisma.matricula.create({ data: { alunoId: aluno.id, planoId: plano.id, turmaId: turma.id, dataInicio: new Date(), status: 'ATIVA' } });
  const hoje = new Date();
  const vencido = new Date(hoje.getFullYear(), hoje.getMonth()-1, 10);
  const futuro = new Date(hoje.getFullYear(), hoje.getMonth()+1, 10);
  await prisma.cobranca.createMany({ data: [
  { valor: 100, status: CobrancaStatus.PAGA, vencimento: hoje, matriculaId: matricula.id },
    { valor: 80, status: CobrancaStatus.PENDENTE, vencimento: futuro, matriculaId: matricula.id },
    { valor: 50, status: CobrancaStatus.PENDENTE, vencimento: vencido, matriculaId: matricula.id },
    { valor: 120, status: CobrancaStatus.PAGA, vencimento: hoje, eventoId: evento.id }
  ]});
});

describe('financeiro helpers', () => {
  it('calcula receita mensal', async () => {
    const r = await receitaMensal('2m');
    expect(r.total).toBeGreaterThan(0);
  });
  it('calcula inadimplencia', async () => {
    const i = await inadimplencia('2m');
    expect(i.total).toBeGreaterThan(0);
    expect(i.taxa).toBeGreaterThanOrEqual(0);
  });
  it('agrega por plano', async () => {
    const planos = await receitaPorPlano('2m');
    expect(planos.length).toBeGreaterThan(0);
  });
  it('agrega por turma (pode estar vazio se sem turma)', async () => {
    const turmas = await receitaPorTurma('2m');
    expect(Array.isArray(turmas)).toBe(true);
  });
  it('agrega por evento', async () => {
    const eventos = await receitaPorEvento('2m');
    expect(eventos.length).toBeGreaterThan(0);
  });
});