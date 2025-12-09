/**
 * Helpers para mapear dados de Aluno/Responsável para formato Asaas Customer
 */

import type { AsaasCustomerData } from './asaas-customer.service';

/**
 * Remove caracteres não numéricos de CPF/CNPJ
 */
function digitsOnly(value?: string | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Remove caracteres não numéricos de telefone e formata para Asaas
 * Asaas espera formato: DDD + número (ex: "4799376637")
 */
function formatPhone(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = digitsOnly(value);
  // Remove código do país se presente (55)
  if (digits.startsWith('55') && digits.length > 11) {
    return digits.slice(2);
  }
  return digits || undefined;
}

/**
 * Mapeia dados de Aluno para formato Asaas Customer
 */
export interface AlunoToAsaasInput {
  id: string;
  nome: string;
  email?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  enderecoCep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
}

export function mapAlunoToAsaasCustomer(aluno: AlunoToAsaasInput): AsaasCustomerData {
  const cpfCnpj = digitsOnly(aluno.cpf);

  if (!cpfCnpj) {
    throw new Error('CPF do aluno é obrigatório para criar customer no Asaas');
  }

  if (!aluno.email) {
    throw new Error('Email do aluno é obrigatório para criar customer no Asaas');
  }

  const phone = formatPhone(aluno.telefone);

  return {
    name: aluno.nome,
    email: aluno.email,
    cpfCnpj,
    phone,
    mobilePhone: phone, // Mesmo valor para ambos
    postalCode: digitsOnly(aluno.enderecoCep) || undefined,
    address: aluno.enderecoLogradouro || undefined,
    addressNumber: aluno.enderecoNumero || undefined,
    complement: aluno.enderecoComplemento || undefined,
    province: aluno.enderecoBairro || undefined,
    city: aluno.enderecoCidade || undefined,
    state: aluno.enderecoUf || undefined,
    externalReference: aluno.id, // ID do aluno na Alusa
    notificationDisabled: false,
  };
}

/**
 * Mapeia dados de Responsável para formato Asaas Customer
 */
export interface ResponsavelToAsaasInput {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  enderecoCep?: string | null;
  enderecoLogradouro?: string | null;
  enderecoNumero?: string | null;
  enderecoComplemento?: string | null;
  enderecoBairro?: string | null;
  enderecoCidade?: string | null;
  enderecoUf?: string | null;
}

export function mapResponsavelToAsaasCustomer(
  responsavel: ResponsavelToAsaasInput,
): AsaasCustomerData {
  const cpfCnpj = digitsOnly(responsavel.cpf);

  if (!cpfCnpj) {
    throw new Error('CPF do responsável é obrigatório para criar customer no Asaas');
  }

  const phone = formatPhone(responsavel.telefone);

  return {
    name: responsavel.nome,
    email: responsavel.email,
    cpfCnpj,
    phone,
    mobilePhone: phone,
    postalCode: digitsOnly(responsavel.enderecoCep) || undefined,
    address: responsavel.enderecoLogradouro || undefined,
    addressNumber: responsavel.enderecoNumero || undefined,
    complement: responsavel.enderecoComplemento || undefined,
    province: responsavel.enderecoBairro || undefined,
    city: responsavel.enderecoCidade || undefined,
    state: responsavel.enderecoUf || undefined,
    externalReference: responsavel.id, // ID do responsável na Alusa
    notificationDisabled: false,
  };
}

/**
 * Valida se os dados mínimos para criar customer no Asaas estão presentes
 */
export function validateCustomerData(data: {
  nome?: string | null;
  email?: string | null;
  cpf?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.nome || data.nome.trim().length < 3) {
    errors.push('Nome deve ter no mínimo 3 caracteres');
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push('Email válido é obrigatório');
  }

  const cpf = digitsOnly(data.cpf);
  if (!cpf || (cpf.length !== 11 && cpf.length !== 14)) {
    errors.push('CPF/CNPJ válido é obrigatório (11 ou 14 dígitos)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
