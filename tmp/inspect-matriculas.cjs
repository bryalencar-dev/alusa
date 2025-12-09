const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.matricula.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        aluno: true,
        combo: true,
        plano: true,
        cobrancas: {
          select: {
            id: true,
            tipo: true,
            valor: true,
            status: true,
            formaPagamento: true,
            asaasPaymentId: true,
            asaasId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const simplified = rows.map((row) => ({
      id: row.id,
      aluno: row.aluno?.nome,
      combo: row.combo
        ? { nome: row.combo.nome, valor: row.combo.valor?.toString(), periodicidade: row.combo.periodicidade }
        : null,
      plano: row.plano ? { nome: row.plano.nome, valor: row.plano.valor?.toString() } : null,
      asaasSubscriptionId: row.asaasSubscriptionId,
      createdAt: row.createdAt,
      cobrancas: row.cobrancas.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        valor: c.valor.toString(),
        status: c.status,
        formaPagamento: c.formaPagamento,
        asaasPaymentId: c.asaasPaymentId,
        asaasId: c.asaasId,
        createdAt: c.createdAt,
      })),
    }));

    console.dir(simplified, { depth: null });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
