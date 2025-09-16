// Script de teste para criar um aluno
const dados = {
  "contaId": "conta-default", 
  "nome": "João Silva Teste",
  "dataNasc": "2000-01-15",
  "cpf": "12345678901",
  "email": "joao.teste@email.com",
  "telefone": "11987654321",
  "endereco": {
    "cep": "01234567",
    "logradouro": "Rua das Flores", 
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "uf": "SP"
  },
  "genero": "MASCULINO",
  "alergias": "Amendoim", 
  "restricoesMedicas": "Nenhuma",
  "contatoEmergenciaNome": "Maria Silva",
  "contatoEmergenciaTelefone": "11999888777",
  "consentimentoImagem": true,
  "consentimentoComunicacoes": true,
  "observacao": "Aluno teste do sistema"
};

console.log('Dados a serem enviados:', JSON.stringify(dados, null, 2));
