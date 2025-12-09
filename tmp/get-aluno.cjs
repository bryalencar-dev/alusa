const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const id = process.argv[2];
  if (!id) {
    console.error('Informe o ID do aluno');
    process.exit(1);
  }
  try {
    const aluno = await prisma.aluno.findUnique({ where: { id } });
    console.dir(aluno, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
