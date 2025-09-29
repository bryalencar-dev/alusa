async function main() {
  const res = await fetch('http://localhost:3000/api/planos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contaId: '038ae23c-7964-4a01-a985-0026bd346fea',
      nome: 'Teste Curl',
      descricao: null,
      periodicidade: 'MENSAL',
      valor: '150.00',
      status: 'ATIVO',
    }),
  });
  console.log('status', res.status);
  console.log(await res.text());
}

main().catch((err) => {
  console.error('error', err);
  process.exit(1);
});
