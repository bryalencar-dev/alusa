import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsuarios(contaId: string) {
  const usuarios = [
    { email: 'admin@example.com', nome: 'Admin', role: Role.ADMIN },
    { email: 'professor@example.com', nome: 'Professor Demo', role: Role.PROFESSOR },
    { email: 'responsavel@example.com', nome: 'Resp Demo', role: Role.RESPONSAVEL }
  ];
  for (const u of usuarios) {
    const senhaHash = await bcrypt.hash('SenhaFort3!', 10);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, role: u.role, senhaHash, contaId },
      create: { email: u.email, nome: u.nome, role: u.role, senhaHash, contaId }
    });
  }
}

async function seedAlunos(contaId: string) {
  // Responsável para aluno menor
  const responsavel = await prisma.responsavel.upsert({
    where: { email: 'mae@example.com' },
    update: {},
    create: {
      nome: 'Maria Silva',
      cpf: '12345678900',
      email: 'mae@example.com',
      telefone: '(11) 98888-9999',
      financeiro: true,
    }
  });

  // Aluno maior
  await prisma.aluno.upsert({
    where: { email: 'aluno18@example.com' },
    update: {},
    create: {
      contaId,
      nome: 'João Souza',
      dataNasc: new Date('2000-05-15'),
      email: 'aluno18@example.com',
      telefone: '(11) 97777-8888',
      status: 'ATIVO',
    }
  });

  // Aluno menor
  const alunoMenor = await prisma.aluno.upsert({
    where: { email: 'aluno15@example.com' },
    update: {},
    create: {
      contaId,
      nome: 'Ana Souza',
      dataNasc: new Date('2010-08-20'),
      email: 'aluno15@example.com',
      status: 'ATIVO',
    }
  });

  // Vínculo
  const jaVinculado = await prisma.alunoResponsavel.findFirst({
    where: { alunoId: alunoMenor.id, responsavelId: responsavel.id }
  });
  if (!jaVinculado) {
    await prisma.alunoResponsavel.create({
      data: { alunoId: alunoMenor.id, responsavelId: responsavel.id, tipoVinculo: 'MÃE' }
    });
  }
}

async function main() {
  // Conta padrão com id fixo para facilitar testes
  const conta = await prisma.conta.upsert({
    where: { id: 'conta-default' },
    update: { nome: 'Escola de Dança Alusa' },
    create: { id: 'conta-default', nome: 'Escola de Dança Alusa', cpfCnpj: '00000000000191' }
  });

  await seedUsuarios(conta.id);
  await seedAlunos(conta.id);
  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
