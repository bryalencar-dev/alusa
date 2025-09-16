import { NextResponse } from 'next/server';
import { alunoCreateSchema, createAluno, listAlunos } from '@alusa/lib';

// Garante que este endpoint nunca seja cacheado pelo Next.js/Edge
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const contaId = url.searchParams.get('contaId') ?? 'conta-default';
  const alunos = await listAlunos(contaId);
  return new NextResponse(JSON.stringify(alunos), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export async function POST(req: Request) {
  if (process.env.TEST_ROUTES_ENABLED === 'true') {
    // Atalho em ambiente de teste E2E: não toca no Prisma
    const body = await req.json().catch(() => ({}));
    const mock = {
      id: 'test-aluno-' + Math.random().toString(36).slice(2, 8),
      nome: body?.nome ?? 'Aluno Teste',
      email: body?.email ?? null,
      cpf: body?.cpf ?? null,
      telefone: body?.telefone ?? null,
      status: body?.status ?? 'ATIVO',
      foto: body?.foto ?? null,
      codigoInterno: body?.codigoInterno ?? '00001',
    };
    return NextResponse.json(mock, { status: 201 });
  }

  try {
    // Parsear e validar dados
    const body = await req.json().catch(() => {
      throw new Error('Dados inválidos. Verifique o formato JSON.');
    });

    console.log('📥 Recebendo dados para criação de aluno:', { 
      nome: body.nome,
      temCpf: !!body.cpf,
      temEmail: !!body.email,
      temResponsavel: !!body.responsavel,
      temEndereco: !!body.endereco,
      temFoto: !!body.foto,
      consentimentoImagem: body.consentimentoImagem 
    });
    
    // Utilitário: limpar null -> undefined profundamente
    const deepNullToUndefined = (v: unknown): unknown => {
      if (v === null) return undefined;
      if (Array.isArray(v)) return v.map(deepNullToUndefined);
      if (v && typeof v === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v)) out[k] = deepNullToUndefined(val);
        return out;
      }
      return v;
    };

    // Parse seguro de endereço se vier como string JSON
    const parseEnderecoIfString = (v: unknown) => {
      if (!v) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } }
      return v;
    };

    const cleaned = deepNullToUndefined(body) as Record<string, unknown>;
    if (cleaned.endereco) cleaned.endereco = parseEnderecoIfString(cleaned.endereco) as unknown;
    if (cleaned.responsavel && typeof cleaned.responsavel === 'object') {
      const r = cleaned.responsavel as Record<string, unknown>;
      if (r.endereco) r.endereco = parseEnderecoIfString(r.endereco) as unknown;
      cleaned.responsavel = r;
    }

    // Normalizar dados antes da validação
    const normalizeResponsavel = (v: unknown) => {
      if (!v || typeof v !== 'object') return undefined;
      const r = v as Record<string, unknown>;
      return {
        ...r,
        nome: typeof r.nome === 'string' ? r.nome.trim() : r.nome,
        email: typeof r.email === 'string' ? r.email.trim().toLowerCase() : r.email,
        cpf: typeof r.cpf === 'string' ? r.cpf.replace(/\D/g, '') : r.cpf,
        telefone: typeof r.telefone === 'string' ? r.telefone.replace(/\D/g, '') : r.telefone,
      };
    };

    const normalizedData = {
  ...cleaned,
      // Normalizar strings
  nome: typeof cleaned.nome === 'string' ? cleaned.nome.trim() : cleaned.nome,
  nomeSocial: typeof cleaned.nomeSocial === 'string' ? cleaned.nomeSocial.trim() : cleaned.nomeSocial,
  email: typeof cleaned.email === 'string' ? cleaned.email.trim().toLowerCase() : cleaned.email,
  cpf: typeof cleaned.cpf === 'string' ? cleaned.cpf.replace(/\D/g, '') : cleaned.cpf,
  telefone: typeof cleaned.telefone === 'string' ? cleaned.telefone.replace(/\D/g, '') : cleaned.telefone,
      
      // Auto-gerar data de consentimento se consentimentoImagem for true
      dataConsentimentoImagem: cleaned.consentimentoImagem ? 
        ((cleaned.dataConsentimentoImagem as string | undefined) || new Date().toISOString()) : 
        undefined,
      
      // Normalizar dados do responsável
      responsavel: normalizeResponsavel(cleaned.responsavel),
    };
    
    // Validar com Zod
    const parsed = alunoCreateSchema.parse(normalizedData);
    console.log('✅ Dados validados com sucesso');
    
    // Criar aluno
    const aluno = await createAluno(parsed);
    console.log('🎉 Aluno criado e salvo no banco:', aluno.id);
    
    return NextResponse.json(aluno, { status: 201 });

  } catch (err: unknown) {
    console.error('❌ Erro ao criar aluno:', err);
    
    const error = err as { 
      code?: string; 
      meta?: { target?: string[] }; 
      message?: string;
      issues?: Array<{ path: string[]; message: string }>;
    };
    
    // Erros de validação Zod
    if (error.issues) {
      const firstIssue = error.issues[0];
      const field = firstIssue.path.join('.');
      return NextResponse.json({ 
        error: `Erro no campo ${field}: ${firstIssue.message}`,
        field,
        details: error.issues
      }, { status: 400 });
    }
    
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      const fieldMessages: Record<string, string> = {
        cpf: 'CPF já está cadastrado no sistema.',
        email: 'Email já está em uso.',
        codigoInterno: 'Código interno já existe.',
      };
      const message = fieldMessages[field || ''] || 'Dados duplicados.';
      return NextResponse.json({ error: message, field }, { status: 409 });
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Conta não encontrada. Verifique os dados.' 
      }, { status: 404 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Registro não encontrado.' 
      }, { status: 404 });
    }
    
    // Erro genérico
    const message = error.message || 'Erro interno do servidor.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
