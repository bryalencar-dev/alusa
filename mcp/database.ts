/**
 * @file MCP Alusa - Conexão PostgreSQL
 * @description Pool de conexão seguro com PostgreSQL usando node-postgres
 */

import pg, { Pool as PgPool, PoolClient, QueryResult as PgQueryResult } from 'pg';
import {
  validateSelectOnly,
  validateQueryLength,
  ensureQueryLimit,
  maskSensitiveData,
  createSafeLogEntry,
  QUERY_LIMITS,
} from './security.js';
import type { QueryResult, TableInfo, ColumnInfo, IndexInfo, RelationInfo, TableDescription } from './types.js';

const { Pool } = pg;

// =============================================================================
// Configuração do Pool
// =============================================================================

let pool: PgPool | null = null;

/**
 * Inicializa o pool de conexão PostgreSQL
 * @param connectionString - String de conexão DATABASE_URL
 */
export function initializePool(connectionString: string): void {
  if (pool) {
    console.error('[MCP] Pool já inicializado, ignorando...');
    return;
  }

  pool = new Pool({
    connectionString,
    max: 5, // Máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: QUERY_LIMITS.MAX_EXECUTION_TIME_MS,
    // SSL para produção
    ssl: connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  pool.on('error', (err: Error) => {
    console.error('[MCP] Erro no pool PostgreSQL:', err.message);
  });

  pool.on('connect', () => {
    console.error('[MCP] Nova conexão estabelecida com PostgreSQL');
  });

  console.error('[MCP] Pool PostgreSQL inicializado');
}

/**
 * Encerra o pool de conexão
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.error('[MCP] Pool PostgreSQL encerrado');
  }
}

/**
 * Obtém o pool de conexão
 */
function getPool(): PgPool {
  if (!pool) {
    throw new Error(
      'Pool PostgreSQL não inicializado. ' +
      'Configure DATABASE_URL e chame initializePool() primeiro.'
    );
  }
  return pool;
}

// =============================================================================
// Execução de Queries
// =============================================================================

/**
 * Executa uma query SELECT de forma segura
 * @param query - Query SQL (somente SELECT)
 * @returns Resultado da query com dados sensíveis mascarados
 */
export async function executeSelectQuery(query: string): Promise<QueryResult> {
  const startTime = Date.now();

  // Validações de segurança
  validateQueryLength(query);
  validateSelectOnly(query);

  // Aplica limite se necessário
  const limitedQuery = ensureQueryLimit(query);

  const client = await getPool().connect();

  try {
    const result = await client.query(limitedQuery);
    const executionTime = Date.now() - startTime;

    const queryResult: QueryResult = {
      rows: result.rows,
      rowCount: result.rowCount ?? 0,
      fields: result.fields.map((f: { name: string }) => f.name),
      executionTime,
      truncated: (result.rowCount ?? 0) >= QUERY_LIMITS.MAX_ROWS,
    };

    // Log seguro
    console.error(
      JSON.stringify(
        createSafeLogEntry({
          action: 'executeSelectQuery',
          duration: executionTime,
          rowCount: queryResult.rowCount,
          query: limitedQuery,
        })
      )
    );

    // Mascara dados sensíveis antes de retornar
    return maskSensitiveData(queryResult);
  } catch (error) {
    const err = error as Error;
    console.error(
      JSON.stringify(
        createSafeLogEntry({
          action: 'executeSelectQuery',
          duration: Date.now() - startTime,
          query: limitedQuery,
          error: err,
        })
      )
    );
    throw new Error(`Erro ao executar query: ${err.message}`);
  } finally {
    client.release();
  }
}

// =============================================================================
// Queries de Introspecção
// =============================================================================

/**
 * Lista todas as tabelas do schema public
 */
export async function listTables(): Promise<TableInfo[]> {
  const client = await getPool().connect();

  try {
    const result = await client.query(`
      SELECT
        t.table_name,
        t.table_schema,
        t.table_type,
        (
          SELECT reltuples::bigint
          FROM pg_class
          WHERE oid = (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
        ) as row_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);

    return result.rows.map((row: Record<string, unknown>) => ({
      table_name: row.table_name as string,
      table_schema: row.table_schema as string,
      table_type: row.table_type as string,
      row_count: row.row_count ? parseInt(String(row.row_count), 10) : undefined,
    }));
  } finally {
    client.release();
  }
}

/**
 * Obtém informações detalhadas de uma tabela
 */
export async function describeTable(tableName: string): Promise<TableDescription> {
  const client = await getPool().connect();

  try {
    // Busca colunas
    const columnsResult = await client.query(
      `
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.udt_name,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
        fk.foreign_table,
        fk.foreign_column
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
      ) pk ON pk.column_name = c.column_name
      LEFT JOIN (
        SELECT
          kcu.column_name,
          ccu.table_name as foreign_table,
          ccu.column_name as foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
      ) fk ON fk.column_name = c.column_name
      WHERE c.table_name = $1
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `,
      [tableName]
    );

    const columns: ColumnInfo[] = columnsResult.rows.map((row: Record<string, unknown>) => ({
      column_name: row.column_name as string,
      data_type: row.data_type as string,
      is_nullable: row.is_nullable as string,
      column_default: row.column_default as string | null,
      character_maximum_length: row.character_maximum_length as number | null,
      numeric_precision: row.numeric_precision as number | null,
      numeric_scale: row.numeric_scale as number | null,
      udt_name: row.udt_name as string,
      is_primary_key: row.is_primary_key as boolean,
      is_foreign_key: row.is_foreign_key as boolean,
      foreign_table: row.foreign_table as string | undefined,
      foreign_column: row.foreign_column as string | undefined,
    }));

    // Busca índices
    const indexesResult = await client.query(
      `
      SELECT
        i.relname as index_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relkind = 'r'
        AND t.relname = $1
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY i.relname, ix.indisunique, ix.indisprimary
      ORDER BY i.relname
    `,
      [tableName]
    );

    const indexes: IndexInfo[] = indexesResult.rows.map((row: Record<string, unknown>) => ({
      index_name: row.index_name as string,
      is_unique: row.is_unique as boolean,
      is_primary: row.is_primary as boolean,
      columns: row.columns as string[],
    }));

    // Busca foreign keys
    const fkResult = await client.query(
      `
      SELECT
        tc.constraint_name,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND tc.table_schema = 'public'
    `,
      [tableName]
    );

    const foreignKeys: RelationInfo[] = fkResult.rows.map((row: Record<string, unknown>) => ({
      constraint_name: row.constraint_name as string,
      source_table: tableName,
      source_column: row.source_column as string,
      target_table: row.target_table as string,
      target_column: row.target_column as string,
      relation_type: 'many-to-one' as const,
    }));

    // Busca contagem de linhas
    const countResult = await client.query(
      `SELECT reltuples::bigint as count FROM pg_class WHERE oid = $1::regclass`,
      [`public.${tableName}`]
    );

    return {
      table_name: tableName,
      columns,
      indexes,
      primary_key: columns.filter((c) => c.is_primary_key).map((c) => c.column_name),
      foreign_keys: foreignKeys,
      row_count: countResult.rows[0]?.count ? parseInt(String(countResult.rows[0].count), 10) : 0,
    };
  } finally {
    client.release();
  }
}

/**
 * Lista todas as relações entre tabelas
 */
export async function listRelations(): Promise<RelationInfo[]> {
  const client = await getPool().connect();

  try {
    const result = await client.query(`
      SELECT
        tc.constraint_name,
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    return result.rows.map((row: Record<string, unknown>) => ({
      constraint_name: row.constraint_name as string,
      source_table: row.source_table as string,
      source_column: row.source_column as string,
      target_table: row.target_table as string,
      target_column: row.target_column as string,
      relation_type: 'many-to-one' as const,
    }));
  } finally {
    client.release();
  }
}

/**
 * Testa a conexão com o banco de dados
 */
export async function testConnection(): Promise<boolean> {
  const client = await getPool().connect();

  try {
    const result = await client.query('SELECT NOW() as now, version() as version');
    console.error('[MCP] Conexão PostgreSQL testada com sucesso:', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0],
    });
    return true;
  } catch (error) {
    console.error('[MCP] Erro ao testar conexão:', (error as Error).message);
    return false;
  } finally {
    client.release();
  }
}
