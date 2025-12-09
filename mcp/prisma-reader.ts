/**
 * @file MCP Alusa - Leitor do Schema Prisma
 * @description Lê e interpreta o schema Prisma para introspecção semântica
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PrismaModel, PrismaField, PrismaEnum, SchemaCache } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// Cache do Schema
// =============================================================================

let schemaCache: SchemaCache | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

/**
 * Obtém o cache do schema ou cria um novo
 */
export function getSchemaCache(): SchemaCache {
  if (schemaCache && Date.now() - schemaCache.lastUpdated < CACHE_TTL) {
    return schemaCache;
  }

  // Inicializa cache vazio
  schemaCache = {
    tables: new Map(),
    relations: [],
    prismaModels: new Map(),
    enums: new Map(),
    lastUpdated: Date.now(),
  };

  return schemaCache;
}

/**
 * Invalida o cache
 */
export function invalidateCache(): void {
  schemaCache = null;
  console.error('[MCP] Cache do schema invalidado');
}

// =============================================================================
// Parser do Schema Prisma
// =============================================================================

/**
 * Encontra o caminho do schema.prisma
 */
function findSchemaPath(): string | null {
  const possiblePaths = [
    resolve(__dirname, '../prisma/schema.prisma'),
    resolve(__dirname, '../../prisma/schema.prisma'),
    resolve(process.cwd(), 'prisma/schema.prisma'),
    resolve(process.cwd(), '../prisma/schema.prisma'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Lê o conteúdo do schema Prisma
 */
export function readPrismaSchema(): string | null {
  const schemaPath = findSchemaPath();

  if (!schemaPath) {
    console.error('[MCP] Schema Prisma não encontrado');
    return null;
  }

  try {
    const content = readFileSync(schemaPath, 'utf-8');
    console.error(`[MCP] Schema Prisma carregado de ${schemaPath}`);
    return content;
  } catch (error) {
    console.error('[MCP] Erro ao ler schema Prisma:', (error as Error).message);
    return null;
  }
}

/**
 * Parseia um enum do schema Prisma
 */
function parseEnum(block: string): PrismaEnum | null {
  const nameMatch = block.match(/enum\s+(\w+)\s*\{/);
  if (!nameMatch) return null;

  const name = nameMatch[1];
  const valuesMatch = block.match(/\{([^}]+)\}/);
  if (!valuesMatch) return null;

  const values = valuesMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .map((line) => line.split(/\s/)[0])
    .filter(Boolean);

  return { name, values };
}

/**
 * Parseia um campo do model Prisma
 */
function parseField(line: string): PrismaField | null {
  // Remove comentários inline
  const cleanLine = line.split('//')[0].trim();
  if (!cleanLine) return null;

  // Regex para capturar: nome tipo? @atributos
  const fieldMatch = cleanLine.match(/^(\w+)\s+(\w+)(\[\])?\??(.*)$/);
  if (!fieldMatch) return null;

  const [, name, type, isList, rest] = fieldMatch;

  // Ignora campos de relação que são só para backreference
  if (type === type[0].toUpperCase() + type.slice(1) && !rest.includes('@relation')) {
    // É um tipo de model (começa com maiúscula)
  }

  const isOptional = line.includes('?') && !line.includes('@default');
  const isId = rest.includes('@id');
  const isUnique = rest.includes('@unique');
  const hasDefault = rest.includes('@default');
  const isUpdatedAt = rest.includes('@updatedAt');

  // Extrai valor default se existir
  let defaultValue: unknown = undefined;
  const defaultMatch = rest.match(/@default\(([^)]+)\)/);
  if (defaultMatch) {
    const defaultStr = defaultMatch[1];
    if (defaultStr === 'now()') defaultValue = 'now()';
    else if (defaultStr === 'cuid()') defaultValue = 'cuid()';
    else if (defaultStr === 'uuid()') defaultValue = 'uuid()';
    else if (defaultStr === 'autoincrement()') defaultValue = 'autoincrement()';
    else if (defaultStr === 'true' || defaultStr === 'false') defaultValue = defaultStr === 'true';
    else if (!isNaN(Number(defaultStr))) defaultValue = Number(defaultStr);
    else defaultValue = defaultStr.replace(/"/g, '');
  }

  // Extrai informações de relação
  let relationName: string | undefined;
  let relationFromFields: string[] | undefined;
  let relationToFields: string[] | undefined;

  const relationMatch = rest.match(/@relation\(([^)]+)\)/);
  if (relationMatch) {
    const relationStr = relationMatch[1];

    const nameMatch = relationStr.match(/"([^"]+)"/);
    if (nameMatch) relationName = nameMatch[1];

    const fromMatch = relationStr.match(/fields:\s*\[([^\]]+)\]/);
    if (fromMatch) relationFromFields = fromMatch[1].split(',').map((f) => f.trim());

    const toMatch = relationStr.match(/references:\s*\[([^\]]+)\]/);
    if (toMatch) relationToFields = toMatch[1].split(',').map((f) => f.trim());
  }

  // Determina o kind do campo
  let kind: PrismaField['kind'] = 'scalar';
  const scalarTypes = [
    'String',
    'Int',
    'BigInt',
    'Float',
    'Decimal',
    'Boolean',
    'DateTime',
    'Json',
    'Bytes',
  ];

  if (scalarTypes.includes(type)) {
    kind = 'scalar';
  } else if (type[0] === type[0].toUpperCase()) {
    // Tipo começa com maiúscula - pode ser enum ou relação
    kind = relationFromFields || relationToFields ? 'object' : 'enum';
  }

  return {
    name,
    kind,
    isList: !!isList,
    isRequired: !isOptional,
    isUnique,
    isId,
    isReadOnly: isId || isUpdatedAt,
    type,
    hasDefaultValue: hasDefault,
    default: defaultValue,
    relationName,
    relationFromFields,
    relationToFields,
    isGenerated: isId && hasDefault,
    isUpdatedAt,
  };
}

/**
 * Parseia um model do schema Prisma
 */
function parseModel(block: string): PrismaModel | null {
  const nameMatch = block.match(/model\s+(\w+)\s*\{/);
  if (!nameMatch) return null;

  const name = nameMatch[1];

  // Extrai dbName se existir @@map
  let dbName: string | null = null;
  const mapMatch = block.match(/@@map\("([^"]+)"\)/);
  if (mapMatch) dbName = mapMatch[1];

  // Parseia campos
  const contentMatch = block.match(/\{([^}]+)\}/s);
  if (!contentMatch) return null;

  const lines = contentMatch[1].split('\n');
  const fields: PrismaField[] = [];
  const uniqueFields: string[][] = [];
  const uniqueIndexes: Array<{ name: string | null; fields: string[] }> = [];
  let primaryKey: string[] | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Ignora linhas vazias e comentários
    if (!trimmedLine || trimmedLine.startsWith('//')) continue;

    // Extrai @@unique
    const uniqueMatch = trimmedLine.match(/@@unique\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/);
    if (uniqueMatch) {
      const fields = uniqueMatch[1].split(',').map((f) => f.trim());
      uniqueFields.push(fields);
      uniqueIndexes.push({ name: uniqueMatch[2] || null, fields });
      continue;
    }

    // Extrai @@id (primary key composta)
    const idMatch = trimmedLine.match(/@@id\(\[([^\]]+)\]\)/);
    if (idMatch) {
      primaryKey = idMatch[1].split(',').map((f) => f.trim());
      continue;
    }

    // Ignora outras diretivas @@
    if (trimmedLine.startsWith('@@')) continue;

    // Parseia campo
    const field = parseField(trimmedLine);
    if (field) {
      fields.push(field);

      // Captura primary key de campo @id
      if (field.isId && !primaryKey) {
        primaryKey = [field.name];
      }
    }
  }

  return {
    name,
    dbName,
    fields,
    primaryKey,
    uniqueFields,
    uniqueIndexes,
  };
}

/**
 * Parseia o schema Prisma completo
 */
export function parsePrismaSchema(): { models: PrismaModel[]; enums: PrismaEnum[] } {
  const cache = getSchemaCache();

  // Retorna do cache se disponível
  if (cache.prismaModels.size > 0) {
    return {
      models: Array.from(cache.prismaModels.values()),
      enums: Array.from(cache.enums.values()),
    };
  }

  const schemaContent = readPrismaSchema();
  if (!schemaContent) {
    return { models: [], enums: [] };
  }

  const models: PrismaModel[] = [];
  const enums: PrismaEnum[] = [];

  // Encontra todos os blocos enum
  const enumRegex = /enum\s+\w+\s*\{[^}]+\}/g;
  let enumMatch;
  while ((enumMatch = enumRegex.exec(schemaContent)) !== null) {
    const parsed = parseEnum(enumMatch[0]);
    if (parsed) {
      enums.push(parsed);
      cache.enums.set(parsed.name, parsed);
    }
  }

  // Encontra todos os blocos model
  const modelRegex = /model\s+\w+\s*\{[^}]+\}/g;
  let modelMatch;
  while ((modelMatch = modelRegex.exec(schemaContent)) !== null) {
    const parsed = parseModel(modelMatch[0]);
    if (parsed) {
      models.push(parsed);
      cache.prismaModels.set(parsed.name, parsed);
    }
  }

  console.error(`[MCP] Schema Prisma parseado: ${models.length} models, ${enums.length} enums`);

  return { models, enums };
}

/**
 * Obtém um model específico pelo nome
 */
export function getPrismaModel(modelName: string): PrismaModel | null {
  const cache = getSchemaCache();

  // Tenta do cache primeiro
  if (cache.prismaModels.has(modelName)) {
    return cache.prismaModels.get(modelName) || null;
  }

  // Parseia o schema se necessário
  const { models } = parsePrismaSchema();
  return models.find((m) => m.name === modelName) || null;
}

/**
 * Lista todos os models do Prisma
 */
export function listPrismaModels(): string[] {
  const { models } = parsePrismaSchema();
  return models.map((m) => m.name);
}

/**
 * Lista todos os enums do Prisma
 */
export function listPrismaEnums(): PrismaEnum[] {
  const { enums } = parsePrismaSchema();
  return enums;
}

/**
 * Obtém um enum específico pelo nome
 */
export function getPrismaEnum(enumName: string): PrismaEnum | null {
  const { enums } = parsePrismaSchema();
  return enums.find((e) => e.name === enumName) || null;
}
