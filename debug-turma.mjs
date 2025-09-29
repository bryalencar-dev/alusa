// Debug script: test turmas API
process.env.TEST_ROUTES_ENABLED = 'true';

const testAPI = async () => {
  try {
    console.log('=== Buscando Modalidades ===');
    const modalidadesRes = await fetch('http://localhost:3000/api/modalidades?contaId=conta-default');
    const modalidades = await modalidadesRes.json();
    console.log('Status:', modalidadesRes.status);
    console.log('Modalidades:', modalidades);

    console.log('\n=== Buscando Salas ===');
    const salasRes = await fetch('http://localhost:3000/api/salas?contaId=conta-default');
    const salas = await salasRes.json();
    console.log('Status:', salasRes.status);
    console.log('Salas:', salas);

    if (modalidades.data?.[0] && salas.data?.[0]) {
      console.log('\n=== Criando Turma ===');
      const turmaPayload = {
        contaId: 'conta-default',
        nome: 'Debug Turma Test',
        modalidadeId: modalidades.data[0].id,
        salaId: salas.data[0].id,
        diasSemana: ['SEG'],
        horaInicio: '10:00',
        horaFim: '11:00',
        capacidade: 15,
        status: 'ATIVO'
      };
      
      console.log('Payload:', JSON.stringify(turmaPayload, null, 2));
      
      const turmaRes = await fetch('http://localhost:3000/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turmaPayload)
      });
      
      const turmaResult = await turmaRes.json();
      console.log('Status:', turmaRes.status);
      console.log('Result:', turmaResult);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};

testAPI();