/**
 * Helpers para mapear dados de Aluno/Responsável para formato Asaas Customer
 */

import type { CreateCustomerInput } from './customer';

/**
 * Remove caracteres não numéricos de CPF/telefone
 */
function digitsOnly(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Formata telefone no padrão brasileiro (DDD + número)
 */
function formatPhone(telefone: string | null | undefined): string | undefined {
  if (!telefone) return undefined;

  const digits = digitsOnly(telefone);

  // Se tiver 10 ou 11 dígitos, está no formato correto
  if (digits.length >= 10) {
    return digits;
  }

  return undefined;
}

/**
 * Valida dados mínimos para criar customer
 */
function validateCustomerData(data: CreateCustomerInput): void {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Nome é obrigatório para criar customer no Asaas');
  }

  if (!data.cpfCnpj || data.cpfCnpj.length < 11) {
    throw new Error('CPF/CNPJ válido é obrigatório para criar customer no Asaas');
  }

  if (data.email && !data.email.includes('@')) {
    throw new Error('Email inválido');
  }
}

export interface AlunoToCustomerInput {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  dataNascimento?: Date | null;
  id: string; // Para externalReference
}

/**
 * Mapeia dados de Aluno para formato Asaas Customer
 */
export function mapAlunoToAsaasCustomer(aluno: AlunoToCustomerInput): CreateCustomerInput {
  const customerData: CreateCustomerInput = {
    name: aluno.nome,
    cpfCnpj: digitsOnly(aluno.cpf || ''),
    email: aluno.email || undefined,
    mobilePhone: formatPhone(aluno.telefone),
    externalReference: aluno.id,
    notificationDisabled: false,
  };

  validateCustomerData(customerData);

  return customerData;
}

export interface ResponsavelToCustomerInput {
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  id: string; // Para externalReference
}

/**
 * Mapeia dados de Responsável para formato Asaas Customer
 */
export function mapResponsavelToAsaasCustomer(
  responsavel: ResponsavelToCustomerInput,
): CreateCustomerInput {
  const customerData: CreateCustomerInput = {
    name: responsavel.nome,
    cpfCnpj: digitsOnly(responsavel.cpf || ''),
    email: responsavel.email || undefined,
    phone: formatPhone(responsavel.telefone),
    mobilePhone: formatPhone(responsavel.telefone),
    externalReference: responsavel.id,
    notificationDisabled: false,
  };

  validateCustomerData(customerData);

  return customerData;
}

/**
 * Determina se deve criar customer para aluno ou responsável
 * baseado na idade do aluno
 */
export function shouldUseResponsavel(dataNascimento: Date | null | undefined): boolean {
  if (!dataNascimento) return false;

  const hoje = new Date();
  const idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = dataNascimento.getMonth();

  // Ajusta idade se ainda não fez aniversário este ano
  const idadeReal =
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())
      ? idade - 1
      : idade;

  return idadeReal < 18;
}
