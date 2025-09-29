import { describe, it } from 'vitest';

describe('POST /api/turmas debug', () => {
  it('should create turma with valid payload', async () => {
    // Simular payload que vem do wizard
    const payload = {
      contaId: 'conta-default',
      nome: 'Test Turma Debug',
      modalidadeId: 'unknown', // this will help us see the actual modalidade IDs
      salaId: 'unknown', // this will help us see the actual sala IDs
      diasSemana: ['SEG'],
      horaInicio: '08:00',
      horaFim: '09:00',
      capacidade: 10,
      status: 'ATIVO',
    };

    console.log('Testing payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('http://localhost:3000/api/turmas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));

    // First let's see what we get
    // expect(response.status).toBe(201);
  });

  it('should list modalidades for debugging', async () => {
    const response = await fetch('http://localhost:3000/api/modalidades?contaId=conta-default');
    const data = await response.json();
    console.log('Modalidades:', JSON.stringify(data, null, 2));
  });

  it('should list salas for debugging', async () => {
    const response = await fetch('http://localhost:3000/api/salas?contaId=conta-default');
    const data = await response.json();
    console.log('Salas:', JSON.stringify(data, null, 2));
  });
});
