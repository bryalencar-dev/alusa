import { execSync } from 'node:child_process';

export function resetDb() {
  try {
    execSync('pnpm prisma migrate reset --force --skip-generate --skip-seed', { stdio: 'inherit', cwd: process.cwd() + '/../../..' });
  } catch (e) {
    console.error('Erro reset DB', e);
    throw e;
  }
}
