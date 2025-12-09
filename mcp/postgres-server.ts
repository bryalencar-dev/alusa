#!/usr/bin/env node

/**
 * @file MCP Alusa - PostgreSQL Server
 * @description MCP Server para acesso seguro ao banco PostgreSQL do projeto Alusa
 * @version 1.0.0
 *
 * Este servidor MCP permite que agentes de IA (Copilot, Claude, etc) acessem
 * o banco de dados PostgreSQL de forma segura, com as seguintes características:
 *
 * - Somente queries SELECT (proibido INSERT/UPDATE/DELETE)
 * - Mascaramento de dados sensíveis
 * - Limite de resultados por query
 * - Introspecção do schema via Prisma DMMF
 * - Geração automática de código (Zod, Services, APIs, Forms, Tables)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  initializePool,
  closePool,
  testConnection,
  executeSelectQuery,
  listTables,
  describeTable,
  listRelations,
} from './database.js';
import {
  getPrismaModel,
  listPrismaModels,
  listPrismaEnums,
  parsePrismaSchema,
  invalidateCache,
} from './prisma-reader.js';
import {
  generateZodSchema,
  generateServiceLayer,
  generateNextApiRoute,
  generateShadcnForm,
  generateTanstackTable,
} from './generators.js';
import { validateTableName, QUERY_LIMITS } from './security.js';
import type { GeneratedCode } from './types.js';

// =============================================================================
// Configuração
// =============================================================================

const MCP_VERSION = '1.0.0';
const MCP_NAME = 'alusadb';

// Carrega DATABASE_URL do ambiente
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[MCP] ERRO: Variável de ambiente DATABASE_URL não definida');
  console.error('[MCP] Configure DATABASE_URL antes de iniciar o servidor MCP');
  process.exit(1);
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Cria resposta de sucesso para tool MCP
 */
function createSuccessResponse(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Cria resposta de erro para tool MCP
 */
function createErrorResponse(error: Error | string) {
  const message = error instanceof Error ? error.message : error;
  return {
    content: [
      {
        type: 'text' as const,
        text: `❌ Erro: ${message}`,
      },
    ],
    isError: true,
  };
}

/**
 * Formata código gerado para exibição
 */
function formatGeneratedCode(code: GeneratedCode): string {
  return [
    `📁 **${code.filename}**`,
    `📝 ${code.description}`,
    ``,
    '```' + code.language,
    code.content,
    '```',
  ].join('\n');
}

// =============================================================================
// Servidor MCP
// =============================================================================

async function main() {
  console.error(`[MCP] Iniciando ${MCP_NAME} v${MCP_VERSION}`);

  // Inicializa conexão com PostgreSQL
  initializePool(DATABASE_URL!);

  // Testa conexão
  const connected = await testConnection();
  if (!connected) {
    console.error('[MCP] ERRO: Falha ao conectar com PostgreSQL');
    process.exit(1);
  }

  // Parseia schema Prisma no início
  const { models, enums } = parsePrismaSchema();
  console.error(`[MCP] Schema Prisma carregado: ${models.length} models, ${enums.length} enums`);

  // Cria servidor MCP
  const server = new McpServer(
    {
      name: MCP_NAME,
      version: MCP_VERSION,
    },
    {
      instructions: `
Este MCP Server fornece acesso seguro ao banco de dados PostgreSQL do projeto Alusa.

CAPACIDADES:
- Listar e descrever tabelas do banco
- Executar queries SELECT (somente leitura)
- Obter informações dos models Prisma
- Gerar código (schemas Zod, services, APIs, forms, tables)

SEGURANÇA:
- Apenas queries SELECT são permitidas
- Dados sensíveis são mascarados automaticamente
- Limite de ${QUERY_LIMITS.MAX_ROWS} linhas por query
- Campos como senhas, tokens e chaves nunca são expostos

MODELOS DISPONÍVEIS:
${models.map((m) => `- ${m.name}`).join('\n')}
      `.trim(),
    }
  );

  // ==========================================================================
  // Tool: listTables
  // ==========================================================================
  server.registerTool(
    'listTables',
    {
      title: 'Listar Tabelas',
      description:
        'Lista todas as tabelas do banco de dados PostgreSQL com informações básicas como nome, schema e contagem aproximada de linhas.',
      inputSchema: {},
    },
    async () => {
      try {
        const tables = await listTables();

        const output = [
          `📊 **Tabelas do Banco de Dados** (${tables.length} tabelas)`,
          '',
          '| Tabela | Schema | Tipo | Linhas (aprox) |',
          '|--------|--------|------|----------------|',
          ...tables.map(
            (t) =>
              `| ${t.table_name} | ${t.table_schema} | ${t.table_type} | ${t.row_count ?? 'N/A'} |`
          ),
        ];

        return createSuccessResponse(output.join('\n'));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: describeTable
  // ==========================================================================
  server.registerTool(
    'describeTable',
    {
      title: 'Descrever Tabela',
      description:
        'Obtém informações detalhadas de uma tabela: colunas, tipos, PKs, FKs e índices.',
      inputSchema: {
        table: z.string().describe('Nome da tabela (ex: Aluno, Turma, Matricula)'),
      },
    },
    async ({ table }) => {
      try {
        const tableName = table as string;
        validateTableName(tableName);
        const description = await describeTable(tableName);

        const output = [
          `📋 **Tabela: ${description.table_name}**`,
          `📈 Linhas: ~${description.row_count}`,
          `🔑 Primary Key: ${description.primary_key.join(', ') || 'N/A'}`,
          '',
          '### Colunas',
          '| Nome | Tipo | Nullable | Default | PK | FK |',
          '|------|------|----------|---------|----|----|',
          ...description.columns.map(
            (c) =>
              `| ${c.column_name} | ${c.udt_name} | ${c.is_nullable} | ${c.column_default || '-'} | ${c.is_primary_key ? '✓' : ''} | ${c.is_foreign_key ? `→ ${c.foreign_table}` : ''} |`
          ),
        ];

        if (description.indexes.length > 0) {
          output.push('', '### Índices');
          output.push('| Nome | Único | Primário | Colunas |');
          output.push('|------|-------|----------|---------|');
          for (const idx of description.indexes) {
            output.push(
              `| ${idx.index_name} | ${idx.is_unique ? '✓' : ''} | ${idx.is_primary ? '✓' : ''} | ${idx.columns.join(', ')} |`
            );
          }
        }

        if (description.foreign_keys.length > 0) {
          output.push('', '### Foreign Keys');
          output.push('| Constraint | Coluna | → Tabela.Coluna |');
          output.push('|------------|--------|-----------------|');
          for (const fk of description.foreign_keys) {
            output.push(
              `| ${fk.constraint_name} | ${fk.source_column} | → ${fk.target_table}.${fk.target_column} |`
            );
          }
        }

        return createSuccessResponse(output.join('\n'));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: listRelations
  // ==========================================================================
  server.registerTool(
    'listRelations',
    {
      title: 'Listar Relações',
      description:
        'Lista todas as relações (foreign keys) entre tabelas do banco de dados.',
      inputSchema: {},
    },
    async () => {
      try {
        const relations = await listRelations();

        const output = [
          `🔗 **Relações do Banco** (${relations.length} foreign keys)`,
          '',
          '| Tabela Origem | Coluna | → | Tabela Destino | Coluna |',
          '|---------------|--------|---|----------------|--------|',
          ...relations.map(
            (r) =>
              `| ${r.source_table} | ${r.source_column} | → | ${r.target_table} | ${r.target_column} |`
          ),
        ];

        return createSuccessResponse(output.join('\n'));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: runSelect
  // ==========================================================================
  server.registerTool(
    'runSelect',
    {
      title: 'Executar SELECT',
      description: `
Executa uma query SELECT de forma segura.

REGRAS:
- Somente queries SELECT são aceitas
- Limite máximo de ${QUERY_LIMITS.MAX_ROWS} linhas
- Campos sensíveis são mascarados
- Comentários SQL não são permitidos
      `.trim(),
      inputSchema: {
        query: z.string().describe('Query SQL SELECT (ex: SELECT * FROM "Aluno" LIMIT 10)'),
      },
    },
    async ({ query }) => {
      try {
        const queryStr = query as string;
        const result = await executeSelectQuery(queryStr);

        const output = [
          `✅ **Query executada com sucesso**`,
          `⏱️ Tempo: ${result.executionTime}ms`,
          `📊 Linhas: ${result.rowCount}${result.truncated ? ` (truncado para ${QUERY_LIMITS.MAX_ROWS})` : ''}`,
          `📋 Campos: ${result.fields.join(', ')}`,
          '',
          '```json',
          JSON.stringify(result.rows, null, 2),
          '```',
        ];

        return createSuccessResponse(output.join('\n'));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: getPrismaModel
  // ==========================================================================
  server.registerTool(
    'getPrismaModel',
    {
      title: 'Obter Model Prisma',
      description:
        'Obtém informações semânticas de um model do schema Prisma, incluindo campos, relações e tipos.',
      inputSchema: {
        name: z.string().describe('Nome do model Prisma (ex: Aluno, Turma, Matricula)'),
      },
    },
    async ({ name }) => {
      try {
        const modelName = name as string;
        const model = getPrismaModel(modelName);

        if (!model) {
          return createErrorResponse(`Model "${modelName}" não encontrado no schema Prisma`);
        }

        const output = [
          `🏗️ **Model Prisma: ${model.name}**`,
          model.dbName ? `📦 Tabela: ${model.dbName}` : '',
          `🔑 Primary Key: ${model.primaryKey?.join(', ') || 'id'}`,
          '',
          '### Campos',
          '| Nome | Tipo | Required | Único | Default |',
          '|------|------|----------|-------|---------|',
          ...model.fields
            .filter((f) => f.kind === 'scalar' || f.kind === 'enum')
            .map(
              (f) =>
                `| ${f.name} | ${f.type}${f.isList ? '[]' : ''} | ${f.isRequired ? '✓' : ''} | ${f.isUnique ? '✓' : ''} | ${f.default ?? '-'} |`
            ),
        ];

        // Relações
        const relations = model.fields.filter((f) => f.kind === 'object');
        if (relations.length > 0) {
          output.push('', '### Relações');
          output.push('| Campo | Model | Tipo |');
          output.push('|-------|-------|------|');
          for (const rel of relations) {
            const relType = rel.isList ? 'hasMany' : 'belongsTo';
            output.push(`| ${rel.name} | ${rel.type} | ${relType} |`);
          }
        }

        // Unique constraints
        if (model.uniqueFields.length > 0) {
          output.push('', '### Constraints Únicos');
          for (const unique of model.uniqueFields) {
            output.push(`- @@unique([${unique.join(', ')}])`);
          }
        }

        return createSuccessResponse(output.filter(Boolean).join('\n'));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: listPrismaModels
  // ==========================================================================
  server.registerTool(
    'listPrismaModels',
    {
      title: 'Listar Models Prisma',
      description: 'Lista todos os models definidos no schema Prisma.',
      inputSchema: {},
    },
    async () => {
      try {
        const modelNames = listPrismaModels();
        const enumList = listPrismaEnums();

        const output = [
          `📚 **Schema Prisma**`,
          '',
          `### Models (${modelNames.length})`,
          ...modelNames.map((name) => `- ${name}`),
          '',
          `### Enums (${enumList.length})`,
          ...enumList.map((e) => `- ${e.name}: ${e.values.slice(0, 5).join(', ')}${e.values.length > 5 ? '...' : ''}`),
        ];

        return createSuccessResponse(output.join('\n'));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: generateZodSchemaFromTable
  // ==========================================================================
  server.registerTool(
    'generateZodSchemaFromTable',
    {
      title: 'Gerar Schema Zod',
      description:
        'Gera um schema de validação Zod baseado em um model Prisma, incluindo schemas para criação e atualização.',
      inputSchema: {
        table: z.string().describe('Nome do model/tabela (ex: Aluno, Turma)'),
        includeRelations: z
          .boolean()
          .optional()
          .describe('Incluir campos de relação no schema'),
      },
    },
    async ({ table, includeRelations }) => {
      try {
        const tableName = table as string;
        const includeRel = (includeRelations as boolean) ?? false;
        const model = getPrismaModel(tableName);
        if (!model) {
          return createErrorResponse(`Model "${tableName}" não encontrado`);
        }

        const code = generateZodSchema(model, enums, { includeRelations: includeRel });
        return createSuccessResponse(formatGeneratedCode(code));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: generateServiceLayer
  // ==========================================================================
  server.registerTool(
    'generateServiceLayer',
    {
      title: 'Gerar Service Layer',
      description:
        'Gera uma camada de serviço com CRUD completo para um model, seguindo Clean Architecture.',
      inputSchema: {
        table: z.string().describe('Nome do model/tabela (ex: Aluno, Turma)'),
        includePagination: z.boolean().optional().describe('Incluir paginação (default: true)'),
        includeFilters: z.boolean().optional().describe('Incluir filtros (default: true)'),
      },
    },
    async ({ table, includePagination, includeFilters }) => {
      try {
        const tableName = table as string;
        const includePag = (includePagination as boolean) ?? true;
        const includeFilt = (includeFilters as boolean) ?? true;
        const model = getPrismaModel(tableName);
        if (!model) {
          return createErrorResponse(`Model "${tableName}" não encontrado`);
        }

        const code = generateServiceLayer(model, { includePagination: includePag, includeFilters: includeFilt });
        return createSuccessResponse(formatGeneratedCode(code));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: generateNextApiRoute
  // ==========================================================================
  server.registerTool(
    'generateNextApiRoute',
    {
      title: 'Gerar API Route (Next.js)',
      description:
        'Gera um Route Handler Next.js 13+ com validação Zod e integração com o service layer.',
      inputSchema: {
        table: z.string().describe('Nome do model/tabela (ex: Aluno, Turma)'),
        includeAuth: z.boolean().optional().describe('Incluir autenticação (default: true)'),
        includeValidation: z.boolean().optional().describe('Incluir validação Zod (default: true)'),
      },
    },
    async ({ table, includeAuth, includeValidation }) => {
      try {
        const tableName = table as string;
        const includeAuthOpt = (includeAuth as boolean) ?? true;
        const includeValOpt = (includeValidation as boolean) ?? true;
        const model = getPrismaModel(tableName);
        if (!model) {
          return createErrorResponse(`Model "${tableName}" não encontrado`);
        }

        const code = generateNextApiRoute(model, { includeAuth: includeAuthOpt, includeValidation: includeValOpt });
        return createSuccessResponse(formatGeneratedCode(code));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: generateShadcnForm
  // ==========================================================================
  server.registerTool(
    'generateShadcnForm',
    {
      title: 'Gerar Formulário ShadCN',
      description:
        'Gera um componente de formulário React usando ShadCN UI, react-hook-form e validação Zod.',
      inputSchema: {
        table: z.string().describe('Nome do model/tabela (ex: Aluno, Turma)'),
        layout: z
          .enum(['single-column', 'two-column', 'tabs'])
          .optional()
          .describe('Layout do formulário'),
      },
    },
    async ({ table, layout }) => {
      try {
        const tableName = table as string;
        const layoutOpt = (layout as 'single-column' | 'two-column' | 'tabs') ?? 'single-column';
        const model = getPrismaModel(tableName);
        if (!model) {
          return createErrorResponse(`Model "${tableName}" não encontrado`);
        }

        const code = generateShadcnForm(model, enums, { layout: layoutOpt });
        return createSuccessResponse(formatGeneratedCode(code));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: generateTanstackTable
  // ==========================================================================
  server.registerTool(
    'generateTanstackTable',
    {
      title: 'Gerar Tabela TanStack',
      description:
        'Gera um componente de tabela usando TanStack Table com ShadCN UI, incluindo paginação, sorting e ações.',
      inputSchema: {
        table: z.string().describe('Nome do model/tabela (ex: Aluno, Turma)'),
        includePagination: z.boolean().optional().describe('Incluir paginação (default: true)'),
        includeSorting: z.boolean().optional().describe('Incluir ordenação (default: true)'),
        includeActions: z.boolean().optional().describe('Incluir menu de ações (default: true)'),
      },
    },
    async ({ table, includePagination, includeSorting, includeActions }) => {
      try {
        const tableName = table as string;
        const includePag = (includePagination as boolean) ?? true;
        const includeSort = (includeSorting as boolean) ?? true;
        const includeAct = (includeActions as boolean) ?? true;
        const model = getPrismaModel(tableName);
        if (!model) {
          return createErrorResponse(`Model "${tableName}" não encontrado`);
        }

        const code = generateTanstackTable(model, {
          includePagination: includePag,
          includeSorting: includeSort,
          includeActions: includeAct,
        });
        return createSuccessResponse(formatGeneratedCode(code));
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Tool: invalidateSchemaCache
  // ==========================================================================
  server.registerTool(
    'invalidateSchemaCache',
    {
      title: 'Invalidar Cache do Schema',
      description:
        'Força a releitura do schema Prisma. Use após modificações no schema.prisma.',
      inputSchema: {},
    },
    async () => {
      try {
        invalidateCache();
        const { models, enums } = parsePrismaSchema();
        return createSuccessResponse(
          `✅ Cache invalidado e schema recarregado.\n📊 ${models.length} models, ${enums.length} enums`
        );
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // ==========================================================================
  // Conexão e encerramento
  // ==========================================================================

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.error('[MCP] Encerrando servidor...');
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[MCP] Encerrando servidor...');
    await closePool();
    process.exit(0);
  });

  // Inicia servidor via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[MCP] ${MCP_NAME} v${MCP_VERSION} pronto e aguardando conexões`);
}

main().catch((error) => {
  console.error('[MCP] Erro fatal:', error);
  process.exit(1);
});
