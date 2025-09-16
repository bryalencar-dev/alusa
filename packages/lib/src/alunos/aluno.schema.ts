import { z } from 'zod';

// Regex simples (pode ser substituído por validação mais robusta depois)
const cpfRegex = /^\d{11}$/;
const cepRegex = /^\d{8}$/;
const telRegex = /^\d{10,11}$/;
const onlyDigits = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);
const emptyOrNullToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);
const parseJsonIfString = (v: unknown) => {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};

export const enderecoSchema = z.object({
  cep: z.preprocess(onlyDigits, z.string().regex(cepRegex, 'CEP inválido')),
  logradouro: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.string().length(2),
});
// Versão flexível que aceita string JSON e converte para objeto antes de validar
export const enderecoSchemaFlexible = z.preprocess(parseJsonIfString, enderecoSchema);

export const responsavelSchema = z.object({
  nome: z.string().min(3),
  cpf: z.preprocess((v) => emptyOrNullToUndefined(onlyDigits(v)), z.string().regex(cpfRegex, 'CPF inválido')),
  email: z.preprocess(emptyOrNullToUndefined, z.string().email()),
  telefone: z.preprocess((v) => emptyOrNullToUndefined(onlyDigits(v)), z.string().regex(telRegex, 'Telefone inválido')),
  endereco: z.preprocess(parseJsonIfString, enderecoSchema.partial()).optional(),
  financeiro: z.boolean().default(true).optional(),
});

export const alunoBaseSchema = z.object({
  contaId: z.string(),
  nome: z.string().min(2, 'Nome obrigatório'),
  nomeSocial: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  dataNasc: z.coerce.date().refine(d => d <= new Date(), 'Data futura inválida'),
  cpf: z.preprocess((v) => emptyOrNullToUndefined(onlyDigits(v)), z.string().regex(cpfRegex, 'CPF inválido')).optional(),
  email: z.preprocess(emptyOrNullToUndefined, z.string().email()).optional(),
  telefone: z.preprocess((v) => emptyOrNullToUndefined(onlyDigits(v)), z.string().regex(telRegex, 'Telefone inválido')).optional(),
  endereco: z.preprocess(parseJsonIfString, enderecoSchema),
  observacao: z.preprocess(emptyOrNullToUndefined, z.string().max(1000)).optional(),
  foto: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  genero: z.preprocess(emptyOrNullToUndefined, z.enum(['MASCULINO','FEMININO','NAO_BINARIO','OUTRO','PREFERE_NAO_INFORMAR'])).optional(),
  modalidadePrincipal: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  nivel: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  alergias: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  restricoesMedicas: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  contatoEmergenciaNome: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  contatoEmergenciaTelefone: z.preprocess((v) => emptyOrNullToUndefined(onlyDigits(v)), z.string().regex(telRegex,'Telefone inválido')).optional(),
  origemCadastro: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  bolsaDescontoPercent: z.preprocess(emptyOrNullToUndefined, z.coerce.number().min(0).max(100)).optional(),
  isentoTaxaMatricula: z.boolean().optional(),
  consentimentoImagem: z.boolean().optional(),
  dataConsentimentoImagem: z.preprocess(emptyOrNullToUndefined, z.coerce.date()).optional(),
  consentimentoComunicacoes: z.boolean().optional(),
  tamanhoCamiseta: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  tamanhoCalcado: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  codigoInterno: z.preprocess(emptyOrNullToUndefined, z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ATIVO','INATIVO']).default('ATIVO').optional(),
  copiarEnderecoResponsavel: z.boolean().optional(),
  responsavel: responsavelSchema.partial().optional(),
});

const alunoRefined = alunoBaseSchema.superRefine((data, ctx) => {
  const idade = calcIdade(data.dataNasc);
  if (data.cpf && !cpfRegex.test(data.cpf)) {
    ctx.addIssue({ code: 'custom', message: 'CPF inválido' });
  }
  if (data.bolsaDescontoPercent && (data.bolsaDescontoPercent < 0 || data.bolsaDescontoPercent > 100)) {
    ctx.addIssue({ code: 'custom', message: 'Desconto deve estar entre 0 e 100%' });
  }
  if (idade < 18) {
    if (!data.responsavel) {
      ctx.addIssue({ code: 'custom', message: 'Responsável obrigatório para menores.' });
      return;
    }
    const required: (keyof typeof data.responsavel)[] = ['nome','cpf','email','telefone'];
    required.forEach(field => {
      if (!data.responsavel || !data.responsavel[field]) {
        ctx.addIssue({ code: 'custom', message: `Campo responsável ${String(field)} é obrigatório.` });
      }
    });
  }
});

export const alunoCreateSchema = alunoRefined;

export const alunoUpdateSchema = alunoBaseSchema.partial().extend({
  id: z.string(),
  motivoInativacao: z.string().optional(),
  dataInativacao: z.coerce.date().optional(),
});

export type AlunoCreateInput = z.infer<typeof alunoCreateSchema>;
export type AlunoUpdateInput = z.infer<typeof alunoUpdateSchema>;

export function calcIdade(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / 31557600000);
}
