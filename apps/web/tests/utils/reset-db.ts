import { PrismaClient } from '@prisma/client';

// Reset DB truncando tabelas (exceto migrations)
export async function resetDb(prisma?: PrismaClient) {
  const env = process.env.NODE_ENV;
  if (env !== 'test') throw new Error('resetDb apenas em NODE_ENV=test');
  const client = prisma || new PrismaClient();
  const rows = await client.$queryRawUnsafe<{ tablename: string }[]>(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('_prisma_migrations')"
  );
  if (rows.length) {
    const tables = rows.map(r => '"' + r.tablename + '"').join(', ');
    await client.$executeRawUnsafe('SET session_replication_role = replica;');
    await client.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
    await client.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
  }
  if (!prisma) await client.$disconnect();
}