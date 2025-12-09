/**
 * @file MCP Alusa - Utilitários de Segurança
 * @description Funções de validação, sanitização e proteção de dados
 */

import { SENSITIVE_COLUMNS, SENSITIVE_TABLES, type QueryResult } from './types.js';

// =============================================================================
// Validação de Queries
// =============================================================================

/**
 * Lista de palavras-chave SQL proibidas (mutações)
 */
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
  'CALL',
  'SET',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  'MERGE',
  'UPSERT',
  'VACUUM',
  'REINDEX',
  'CLUSTER',
  'LOCK',
  'UNLOCK',
  'COPY',
  'LOAD',
  'INTO',
] as const;

/**
 * Valida se a query é apenas SELECT
 * @param query - Query SQL a ser validada
 * @returns true se a query é segura (somente SELECT)
 * @throws Error se a query contém operações proibidas
 */
export function validateSelectOnly(query: string): boolean {
  const normalizedQuery = query.trim().toUpperCase();

  // Verifica se começa com SELECT
  if (!normalizedQuery.startsWith('SELECT')) {
    throw new Error(
      'Operação não permitida: apenas queries SELECT são aceitas. ' +
      'A query deve começar com SELECT.'
    );
  }

  // Verifica presença de palavras-chave proibidas
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Regex para encontrar a palavra como token isolado (não parte de outra palavra)
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(normalizedQuery)) {
      throw new Error(
        `Operação não permitida: a palavra-chave "${keyword}" não é permitida. ` +
        'Apenas queries SELECT de leitura são aceitas.'
      );
    }
  }

  // Verifica por comentários SQL que podem esconder código malicioso
  if (normalizedQuery.includes('--') || normalizedQuery.includes('/*')) {
    throw new Error(
      'Operação não permitida: comentários SQL não são aceitos por razões de segurança.'
    );
  }

  // Verifica múltiplas statements (ponto e vírgula)
  const cleanQuery = normalizedQuery.replace(/;[\s]*$/, ''); // Remove ; final
  if (cleanQuery.includes(';')) {
    throw new Error(
      'Operação não permitida: múltiplas statements não são aceitas. ' +
      'Execute uma query por vez.'
    );
  }

  return true;
}

/**
 * Sanitiza entrada para uso em queries
 * @param input - Valor a ser sanitizado
 * @returns Valor sanitizado
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, '\\\\') // Escape backslashes
    .trim();
}

/**
 * Valida nome de tabela para evitar SQL injection
 * @param tableName - Nome da tabela
 * @returns true se válido
 * @throws Error se inválido
 */
export function validateTableName(tableName: string): boolean {
  // Apenas letras, números e underscore, começando com letra ou underscore
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  if (!validPattern.test(tableName)) {
    throw new Error(
      `Nome de tabela inválido: "${tableName}". ` +
      'Use apenas letras, números e underscores.'
    );
  }

  // Verifica se não é uma tabela sensível
  if (SENSITIVE_TABLES.includes(tableName.toLowerCase() as typeof SENSITIVE_TABLES[number])) {
    throw new Error(
      `Acesso à tabela "${tableName}" não é permitido por razões de segurança.`
    );
  }

  return true;
}

// =============================================================================
// Mascaramento de Dados Sensíveis
// =============================================================================

/**
 * Verifica se uma coluna contém dados sensíveis
 * @param columnName - Nome da coluna
 * @returns true se a coluna é sensível
 */
export function isSensitiveColumn(columnName: string): boolean {
  const lowerName = columnName.toLowerCase();

  return SENSITIVE_COLUMNS.some((sensitive) =>
    lowerName.includes(sensitive.toLowerCase())
  );
}

/**
 * Mascara dados sensíveis em um resultado de query
 * @param result - Resultado da query
 * @returns Resultado com dados sensíveis mascarados
 */
export function maskSensitiveData(result: QueryResult): QueryResult {
  const maskedRows = result.rows.map((row) => {
    const maskedRow: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      if (isSensitiveColumn(key)) {
        maskedRow[key] = '[DADOS_PROTEGIDOS]';
      } else if (typeof value === 'string' && containsSensitivePattern(value)) {
        maskedRow[key] = maskString(value);
      } else {
        maskedRow[key] = value;
      }
    }

    return maskedRow;
  });

  return {
    ...result,
    rows: maskedRows,
  };
}

/**
 * Verifica se uma string contém padrões sensíveis (emails, CPFs, etc)
 */
function containsSensitivePattern(value: string): boolean {
  // Não mascara strings curtas
  if (value.length < 10) return false;

  // Padrões que podem indicar dados sensíveis
  const patterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF formatado
    /\b\d{11}\b/, // CPF sem formatação
    /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/, // CNPJ formatado
    /\bsk_[a-zA-Z0-9]+\b/, // API Keys (stripe-like)
    /\bpk_[a-zA-Z0-9]+\b/, // Public Keys
    /\b[a-f0-9]{64}\b/i, // Hash SHA256
  ];

  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Mascara uma string preservando parte visível
 */
function maskString(value: string): string {
  if (value.length <= 8) {
    return '****';
  }

  const visibleStart = Math.min(3, Math.floor(value.length * 0.2));
  const visibleEnd = Math.min(3, Math.floor(value.length * 0.2));

  return (
    value.substring(0, visibleStart) +
    '*'.repeat(value.length - visibleStart - visibleEnd) +
    value.substring(value.length - visibleEnd)
  );
}

// =============================================================================
// Limitação de Resultados
// =============================================================================

/**
 * Limites padrão para queries
 */
export const QUERY_LIMITS = {
  MAX_ROWS: 500,
  DEFAULT_ROWS: 100,
  MAX_QUERY_LENGTH: 5000,
  MAX_EXECUTION_TIME_MS: 30000,
} as const;

/**
 * Adiciona LIMIT à query se não existir
 * @param query - Query SQL
 * @param limit - Limite máximo de linhas
 * @returns Query com LIMIT aplicado
 */
export function ensureQueryLimit(query: string, limit: number = QUERY_LIMITS.DEFAULT_ROWS): string {
  const normalizedQuery = query.trim().toUpperCase();

  // Verifica se já tem LIMIT
  if (normalizedQuery.includes('LIMIT')) {
    // Extrai o LIMIT existente e garante que não excede o máximo
    const limitMatch = normalizedQuery.match(/LIMIT\s+(\d+)/);
    if (limitMatch) {
      const existingLimit = parseInt(limitMatch[1], 10);
      if (existingLimit > QUERY_LIMITS.MAX_ROWS) {
        // Substitui pelo máximo permitido
        return query.replace(/LIMIT\s+\d+/i, `LIMIT ${QUERY_LIMITS.MAX_ROWS}`);
      }
    }
    return query;
  }

  // Adiciona LIMIT antes de ponto e vírgula final ou no final
  const cleanQuery = query.replace(/;\s*$/, '');
  return `${cleanQuery} LIMIT ${Math.min(limit, QUERY_LIMITS.MAX_ROWS)}`;
}

/**
 * Valida o comprimento da query
 * @param query - Query SQL
 * @throws Error se a query exceder o limite
 */
export function validateQueryLength(query: string): void {
  if (query.length > QUERY_LIMITS.MAX_QUERY_LENGTH) {
    throw new Error(
      `Query muito longa: ${query.length} caracteres. ` +
      `Máximo permitido: ${QUERY_LIMITS.MAX_QUERY_LENGTH} caracteres.`
    );
  }
}

// =============================================================================
// Logging Seguro
// =============================================================================

/**
 * Cria uma versão segura da query para logging (sem dados sensíveis)
 * @param query - Query original
 * @returns Query sanitizada para log
 */
export function sanitizeQueryForLog(query: string): string {
  return query
    // Remove valores entre aspas simples (podem conter dados sensíveis)
    .replace(/'[^']*'/g, "'***'")
    // Remove valores numéricos longos (podem ser IDs ou tokens)
    .replace(/\b\d{10,}\b/g, '***')
    // Limita o tamanho
    .substring(0, 500);
}

/**
 * Estrutura de log segura
 */
export interface SafeLogEntry {
  timestamp: string;
  action: string;
  duration?: number;
  rowCount?: number;
  query?: string;
  error?: string;
}

/**
 * Cria uma entrada de log segura
 */
export function createSafeLogEntry(params: {
  action: string;
  duration?: number;
  rowCount?: number;
  query?: string;
  error?: Error | string;
}): SafeLogEntry {
  return {
    timestamp: new Date().toISOString(),
    action: params.action,
    duration: params.duration,
    rowCount: params.rowCount,
    query: params.query ? sanitizeQueryForLog(params.query) : undefined,
    error: params.error
      ? params.error instanceof Error
        ? params.error.message
        : params.error
      : undefined,
  };
}
