const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = process.argv[2];
  if (!id) {
    console.error('Informe o ID da matrícula');
    process.exit(1);
  }
  try {
    const logs = await prisma.matriculaLog.findMany({
      where: { matriculaId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    console.dir(
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
      { depth: null },
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
