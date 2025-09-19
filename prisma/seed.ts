import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureConta() {
  const conta = await prisma.conta.upsert({
    where: { id: 'conta-default' },
    update: { nome: 'Escola Exemplo', cpfCnpj: '00000000000191' },
    create: {
      id: 'conta-default',
      nome: 'Escola Exemplo',
      cpfCnpj: '00000000000191',
    },
  });
  console.log('[seed] conta pronta', { id: conta.id, nome: conta.nome });
  return conta;
}

async function seedAlunos(contaId: string) {
  const responsavel = await prisma.responsavel.upsert({
    where: { email: 'mae@example.com' },
    update: {},
    create: {
      nome: 'Maria Silva',
      cpf: '12345678900',
      email: 'mae@example.com',
      telefone: '(11) 98888-9999',
      financeiro: true,
    },
  });

  await prisma.aluno.upsert({
    where: { contaId_email: { contaId, email: 'aluno18@example.com' } },
    update: {},
    create: {
      contaId,
      nome: 'Joao Souza',
      dataNasc: new Date('2000-05-15'),
      email: 'aluno18@example.com',
      telefone: '(11) 97777-8888',
      status: 'ATIVO',
    },
  });

  const alunoMenor = await prisma.aluno.upsert({
    where: { contaId_email: { contaId, email: 'aluno15@example.com' } },
    update: {},
    create: {
      contaId,
      nome: 'Ana Souza',
      dataNasc: new Date('2010-08-20'),
      email: 'aluno15@example.com',
      status: 'ATIVO',
    },
  });

  const jaVinculado = await prisma.alunoResponsavel.findFirst({
    where: { alunoId: alunoMenor.id, responsavelId: responsavel.id },
  });
  if (!jaVinculado) {
    await prisma.alunoResponsavel.create({
      data: { alunoId: alunoMenor.id, responsavelId: responsavel.id, tipoVinculo: 'MAE' },
    });
  }

  console.log('[seed] alunos exemplo prontos', {
    alunos: ['aluno18@example.com', 'aluno15@example.com'],
    responsavel: responsavel.email,
  });
}

async function seedTurmas(contaId: string) {
  const turmasData = [
    {
      id: 'turma-ballet-iniciante',
      nome: 'Ballet Iniciante',
      modalidade: 'Ballet',
      diasSemana: ['SEGUNDA', 'QUARTA'],
      horarioInicio: '18:00',
      horarioFim: '19:00',
    },
    {
      id: 'turma-jazz-intermediario',
      nome: 'Jazz Intermediario',
      modalidade: 'Jazz',
      diasSemana: ['TERCA', 'QUINTA'],
      horarioInicio: '19:00',
      horarioFim: '20:00',
    },
  ];

  const turmas = [];
  for (const data of turmasData) {
    const turma = await prisma.turma.upsert({
      where: { id: data.id },
      update: {
        nome: data.nome,
        modalidade: data.modalidade,
        diasSemana: data.diasSemana,
        horarioInicio: data.horarioInicio,
        horarioFim: data.horarioFim,
        sala: 'Sala 1',
        status: 'ATIVA',
        contaId,
      },
      create: {
        id: data.id,
        contaId,
        nome: data.nome,
        modalidade: data.modalidade,
        diasSemana: data.diasSemana,
        horarioInicio: data.horarioInicio,
        horarioFim: data.horarioFim,
        sala: 'Sala 1',
      },
    });
    turmas.push(turma);
  }

  console.log('[seed] turmas prontas', turmas.map((t) => ({ id: t.id, nome: t.nome, modalidade: t.modalidade })));
  return turmas;
}

async function seedPlanos(contaId: string) {
  const planosData = [
    {
      nome: 'Mensal 1x/semana',
      descricao: 'Acesso a uma aula semanal',
      valor: '150.00',
      vencimentoDia: 10,
      frequenciaSemanal: 1,
    },
    {
      nome: 'Mensal 2x/semana',
      descricao: 'Acesso a duas aulas semanais',
      valor: '250.00',
      vencimentoDia: 10,
      frequenciaSemanal: 2,
    },
  ];

  const planos = [];
  for (const data of planosData) {
    const plano = await prisma.plano.upsert({
      where: { uq_plano_conta_nome: { contaId, nome: data.nome } },
      update: {
        descricao: data.descricao,
        valor: data.valor,
        vencimentoDia: data.vencimentoDia,
        frequenciaSemanal: data.frequenciaSemanal,
        status: 'ATIVO',
      },
      create: {
        contaId,
        nome: data.nome,
        descricao: data.descricao,
        valor: data.valor,
        vencimentoDia: data.vencimentoDia,
        frequenciaSemanal: data.frequenciaSemanal,
      },
    });
    planos.push(plano);
  }

  console.log('[seed] planos prontos', planos.map((p) => ({ id: p.id, nome: p.nome, valor: p.valor })));
  return planos;
}

async function seedCombo(contaId: string, turmaIds: string[]) {
  const combo = await prisma.combo.upsert({
    where: { uq_combo_conta_nome: { contaId, nome: 'Ballet + Jazz' } },
    update: {
      descricao: 'Pacote combinando Ballet Iniciante e Jazz Intermediario',
      status: 'ATIVO',
    },
    create: {
      contaId,
      nome: 'Ballet + Jazz',
      descricao: 'Pacote combinando Ballet Iniciante e Jazz Intermediario',
    },
  });

  for (const turmaId of turmaIds) {
    await prisma.comboTurma.upsert({
      where: { uq_comboturma_unique: { comboId: combo.id, turmaId } },
      update: {},
      create: { comboId: combo.id, turmaId },
    });
  }

  console.log('[seed] combo pronto', { id: combo.id, nome: combo.nome, turmas: turmaIds });
}

async function seedDescontos(contaId: string) {
  const descontosData = [
    {
      nome: 'Desconto 10%',
      tipo: 'PERCENTUAL',
      valor: '10.00',
      escopo: 'MATRICULA',
    },
    {
      nome: 'Bolsa R$50',
      tipo: 'FIXO',
      valor: '50.00',
      escopo: 'MATRICULA',
    },
  ];

  const descontos = [];
  for (const data of descontosData) {
    const desconto = await prisma.desconto.upsert({
      where: { uq_desconto_conta_nome: { contaId, nome: data.nome } },
      update: {
        tipo: data.tipo,
        valor: data.valor,
        escopo: data.escopo,
        status: 'ATIVO',
      },
      create: {
        contaId,
        nome: data.nome,
        tipo: data.tipo,
        valor: data.valor,
        escopo: data.escopo,
      },
    });
    descontos.push(desconto);
  }

  console.log('[seed] descontos prontos', descontos.map((d) => ({ id: d.id, nome: d.nome, tipo: d.tipo })));
  return descontos;
}

async function seedProfessores(contaId: string) {
  // Upsert idempotente por email (email é único global; múltiplos NULLs são permitidos no Postgres)
  const email = 'professor@example.com';
  const nome = 'Professor Exemplo';
  const telefone = '11999999999';
  const bio = 'Instrutor de Ballet';

  // Observação: até a migração e geração do client, as tipagens locais podem não refletir o novo schema.
  // Usamos assertions para manter o seed idempotente e coerente com o novo modelo.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const where: any = { email };
  const update: any = { nome, telefone, bio, status: 'ATIVO' };
  const create: any = { contaId, nome, email, telefone, bio, status: 'ATIVO' };
  const prof = await (prisma as any).professor.upsert({ where, update, create });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  console.log('[seed] professor pronto', { id: prof.id, nome: prof.nome, email: prof.email });
}

async function main() {
  const conta = await ensureConta();
  const turmas = await seedTurmas(conta.id);
  const planos = await seedPlanos(conta.id);
  await seedCombo(conta.id, turmas.map((t) => t.id));
  const descontos = await seedDescontos(conta.id);
  await seedProfessores(conta.id);
  await seedAlunos(conta.id);
  // ==== Usuário administrador padrão (para login inicial) ====
  // IMPORTANTE: Estas credenciais são apenas para ambiente de DESENVOLVIMENTO.
  // Em produção faça UM DOS SEGUINTES imediatamente após o deploy:
  // 1) Altere a senha deste usuário;
  // 2) Remova este bloco do seed e crie usuários via fluxo oficial de onboarding;
  // 3) Ajuste variáveis BCRYPT_ROUNDS / BCRYPT_PEPPER para valores fortes.
  // Nunca mantenha senhas padrão conhecidas em produção.
  const adminEmail = 'admin@example.com';
  const adminSenhaPlain = 'Admin123!'; // mínimo: 8 chars, maiúscula, minúscula, número, especial
  const pepper = process.env.BCRYPT_PEPPER || '';
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const senhaHash = await bcrypt.hash(adminSenhaPlain + pepper, rounds);
  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: { nome: 'Administrador', role: Role.ADMIN },
    create: { contaId: conta.id, nome: 'Administrador', email: adminEmail, senhaHash, role: Role.ADMIN }
  });
  console.log('[seed] usuario admin pronto', { email: adminEmail, senha: adminSenhaPlain });
  console.log('[seed] resumo IDs', {
    conta: conta.id,
    turmas: turmas.map(t => t.id),
    planos: planos.map(p => p.id),
    descontos: descontos.map(d => d.id),
  });
  console.log('[seed] concluido');
}

main()
  .catch((e) => {
    console.error('[seed] erro', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
