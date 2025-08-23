import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - types podem não estar instalados
import archiver from 'archiver';

// Lista de caminhos relativos a partir da raiz do repo
const TARGETS = [
  'prisma/schema.prisma',
  'apps/web/auth.config.ts',
  'apps/web/pages/api/auth/[...nextauth].ts',
  'apps/web/lib/auth', // pasta
  'apps/web/middleware.ts',
  'apps/web/app/(auth)/login/page.tsx',
  'apps/web/app/api/test/_guard.ts',
  'apps/web/tests/e2e/utils/auth.ts',
  'apps/web/tests/e2e/flow.spec.ts',
  'apps/web/tests/e2e/logout-flow.spec.ts',
  'playwright.config.ts'
];

async function fileExists(p: string) {
  try { await fs.promises.access(p, fs.constants.F_OK); return true; } catch { return false; }
}

async function addFileOrDir(archive: archiver.Archiver, absPath: string, relPath: string) {
  const stat = await fs.promises.stat(absPath);
  if (stat.isDirectory()) {
    const entries = await fs.promises.readdir(absPath);
    for (const entry of entries) {
      const childAbs = path.join(absPath, entry);
      const childRel = path.join(relPath, entry);
      await addFileOrDir(archive, childAbs, childRel);
    }
  } else {
    archive.file(absPath, { name: relPath.replace(/\\/g, '/') });
  }
}

async function run() {
  const root = process.cwd();
  const outPath = path.join(root, 'alusa-debug.zip');

  if (await fileExists(outPath)) {
    await fs.promises.unlink(outPath);
  }

  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log('✅ Arquivo alusa-debug.zip gerado com sucesso');
  });
  archive.on('warning', (err: unknown) => {
    const e = err as { code?: string; message?: string };
    if (e.code === 'ENOENT') {
      console.warn('Aviso (ignorado):', e.message);
      return;
    }
    throw err;
  });
  archive.on('error', (err) => { throw err; });

  archive.pipe(output);

  for (const rel of TARGETS) {
    const abs = path.join(root, rel);
    if (!(await fileExists(abs))) {
      console.warn(`⚠️  Ausente: ${rel}`);
      continue;
    }
    await addFileOrDir(archive, abs, rel);
  }

  await archive.finalize();
}

run().catch(err => {
  console.error('Erro ao gerar zip:', err);
  process.exit(1);
});
