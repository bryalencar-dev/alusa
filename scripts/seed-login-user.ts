import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function run(){
  const prisma = new PrismaClient();
  const email = 'aluno@example.com';
  const senha = 'senha123';
  const existing = await prisma.user.findUnique({ where: { email } });
  if(!existing){
    const role = await prisma.role.findFirst();
    if(!role) throw new Error('Nenhuma role encontrada');
    await prisma.user.create({ data: { email, senhaHash: await bcrypt.hash(senha, 10), roleId: role.id } });
    console.log('Usuário seed criado');
  } else {
    console.log('Usuário já existe');
  }
  await prisma.$disconnect();
}
run();
