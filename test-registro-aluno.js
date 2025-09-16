// Teste manual do fluxo de registro de aluno
// Para executar: node test-registro-aluno.js

const alunoData = {
  contaId: 1,
  nome: "João da Silva",
  dataNasc: "2010-05-15",
  endereco: {
    cep: "01001-000",
    logradouro: "Praça da Sé",
    numero: "123",
    bairro: "Sé",
    cidade: "São Paulo",
    uf: "SP"
  },
  responsavel: {
    nome: "Maria da Silva",
    cpf: "123.456.789-00",
    telefone: "(11) 99999-9999",
    endereco: {
      cep: "01001-000",
      logradouro: "Praça da Sé",
      numero: "123",
      bairro: "Sé",
      cidade: "São Paulo",
      uf: "SP"
    }
  },
  genero: "MASCULINO",
  status: "ATIVO"
};

async function testarRegistro() {
  try {
    console.log('🧪 Iniciando teste de registro de aluno...');
    console.log('📊 Dados do teste:', JSON.stringify(alunoData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/alunos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alunoData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registro criado com sucesso!');
      console.log('📄 Resposta:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Erro no registro:');
      console.log('🔍 Status:', response.status);
      console.log('🔍 Erro:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error.message);
  }
}

// Executar teste
testarRegistro();