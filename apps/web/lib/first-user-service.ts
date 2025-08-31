import { PrismaClient, Role, type Usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma: PrismaClient = new PrismaClient();

export interface FirstUserInput {
  escolaNome: string;
  cpfCnpj: string;
  nome: string;
  email: string;
  senha: string;
}

export class EmailInUseError extends Error { constructor(){ super('E-mail já está em uso.'); } }
export class CpfCnpjInUseError extends Error { constructor(){ super('Já existe uma escola registrada com este CPF/CNPJ.'); } }
export class PasswordPolicyError extends Error { constructor(){ super('Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.'); } }

const passwordMinLength = Number(process.env.PASSWORD_MIN_LENGTH || 8);
const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{' + String(passwordMinLength) + ',}$');
const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 10);
const bcryptPepper = process.env.BCRYPT_PEPPER || '';

export async function createFirstUser(data: FirstUserInput): Promise<Usuario> {
  // Política de senha
  if (!passwordRegex.test(data.senha)) throw new PasswordPolicyError();
  // Unicidade email
  const existingEmail = await prisma.usuario.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new EmailInUseError();
  // Unicidade CPF/CNPJ para Conta
  const existingConta = await prisma.conta.findFirst({ where: { cpfCnpj: data.cpfCnpj } });
  if (existingConta) throw new CpfCnpjInUseError();
  // Cria conta
  const conta = await prisma.conta.create({ data: { nome: data.escolaNome, cpfCnpj: data.cpfCnpj } });
  const senhaHash = await bcrypt.hash(data.senha + bcryptPepper, bcryptRounds);
  try {
    return await prisma.usuario.create({ data: { contaId: conta.id, nome: data.nome, email: data.email, senhaHash, role: Role.ADMIN } });
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'code' in e) {
      const code = (e as any).code as string;
      if (code === 'P2002') {
        // Violação de unicidade: pode ser email ou cpfCnpj (se corrida entre checagem e criação) => traduzir genericamente
        // Já validamos antes, mas em condição de corrida garantimos mensagem correta
        throw new EmailInUseError();
      }
      // P2003: deixamos propagar para facilitar diagnóstico (erro de integridade inesperado)
    }
    throw e;
  }
}
