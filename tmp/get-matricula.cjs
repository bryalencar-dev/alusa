const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = process.argv[2];
  if (!id) {
    console.error('Informe o ID da matrícula');
    process.exit(1);
  }
  try {
    const row = await prisma.matricula.findUnique({ where: { id } });
    console.dir(row, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
