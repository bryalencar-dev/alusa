import '@testing-library/jest-dom';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

// Silencia logs de pacotes externos ruidosos durante testes se necessário
const noisy = ['DATABASE_URL não definido'];
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args.map(a => (typeof a === 'string' ? a : '')).join(' ');
  if (noisy.some(n => msg.includes(n))) return;
  origWarn(...(args as []));
};

// Garante que as migrações foram aplicadas antes dos testes que tocam o banco.
async function ensureMigrations() {
  if (process.env.NODE_ENV !== 'test') return;
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Usuario') AS exists`);
    if (!rows[0]?.exists) {
      // aplica migrations uma vez
      execSync('pnpm prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() });
    }
  } catch {
    try { execSync('pnpm prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() }); } catch {/* ignore */}
  } finally {
    await prisma.$disconnect();
  }
}
// dispara sem bloquear (mas testes que usam DB aguardam naturalmente por queries)
await ensureMigrations();
