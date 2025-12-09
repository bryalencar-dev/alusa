import '@testing-library/jest-dom';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import path from 'node:path';

// ⚠️ CRITICAL: Testes DEVEM ser executados com .env.test carregado via dotenv-cli
// Comando correto: pnpm test:unit (já configurado no package.json)
// Isso garante que TODOS os testes usem o banco de teste, NUNCA o de desenvolvimento

const projectDir = path.resolve(__dirname, '..', '..', '..');

// ⚠️ VALIDAÇÃO: Garante que está usando banco de teste
if (!process.env.DATABASE_URL?.includes('alusa_test')) {
  throw new Error(
    '❌ ERRO CRÍTICO: DATABASE_URL não está apontando para o banco de teste!\n' +
      'Esperado: postgresql://...alusa_test...\n' +
      `Atual: ${process.env.DATABASE_URL}\n\n` +
      'Para corrigir:\n' +
      '1. Certifique-se que .env.test existe\n' +
      '2. Execute: pnpm db:migrate:test\n' +
      '3. Execute: pnpm test:unit\n',
  );
}

console.log('✅ Usando banco de teste:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));

// Silencia logs de pacotes externos ruidosos durante testes
const noisy = ['DATABASE_URL não definido'];
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
  if (noisy.some((n) => msg.includes(n))) return;
  origWarn(...(args as []));
};

// Garante que as migrações foram aplicadas antes dos testes que tocam o banco.
async function ensureMigrations() {
  const prisma = new PrismaClient();
  try {
    console.log('🔍 Verificando migrações no banco de teste...');
    const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Usuario') AS exists`,
    );

    if (!rows[0]?.exists) {
      console.log('⚠️  Tabelas não encontradas. Aplicando migrações...');
    } else {
      console.log('✅ Estrutura base encontrada. Aplicando migrações pendentes...');
    }

    execSync('pnpm prisma migrate deploy --schema=prisma/schema.prisma', {
      stdio: 'inherit',
      cwd: projectDir,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
    console.log('✅ Migrações sincronizadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao verificar/aplicar migrações:', error);
    try {
      console.log('🔄 Tentando aplicar migrações novamente...');
      execSync('pnpm prisma migrate deploy --schema=prisma/schema.prisma', {
        stdio: 'inherit',
        cwd: projectDir,
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      });
      console.log('✅ Migrações aplicadas!');
    } catch (retryError) {
      console.error('❌ Falha ao aplicar migrações:', retryError);
      throw retryError;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Aplica migrações antes de iniciar os testes
await ensureMigrations();
