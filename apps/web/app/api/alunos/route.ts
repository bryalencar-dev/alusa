import { NextRequest, NextResponse } from 'next/server';
import { listAlunos, createAluno, alunoCreateSchema, type AlunoCreateInput } from '@alusa/lib';

// Util simples para limpar dígitos
const digits = (v: unknown) => typeof v === 'string' ? v.replace(/\D/g, '') : v;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contaId = searchParams.get('contaId') || 'conta-default';
    
    const alunos = await listAlunos(contaId);
    
    return NextResponse.json({
      success: true,
      items: alunos,
      total: alunos.length
    });
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar alunos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const contaId = raw.contaId || 'conta-default';

    // Adaptar payload flat do wizard (enderecoCep, enderecoLogradouro, ...) para o formato esperado pela lib (endereco: {...})
    const endereco = {
      cep: digits(raw.enderecoCep) || '',
      logradouro: raw.enderecoLogradouro || raw.enderecoLogradouro || 'Endereco',
      numero: raw.enderecoNumero || 'SN',
      complemento: raw.enderecoComplemento || undefined,
      bairro: raw.enderecoBairro || 'Bairro',
      cidade: raw.enderecoCidade || 'Cidade',
      uf: (raw.enderecoUf || 'SP').toString().slice(0,2).toUpperCase(),
    };

    // Normalizar responsavel (a lib espera campos diretos, endereço pode ser parcial)
    let responsavel = raw.responsavel;
    if (responsavel) {
      responsavel = {
        ...responsavel,
        cpf: digits(responsavel.cpf),
        telefone: digits(responsavel.telefone),
        endereco: responsavel.enderecoCep ? {
          cep: digits(responsavel.enderecoCep),
          logradouro: responsavel.enderecoLogradouro || 'Endereco',
          numero: responsavel.enderecoNumero || 'SN',
          complemento: responsavel.enderecoComplemento || undefined,
          bairro: responsavel.enderecoBairro || 'Bairro',
          cidade: responsavel.enderecoCidade || 'Cidade',
          uf: (responsavel.enderecoUf || 'SP').toString().slice(0,2).toUpperCase(),
        } : undefined
      };
    }

    const transformed = {
      contaId,
      nome: raw.nome,
      nomeSocial: raw.nomeSocial || undefined,
      dataNasc: raw.dataNasc ? (typeof raw.dataNasc === 'string' ? new Date(raw.dataNasc) : raw.dataNasc) : undefined,
      cpf: digits(raw.cpf),
      email: raw.email,
      telefone: digits(raw.telefone),
      endereco,
      observacao: raw.observacao || undefined,
      genero: raw.genero || undefined,
      modalidadePrincipal: raw.modalidadePrincipal || undefined,
      nivel: raw.nivel || undefined,
      alergias: raw.alergias || undefined,
      restricoesMedicas: raw.restricoesMedicas || undefined,
      contatoEmergenciaNome: raw.contatoEmergenciaNome || undefined,
      contatoEmergenciaTelefone: raw.contatoEmergenciaTelefone ? digits(raw.contatoEmergenciaTelefone) : undefined,
      origemCadastro: raw.origemCadastro || undefined,
      bolsaDescontoPercent: raw.bolsaDescontoPercent ?? undefined,
      isentoTaxaMatricula: raw.isentoTaxaMatricula ?? undefined,
      consentimentoImagem: raw.consentimentoImagem ?? undefined,
      dataConsentimentoImagem: raw.dataConsentimentoImagem ? new Date(raw.dataConsentimentoImagem) : undefined,
      consentimentoComunicacoes: raw.consentimentoComunicacoes ?? undefined,
      tamanhoCamiseta: raw.tamanhoCamiseta || undefined,
      tamanhoCalcado: raw.tamanhoCalcado || undefined,
      tags: raw.tags || undefined,
      status: raw.status || 'ATIVO',
      responsavel: responsavel || undefined,
      foto: raw.foto || undefined,
    };

    let parsed: AlunoCreateInput;
    try {
      parsed = alunoCreateSchema.parse(transformed);
    } catch (e) {
      const issues = (e as { issues?: Array<{ path: (string|number)[]; message: string }> }).issues;
      if (issues?.length) {
        const first = issues[0];
        return NextResponse.json({ error: first.message, field: first.path.join('.'), details: issues }, { status: 400 });
      }
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const aluno = await createAluno(parsed);
    return NextResponse.json(aluno, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    const msg: string = (error as Error).message || '';
    if (msg.includes('já existe') || msg.includes('já está em uso')) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
