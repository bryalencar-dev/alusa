import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: 'aluno@example.com', nome: 'Aluno Admin', role: Role.ADMIN },
    { email: 'professor@example.com', nome: 'Professor', role: Role.PROFESSOR },
    { email: 'responsavel@example.com', nome: 'Responsavel', role: Role.RESPONSAVEL }
  ];
  let conta = await prisma.conta.findFirst({ where: { cpfCnpj: '00000000000' } });
  if (!conta) {
    conta = await prisma.conta.create({ data: { nome: 'Conta Seed', cpfCnpj: '00000000000' } });
  } else {
    conta = await prisma.conta.update({ where: { id: conta.id }, data: { nome: 'Conta Seed' } });
  }
  for (const u of users) {
    const senhaHash = await bcrypt.hash('SenhaFort3!', 10);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, role: u.role, senhaHash, contaId: conta.id },
      create: { email: u.email, nome: u.nome, role: u.role, senhaHash, contaId: conta.id }
    });
  }
  console.log('Seed concluído');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
