import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

export default async function globalSetup() {
  const prisma = new PrismaClient();
  try {
    // Garantir roles básicas
    for (const roleName of [RoleName.ADMIN, RoleName.USER]) {
      await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
      });
    }
    const email = 'aluno@example.com';
    const senha = 'senha123';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      // pegar primeiro role USER
      const role = await prisma.role.findFirst({ where: { name: RoleName.USER } });
      if (!role) throw new Error('Role USER não encontrada após upsert.');
      await prisma.user.create({
        data: {
          email,
          senhaHash: await bcrypt.hash(senha, 10),
          roleId: role.id
        }
      });
      console.log('[globalSetup] Usuário de teste criado');
    } else {
      console.log('[globalSetup] Usuário de teste já existe');
    }
  } finally {
    await prisma.$disconnect();
  }
}
