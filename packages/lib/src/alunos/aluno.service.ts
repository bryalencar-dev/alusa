import { PrismaClient } from '@prisma/client';
import { prisma as shared } from '../prisma';
import type { AlunoCreateInput, AlunoUpdateInput } from './aluno.schema';
import { calcIdade } from './aluno.schema';
import {
  digits,
  nullifyEmpty,
  flattenAlunoEndereco,
  flattenResponsavelEndereco,
} from './map-flatten';

const prisma: PrismaClient = shared as unknown as PrismaClient;

export async function listAlunos(contaId: string) {
  return prisma.aluno.findMany({
    where: { contaId },
    orderBy: { createdAt: 'desc' },
    include: {
      responsaveis: {
        include: {
          responsavel: true,
        },
      },
    },
  });
}

type AlunoExtraFields = Partial<{
  nomeSocial: string;
  cpf: string;
  genero: 'MASCULINO' | 'FEMININO' | 'NAO_BINARIO' | 'OUTRO' | 'PREFERE_NAO_INFORMAR';
  modalidadePrincipal: string;
  nivel: string;
  alergias: string;
  restricoesMedicas: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  origemCadastro: string;
  bolsaDescontoPercent: number;
  isentoTaxaMatricula: boolean;
  consentimentoImagem: boolean;
  dataConsentimentoImagem: Date;
  consentimentoComunicacoes: boolean;
  tamanhoCamiseta: string;
  tamanhoCalcado: string;
  codigoInterno: string;
  tags: string[];
  foto: string;
}>;

export async function createAluno(data: AlunoCreateInput & AlunoExtraFields) {
  const idade = calcIdade(data.dataNasc);

  // Normalizar dados de entrada
  // Aceitar casos onde endereco (ou responsavel.endereco) chegam como string JSON
  const enderecoObj = ((): AlunoCreateInput['endereco'] | undefined => {
    const val = (data as unknown as { endereco?: unknown }).endereco;
    if (!val) return undefined;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        /* ignore parse error */ return undefined;
      }
    }
    return val as AlunoCreateInput['endereco'];
  })();
  const responsavelEnderecoObj = ((): AlunoCreateInput['endereco'] | undefined => {
    const r = (data as unknown as { responsavel?: { endereco?: unknown } }).responsavel;
    if (!r || typeof r !== 'object') return undefined;
    const val = r.endereco;
    if (!val) return undefined;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        /* ignore */ return undefined;
      }
    }
    return val as AlunoCreateInput['endereco'];
  })();

  const normalizedData = {
    ...data,
    cpf: digits(data.cpf),
    telefone: digits(data.telefone),
    contatoEmergenciaTelefone: digits(data.contatoEmergenciaTelefone),
    endereco: enderecoObj
      ? {
          ...enderecoObj,
          cep: digits(enderecoObj.cep),
        }
      : undefined,
    responsavel: data.responsavel
      ? {
          ...data.responsavel,
          cpf: digits(data.responsavel.cpf),
          telefone: digits(data.responsavel.telefone),
          endereco: responsavelEnderecoObj
            ? {
                ...responsavelEnderecoObj,
                cep: digits(responsavelEnderecoObj.cep),
              }
            : undefined,
        }
      : undefined,
  };

  console.log('🏗️ Criando aluno:', {
    nome: normalizedData.nome,
    cpf: normalizedData.cpf ? `${normalizedData.cpf.slice(0, 3)}***` : 'não informado',
    idade,
    temResponsavel: !!(idade < 18 && normalizedData.responsavel?.cpf),
  });

  return prisma.$transaction(async (tx) => {
    // 1. Verificar se a conta existe
    const conta = await tx.conta.findUnique({ where: { id: normalizedData.contaId } });
    if (!conta) {
      throw new Error(`Conta com ID ${normalizedData.contaId} não encontrada`);
    }

    // 2. Verificar duplicatas de CPF se fornecido
    if (normalizedData.cpf) {
      const existingAluno = await tx.aluno.findUnique({ where: { cpf: normalizedData.cpf } });
      if (existingAluno) {
        throw new Error(`Aluno com CPF ${normalizedData.cpf} já existe`);
      }
    }

    // 3. Verificar duplicatas de email por conta se fornecido
    if (normalizedData.email) {
      const existingEmail = await tx.aluno.findUnique({
        where: { contaId_email: { contaId: normalizedData.contaId, email: normalizedData.email } },
      });
      if (existingEmail) {
        throw new Error(`Email ${normalizedData.email} já está em uso nesta conta`);
      }
    }

    // 4. Processar responsável se menor de idade
    let responsavelId: string | undefined;
    if (idade < 18 && normalizedData.responsavel && normalizedData.responsavel.cpf) {
      const existing = await tx.responsavel.findFirst({
        where: { cpf: normalizedData.responsavel.cpf },
      });
      if (existing) {
        // Atualizar dados do responsável existente se necessário
        await tx.responsavel.update({
          where: { id: existing.id },
          data: {
            nome: normalizedData.responsavel.nome!,
            email: normalizedData.responsavel.email!,
            telefone: normalizedData.responsavel.telefone!,
            // Campos de endereço estruturados
            enderecoCep: normalizedData.responsavel.endereco?.cep || existing.enderecoCep,
            enderecoLogradouro:
              normalizedData.responsavel.endereco?.logradouro || existing.enderecoLogradouro,
            enderecoNumero: normalizedData.responsavel.endereco?.numero || existing.enderecoNumero,
            enderecoComplemento:
              normalizedData.responsavel.endereco?.complemento || existing.enderecoComplemento,
            enderecoBairro: normalizedData.responsavel.endereco?.bairro || existing.enderecoBairro,
            enderecoCidade: normalizedData.responsavel.endereco?.cidade || existing.enderecoCidade,
            enderecoUf: normalizedData.responsavel.endereco?.uf || existing.enderecoUf,
            financeiro: normalizedData.responsavel.financeiro ?? existing.financeiro,
          },
        });
        responsavelId = existing.id;
      } else {
        // Verificar se email do responsável já existe
        if (normalizedData.responsavel.email) {
          const existingRespEmail = await tx.responsavel.findUnique({
            where: { email: normalizedData.responsavel.email },
          });
          if (existingRespEmail) {
            throw new Error(
              `Email do responsável ${normalizedData.responsavel.email} já está em uso`,
            );
          }
        }

        const resp = await tx.responsavel.create({
          data: {
            nome: normalizedData.responsavel.nome!,
            cpf: normalizedData.responsavel.cpf!,
            email: normalizedData.responsavel.email!,
            telefone: normalizedData.responsavel.telefone!,
            // Campos de endereço estruturados
            enderecoCep: normalizedData.responsavel.endereco?.cep || undefined,
            enderecoLogradouro: normalizedData.responsavel.endereco?.logradouro || undefined,
            enderecoNumero: normalizedData.responsavel.endereco?.numero || undefined,
            enderecoComplemento: normalizedData.responsavel.endereco?.complemento || undefined,
            enderecoBairro: normalizedData.responsavel.endereco?.bairro || undefined,
            enderecoCidade: normalizedData.responsavel.endereco?.cidade || undefined,
            enderecoUf: normalizedData.responsavel.endereco?.uf || undefined,
            financeiro: normalizedData.responsavel.financeiro ?? true,
          },
        });
        responsavelId = resp.id;
      }
    }

    // 5. Gerar código interno sequencial se não fornecido
    let codigoInterno = normalizedData.codigoInterno;
    if (!codigoInterno) {
      const last = await tx.aluno.findFirst({
        where: { contaId: normalizedData.contaId, codigoInterno: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { codigoInterno: true },
      });
      const nextNumber = last?.codigoInterno
        ? parseInt(last.codigoInterno.replace(/\D/g, '')) + 1
        : 1;
      codigoInterno = String(nextNumber).padStart(5, '0');
    }

    // 6. Verificar se código interno já existe por conta
    if (codigoInterno) {
      const existingCodigo = await tx.aluno.findUnique({
        where: { contaId_codigoInterno: { contaId: normalizedData.contaId, codigoInterno } },
      });
      if (existingCodigo) {
        // Gerar novo código automaticamente
        const last = await tx.aluno.findFirst({
          where: { contaId: normalizedData.contaId, codigoInterno: { not: null } },
          orderBy: { createdAt: 'desc' },
          select: { codigoInterno: true },
        });
        const nextNumber = last?.codigoInterno
          ? parseInt(last.codigoInterno.replace(/\D/g, '')) + 1
          : 1;
        codigoInterno = String(nextNumber).padStart(5, '0');
      }
    }

    // 7. Preparar dados do aluno com defaults seguros
    const alunoData = {
      contaId: normalizedData.contaId,
      nome: normalizedData.nome.trim(),
      nomeSocial: nullifyEmpty(normalizedData.nomeSocial ?? undefined),
      dataNasc: normalizedData.dataNasc,
      cpf: normalizedData.cpf || undefined,
      email: normalizedData.email?.trim().toLowerCase() || undefined,
      telefone: normalizedData.telefone || undefined,
      foto: nullifyEmpty(normalizedData.foto ?? undefined),
      // Endereço (flatten)
      ...flattenAlunoEndereco({ endereco: normalizedData.endereco ?? null }),
      observacao: nullifyEmpty(normalizedData.observacao ?? undefined),
      genero: normalizedData.genero || undefined,
      modalidadePrincipal: nullifyEmpty(normalizedData.modalidadePrincipal ?? undefined),
      nivel: nullifyEmpty(normalizedData.nivel ?? undefined),
      alergias: nullifyEmpty(normalizedData.alergias ?? undefined),
      restricoesMedicas: nullifyEmpty(normalizedData.restricoesMedicas ?? undefined),
      contatoEmergenciaNome: nullifyEmpty(normalizedData.contatoEmergenciaNome ?? undefined),
      contatoEmergenciaTelefone: normalizedData.contatoEmergenciaTelefone || undefined,
      origemCadastro: normalizedData.origemCadastro?.trim() || 'MANUAL',
      bolsaDescontoPercent: normalizedData.bolsaDescontoPercent || undefined,
      isentoTaxaMatricula: normalizedData.isentoTaxaMatricula ?? false,
      consentimentoImagem: normalizedData.consentimentoImagem ?? false,
      dataConsentimentoImagem: normalizedData.consentimentoImagem
        ? normalizedData.dataConsentimentoImagem || new Date()
        : undefined,
      consentimentoComunicacoes: normalizedData.consentimentoComunicacoes ?? true,
      tamanhoCamiseta: nullifyEmpty(normalizedData.tamanhoCamiseta ?? undefined),
      tamanhoCalcado: nullifyEmpty(normalizedData.tamanhoCalcado ?? undefined),
      codigoInterno,
      tags: normalizedData.tags || [],
      status: (normalizedData.status as 'ATIVO' | 'INATIVO') ?? 'ATIVO',
    };

    // 8. Criar o aluno
    const aluno = await tx.aluno.create({ data: alunoData });

    // 9. Vincular responsável se necessário
    if (responsavelId) {
      await tx.alunoResponsavel.create({
        data: { alunoId: aluno.id, responsavelId, tipoVinculo: 'PRINCIPAL' },
      });
      console.log('🔗 Responsável vinculado ao aluno');
    }

    console.log('✅ Aluno criado com sucesso:', {
      id: aluno.id,
      codigo: aluno.codigoInterno,
      nome: aluno.nome,
    });

    return aluno;
  });
}

type MaybeEndereco = { endereco?: Partial<AlunoCreateInput['endereco']> };
type UpdateAlunoWithResponsavel = AlunoUpdateInput &
  MaybeEndereco & {
    responsavel?: Partial<{
      nome: string;
      cpf: string;
      email: string;
      telefone: string;
      endereco?: Partial<{
        cep: string;
        logradouro: string;
        numero: string;
        complemento?: string;
        bairro: string;
        cidade: string;
        uf: string;
      }>;
    }>;
  };
export async function updateAluno(data: UpdateAlunoWithResponsavel) {
  const { id, endereco, responsavel, ...rest } = data;

  // Normalizações leves
  const normEmail = (v?: string | null) =>
    typeof v === 'string' ? v.trim().toLowerCase() : (v ?? undefined);
  const digits = (v?: string | null) =>
    typeof v === 'string' ? v.replace(/\D/g, '') : (v ?? undefined);

  // Preparar campos de endereço do aluno se fornecidos (flatten)
  const enderecoFields = endereco ? flattenAlunoEndereco({ endereco }) : {};

  return prisma.$transaction(async (tx) => {
    // Atualiza aluno em si
    const aluno = await tx.aluno.update({
      where: { id },
      data: {
        ...rest,
        email: normEmail(rest.email),
        telefone: digits(rest.telefone),
        cpf: digits(rest.cpf),
        contatoEmergenciaTelefone: digits(rest.contatoEmergenciaTelefone),
        ...enderecoFields,
      },
    });

    // Atualiza/cria responsável se enviado
    if (responsavel && Object.keys(responsavel).length > 0) {
      // Existe vínculo atual?
      const vinc = await tx.alunoResponsavel.findFirst({ where: { alunoId: id } });
      if (vinc) {
        const respUpdateData: Record<string, unknown> = {};
        if (typeof responsavel.nome === 'string') respUpdateData.nome = responsavel.nome;
        {
          const v = digits(responsavel.cpf);
          if (v) respUpdateData.cpf = v;
        }
        {
          const v = normEmail(responsavel.email);
          if (v) respUpdateData.email = v;
        }
        {
          const v = digits(responsavel.telefone);
          if (v) respUpdateData.telefone = v;
        }
        if (responsavel.endereco)
          Object.assign(
            respUpdateData,
            flattenResponsavelEndereco({ endereco: responsavel.endereco }),
          );
        if (Object.keys(respUpdateData).length > 0) {
          await tx.responsavel.update({ where: { id: vinc.responsavelId }, data: respUpdateData });
        }
      } else {
        // cria novo responsável e vincula
        const nome = responsavel.nome?.trim();
        const cpf = digits(responsavel.cpf);
        const email = normEmail(responsavel.email);
        const telefone = digits(responsavel.telefone);
        if (nome && cpf && email && telefone) {
          const resp = await tx.responsavel.create({
            data: {
              nome,
              cpf,
              email,
              telefone,
              ...flattenResponsavelEndereco({ endereco: responsavel.endereco ?? null }),
              financeiro: true,
            },
          });
          await tx.alunoResponsavel.create({
            data: { alunoId: id, responsavelId: resp.id, tipoVinculo: 'PRINCIPAL' },
          });
        }
      }
    }

    return aluno;
  });
}

export async function getAluno(id: string) {
  return prisma.aluno.findUnique({
    where: { id },
    include: {
      responsaveis: { include: { responsavel: true } },
    },
  });
}

export async function deleteAluno(id: string, motivo?: string) {
  console.log('🗑️ Excluindo aluno definitivamente', { id, motivo: motivo?.slice(0, 120) });
  return prisma.$transaction(async (tx) => {
    // Remover vínculos com responsáveis para evitar erro de FK
    await tx.alunoResponsavel.deleteMany({ where: { alunoId: id } });
    // TODO: remover matrículas/presenças no futuro
    const deleted = await tx.aluno.delete({ where: { id } });
    return deleted;
  });
}

export async function reactivateAluno(id: string) {
  return prisma.aluno.update({
    where: { id },
    data: {
      status: 'ATIVO',
      motivoInativacao: null,
      dataInativacao: null,
    },
  });
}
