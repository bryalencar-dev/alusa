console.log('Testando API de alunos...');

const dados = {
  contaId: "conta-default",
  nome: "João Silva Teste API",
  dataNasc: "1995-05-15T00:00:00.000Z",
  email: "joao.api@email.com",
  telefone: "11987654321",
  endereco: {
    cep: "01234567",
    logradouro: "Rua das Flores",
    numero: "123",
    complemento: "Apto 45",
    bairro: "Centro", 
    cidade: "São Paulo",
    uf: "SP"
  },
  genero: "MASCULINO",
  consentimentoImagem: true,
  consentimentoComunicacoes: true,
  observacao: "Aluno teste do sistema via script"
};

fetch('http://localhost:3001/api/alunos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(dados)
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Resultado:', data);
})
.catch(error => {
  console.error('❌ Erro:', error);
});
