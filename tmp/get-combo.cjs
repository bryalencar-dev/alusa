const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = process.argv[2];
  if (!id) {
    console.error('Informe o ID do combo');
    process.exit(1);
  }
  try {
    const combo = await prisma.combo.findUnique({
      where: { id },
      include: { turmas: { include: { turma: true } } },
    });
    console.dir(combo, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
