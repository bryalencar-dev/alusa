import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createAluno, listAlunos } from './aluno.service';

const prisma = new PrismaClient();

describe('Aluno Service', () => {
  const contaId = 'conta-default';

  beforeAll(async () => {
    // garante conta existente
    await prisma.conta.upsert({
      where: { id: contaId },
      update: { nome: 'Conta Teste' },
      create: { id: contaId, nome: 'Conta Teste', cpfCnpj: '99999999999999' }
    });
    
    // Limpar dados de teste (ordem importa por causa das FKs)
    await prisma.alunoResponsavel.deleteMany({ where: { aluno: { contaId } } });
    await prisma.aluno.deleteMany({ where: { contaId } });
    await prisma.responsavel.deleteMany({ where: { cpf: { in: ['12345678901', '98765432100'] } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria e lista alunos', async () => {
    await createAluno({
      contaId,
      nome: 'Teste Unit',
      dataNasc: new Date('2005-01-01'),
      endereco: { cep: '01001000', logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'SP', uf: 'SP' }
    });
    const alunos = await listAlunos(contaId);
    expect(alunos.length).toBeGreaterThan(0);
    expect(alunos[0].nome).toBe('Teste Unit');
  });

  it('gera codigoInterno sequencial', async () => {
    // Limpar dados de teste
    await prisma.alunoResponsavel.deleteMany({ where: { aluno: { contaId } } });
    await prisma.aluno.deleteMany({ where: { contaId } });
    
    const endereco = { cep: '01001000', logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'SP', uf: 'SP' };
    const a1 = await createAluno({ contaId, nome: 'Aluno 1', dataNasc: new Date('2010-02-02'), endereco });
    const a2 = await createAluno({ contaId, nome: 'Aluno 2', dataNasc: new Date('2011-03-03'), endereco });
    expect(a1.codigoInterno).toBeDefined();
    expect(a2.codigoInterno).toBeDefined();
    expect(Number(a2.codigoInterno) - Number(a1.codigoInterno)).toBe(1);
    expect(a1.codigoInterno?.length).toBeGreaterThanOrEqual(5);
  });

  it('cria aluno menor com responsável', async () => {
    const endereco = { cep: '01001000', logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'SP', uf: 'SP' };
    const aluno = await createAluno({
      contaId,
      nome: 'João Silva',
      dataNasc: new Date('2015-05-15'), // menor de idade
      endereco,
      responsavel: {
        nome: 'Maria Silva',
        cpf: '12345678901',
        email: 'maria@example.com',
        telefone: '11999999999',
        endereco,
        financeiro: true,
      }
    });
    
    expect(aluno.nome).toBe('João Silva');
    
    // Verificar se responsável foi criado e vinculado
    const alunoComResponsavel = await prisma.aluno.findUnique({
      where: { id: aluno.id },
      include: {
        responsaveis: {
          include: { responsavel: true }
        }
      }
    });
    
    expect(alunoComResponsavel?.responsaveis).toHaveLength(1);
    expect(alunoComResponsavel?.responsaveis[0].responsavel.nome).toBe('Maria Silva');
    expect(alunoComResponsavel?.responsaveis[0].responsavel.cpf).toBe('12345678901');
  });

  it('trata consentimento de imagem corretamente', async () => {
    const endereco = { cep: '01001000', logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'SP', uf: 'SP' };
    
    // Aluno com consentimento
    const alunoComConsentimento = await createAluno({
      contaId,
      nome: 'Ana Costa',
      dataNasc: new Date('2000-01-01'),
      endereco,
      consentimentoImagem: true,
      dataConsentimentoImagem: new Date('2024-01-15'),
    });
    
    expect(alunoComConsentimento.consentimentoImagem).toBe(true);
    expect(alunoComConsentimento.dataConsentimentoImagem).toBeDefined();
    
    // Aluno sem consentimento
    const alunoSemConsentimento = await createAluno({
      contaId,
      nome: 'Pedro Santos',
      dataNasc: new Date('2000-01-01'),
      endereco,
      consentimentoImagem: false,
    });
    
    expect(alunoSemConsentimento.consentimentoImagem).toBe(false);
    expect(alunoSemConsentimento.dataConsentimentoImagem).toBeNull();
  });

  it('normaliza CPF e telefone corretamente', async () => {
    const endereco = { cep: '01001000', logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'SP', uf: 'SP' };
    const aluno = await createAluno({
      contaId,
      nome: 'Carlos Teste',
      dataNasc: new Date('2000-01-01'),
      endereco,
      cpf: '123.456.789-01', // com pontuação
      telefone: '(11) 99999-9999', // com formatação
    });
    
    // Buscar diretamente no banco para verificar normalização
    const alunoDb = await prisma.aluno.findUnique({ where: { id: aluno.id } });
    expect(alunoDb?.cpf).toBe('12345678901'); // sem pontuação
    expect(alunoDb?.telefone).toBe('11999999999'); // sem formatação
  });
});
