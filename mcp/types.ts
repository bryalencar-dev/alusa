/**
 * @file MCP Alusa - Tipos e Interfaces
 * @description Tipos TypeScript para o MCP Server de banco de dados PostgreSQL
 */

// =============================================================================
// Tipos de Introspecção de Banco de Dados
// =============================================================================

export interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
  row_count?: number;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  udt_name: string;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
}

export interface IndexInfo {
  index_name: string;
  is_unique: boolean;
  is_primary: boolean;
  columns: string[];
}

export interface RelationInfo {
  constraint_name: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  relation_type: 'one-to-one' | 'one-to-many' | 'many-to-one';
}

export interface TableDescription {
  table_name: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  primary_key: string[];
  foreign_keys: RelationInfo[];
  row_count: number;
}

// =============================================================================
// Tipos do Prisma DMMF
// =============================================================================

export interface PrismaModel {
  name: string;
  dbName: string | null;
  fields: PrismaField[];
  primaryKey: string[] | null;
  uniqueFields: string[][];
  uniqueIndexes: PrismaUniqueIndex[];
}

export interface PrismaField {
  name: string;
  kind: 'scalar' | 'object' | 'enum' | 'unsupported';
  isList: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isId: boolean;
  isReadOnly: boolean;
  type: string;
  hasDefaultValue: boolean;
  default?: unknown;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  isGenerated: boolean;
  isUpdatedAt: boolean;
  documentation?: string;
}

export interface PrismaUniqueIndex {
  name: string | null;
  fields: string[];
}

export interface PrismaEnum {
  name: string;
  values: string[];
}

// =============================================================================
// Tipos de Geração de Código
// =============================================================================

export interface GeneratedCode {
  filename: string;
  content: string;
  language: 'typescript' | 'tsx' | 'sql' | 'json';
  description: string;
}

export interface ZodSchemaOptions {
  includeRelations?: boolean;
  partialFields?: string[];
  omitFields?: string[];
}

export interface ServiceLayerOptions {
  includeCache?: boolean;
  includePagination?: boolean;
  includeFilters?: boolean;
}

export interface ApiRouteOptions {
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
  includeAuth?: boolean;
  includeValidation?: boolean;
}

export interface FormOptions {
  layout?: 'single-column' | 'two-column' | 'tabs';
  includeValidation?: boolean;
  includeRelationSelects?: boolean;
}

export interface TableOptions {
  includePagination?: boolean;
  includeFilters?: boolean;
  includeSorting?: boolean;
  includeSelection?: boolean;
  includeActions?: boolean;
}

// =============================================================================
// Tipos de Segurança
// =============================================================================

export const SENSITIVE_COLUMNS = [
  'password',
  'senha',
  'senhaHash',
  'hash',
  'token',
  'secret',
  'api_key',
  'apiKey',
  'apiKeyEncrypted',
  'asaasApiKeyEncrypted',
  'asaasWebhookSecretEncrypted',
  'asaasCreditCardToken',
  'creditCardToken',
  'accessToken',
  'refreshToken',
  'sessionToken',
  'privateKey',
  'encryptedData',
] as const;

export const SENSITIVE_TABLES = [
  'sessions',
  'tokens',
  'password_resets',
  'api_keys',
] as const;

export type SensitiveColumn = (typeof SENSITIVE_COLUMNS)[number];
export type SensitiveTable = (typeof SENSITIVE_TABLES)[number];

// =============================================================================
// Tipos de Resposta MCP
// =============================================================================

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: string[];
  executionTime: number;
  truncated: boolean;
}

// =============================================================================
// Cache Types
// =============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface SchemaCache {
  tables: Map<string, TableDescription>;
  relations: RelationInfo[];
  prismaModels: Map<string, PrismaModel>;
  enums: Map<string, PrismaEnum>;
  lastUpdated: number;
}
