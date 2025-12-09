const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.matricula.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        aluno: true,
        combo: true,
        plano: true,
        cobrancas: true,
      },
    });
    console.dir(rows, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
