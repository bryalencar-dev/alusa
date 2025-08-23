import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles básicas
  for (const roleName of [RoleName.ADMIN, RoleName.USER]) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });
  }

  const email = process.env.ADMIN_EMAIL || 'aluno@example.com';
  const senha = process.env.ADMIN_PASSWORD || 'senha123';
  const hash = await bcrypt.hash(senha, 10);

  // Tenta criar/atualizar no modelo User (schema atual)
  let seeded = false;
  try {
    const roleAdmin = await prisma.role.findFirst({ where: { name: RoleName.ADMIN } });
    const user = await prisma.user.upsert({
      where: { email },
      update: { senhaHash: hash, roleId: roleAdmin?.id || undefined },
      create: { email, senhaHash: hash, roleId: roleAdmin?.id || (await prisma.role.findFirst({ where: { name: RoleName.USER } }))!.id }
    });
    console.log('Seed User OK', user.email);
    seeded = true;
  } catch (e) {
    console.warn('Modelo User indisponível, tentando usuario:', (e as Error).message);
  }

  if (!seeded) {
    try {
      const anyPrisma = prisma as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (anyPrisma.usuario) {
        const res = await anyPrisma.usuario.upsert({
          where: { email },
          update: { senhaHash: hash, status: 'ATIVO' },
          create: { email, nome: 'Aluno Admin', senhaHash: hash, status: 'ATIVO' }
        });
        console.log('Seed Usuario OK', res.email);
      }
    } catch (e) {
      console.error('Falha seed usuario fallback:', (e as Error).message);
    }
  }

  console.log('Seed concluída.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });