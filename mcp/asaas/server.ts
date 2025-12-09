#!/usr/bin/env node

/**
 * @file MCP Asaas7 - Contexto Oficial da Documentação Asaas
 * @description MCP Server para fornecer contexto real da documentação oficial do Asaas para agentes IA
 * @version 1.0.0
 *
 * Este servidor MCP permite que agentes de IA (Copilot, Claude, etc) acessem
 * a documentação oficial do Asaas de forma inteligente, com:
 *
 * - Interpretação de perguntas abertas (criar cliente, sincronizar cobranças, etc)
 * - Busca semântica na documentação oficial (150+ páginas indexadas)
 * - Geração de código pronto para uso (clients, schemas, endpoints)
 * - Recomendações de fluxo e boas práticas
 * - Execução de operações na API Asaas
 */

import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ASAAS_DOC_SOURCES } from './lib/doc-sources.js';
import { DocManager } from './lib/doc-manager.js';
import { AsaasClient, AsaasClientError, type HttpMethod } from './lib/asaas-client.js';
import { generateIntegrationAssets } from './lib/codegen.js';
import { buildRecommendations } from './lib/examples.js';
import { parseUserIntent } from './lib/intent-parser.js';
import { buildSmartResponse } from './lib/smart-response.js';

// =============================================================================
// Configuração
// =============================================================================

const MCP_NAME = 'asaas7';
const MCP_VERSION = '1.0.0';
const CACHE_PATH = path.resolve('mcp/asaas/cache/asaas-docs.json');

const docManager = new DocManager({
  cachePath: CACHE_PATH,
  sources: ASAAS_DOC_SOURCES,
  maxDepth: Number(process.env.ASAAS_DOC_MAX_DEPTH ?? 2),
  maxPages: Number(process.env.ASAAS_DOC_MAX_PAGES ?? 150),
  autoRefreshHours: Number(process.env.ASAAS_DOC_AUTO_REFRESH_HOURS ?? 8),
});

const defaultApiKey = process.env.ASAAS_API_KEY ?? null;
const defaultBaseUrl = process.env.ASAAS_BASE_URL ?? undefined;
const sharedClient = defaultApiKey
  ? new AsaasClient({ apiKey: defaultApiKey, baseUrl: defaultBaseUrl })
  : null;

async function main() {
  console.error(`[MCP:${MCP_NAME}] iniciando v${MCP_VERSION}`);
  await docManager.initialize();
  const summary = docManager.getSummary();
  console.error(
    `[MCP:${MCP_NAME}] documentação carregada (${summary.records} páginas • atualizada em ${summary.lastUpdated ?? 'N/A'})`
  );

  const server = new McpServer(
    {
      name: MCP_NAME,
      version: MCP_VERSION,
    },
    {
      instructions: buildInstructions(summary.records, summary.lastUpdated),
    }
  );

  registerDocStatusTool(server);
  registerAskAsaasTool(server);
  registerDocSearchTool(server);
  registerDocRefreshTool(server);
  registerCallApiTool(server);
  registerCodegenTool(server);
  registerRecommendationTool(server);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.error(`[MCP:${MCP_NAME}] Encerrando servidor...`);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.error(`[MCP:${MCP_NAME}] Encerrando servidor...`);
    process.exit(0);
  });

  // Inicia servidor via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[MCP:${MCP_NAME}] v${MCP_VERSION} pronto e aguardando conexões`);
}

function buildInstructions(recordCount: number, lastUpdated: string | null) {
  return `
MCP financeiro exclusivo do Asaas - Contexto oficial para agentes IA.

🎯 FERRAMENTA PRINCIPAL: askAsaas
Use #asaas7 <sua pergunta> para obter contexto real da documentação oficial.

Exemplos de uso:
- #asaas7 como criar um cliente?
- #asaas7 quero sincronizar cobranças recorrentes
- #asaas7 resolver problema de webhook
- #asaas7 implementar pagamento PIX na minha feature
- #asaas7 tokenizar cartão de crédito
- #asaas7 criar link de pagamento
- #asaas7 configurar split
- #asaas7 criar subconta white label
- #asaas7 transferência PIX
- #asaas7 antecipação de recebíveis

📚 Base de conhecimento: ${recordCount} páginas indexadas (atualizado em ${lastUpdated ?? 'primeira execução'})

🔧 Ferramentas disponíveis:
- askAsaas: Pergunta aberta com resposta inteligente (contexto + código + docs)
- searchAsaasDocs: Busca específica na documentação
- callAsaasApi: Executa operações na API (GET/POST/PUT/PATCH/DELETE)
- generateIntegrationAssets: Gera clients, schemas e endpoints
- recommendFinancialFlow: Recomendações de fluxo financeiro
- docStatus / refreshAsaasDocs: Status e atualização do cache

Fontes oficiais: https://docs.asaas.com/, https://docs.asaas.com/docs/visao-geral, https://docs.asaas.com/reference/comece-por-aqui, https://docs.asaas.com/changelog, https://docs.asaas.com/page/breaking-changes, https://docs.asaas.com/page/sugestoes
`.trim();
}

function registerDocStatusTool(server: McpServer) {
  server.registerTool(
    'docStatus',
    {
      title: 'Status da documentação do Asaas',
      description: 'Exibe quantas páginas estão em cache e quando foi a última atualização.',
      inputSchema: {},
    },
    async () => {
      try {
        const summary = docManager.getSummary();
        const markdown = [
          '## Cache da Documentação Asaas',
          `- Páginas indexadas: ${summary.records}`,
          `- Última atualização: ${summary.lastUpdated ?? 'desconhecida'}`,
          `- Atualização automática (horas): ${summary.autoRefreshHours}`,
          `- Fontes principais:`,
          ...summary.sources.map((source) => `  - ${source}`),
        ].join('\n');

        return createTextResponse(markdown);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function registerAskAsaasTool(server: McpServer) {
  server.registerTool(
    'askAsaas',
    {
      title: 'Perguntar ao Asaas (IA)',
      description: `
Ferramenta principal para perguntas abertas sobre integração com o Asaas.
Interpreta sua pergunta, busca contexto real na documentação oficial,
e retorna uma resposta completa com:
- Explicação do contexto
- Passos de implementação
- Exemplos de código prontos
- Links para documentação oficial
- Alertas e boas práticas

Exemplos de uso:
- "como criar um cliente?"
- "quero sincronizar cobranças recorrentes"
- "resolver problema de webhook"
- "implementar pagamento PIX"
- "tokenizar cartão de crédito"
- "criar link de pagamento"
- "configurar split de pagamento"
- "fazer transferência PIX"
- "criar subconta white label"
- "simular antecipação de recebíveis"
      `.trim(),
      inputSchema: {
        question: z.string().min(5).describe('Sua pergunta ou descrição do que deseja fazer com o Asaas'),
        includeCode: z.boolean().optional().describe('Incluir exemplos de código na resposta (padrão: true)'),
        maxDocs: z.number().min(1).max(8).optional().describe('Quantidade máxima de referências da documentação'),
      },
    },
    async ({ question, includeCode, maxDocs }) => {
      try {
        // 1. Interpretar a intenção do usuário
        const intent = parseUserIntent(question as string);

        // 2. Buscar documentação relevante usando os termos de busca otimizados
        const searchQuery = intent.searchTerms.slice(0, 6).join(' ');
        const docResults = docManager.search(searchQuery, (maxDocs as number | undefined) ?? 5);

        // 3. Se não encontrar nada, buscar pelas keywords originais
        const finalDocResults = docResults.length > 0
          ? docResults
          : docManager.search(intent.keywords.slice(0, 4).join(' '), (maxDocs as number | undefined) ?? 5);

        // 4. Buscar exemplos de código da documentação
        const codeSamples = (includeCode !== false)
          ? docManager.getCodeSamples(searchQuery, 3)
          : [];

        // 5. Montar resposta inteligente
        const response = buildSmartResponse({
          intent,
          docResults: finalDocResults,
          codeSamples,
        });

        // 6. Adicionar links sugeridos da documentação se disponíveis
        let markdown = response.markdown;
        if (intent.suggestedDocs.length > 0 && finalDocResults.length === 0) {
          markdown += '\n\n### 📚 Links Sugeridos\n';
          markdown += intent.suggestedDocs.map(url => `- ${url}`).join('\n');
        }

        return createTextResponse(markdown);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function registerDocSearchTool(server: McpServer) {
  server.registerTool(
    'searchAsaasDocs',
    {
      title: 'Pesquisar documentação oficial',
      description: 'Busca contextual na documentação oficial do Asaas, trazendo snippets e links.',
      inputSchema: {
        query: z.string().min(3).describe('Termo ou pergunta (ex: "como criar cobrança pix")'),
        limit: z.number().min(1).max(8).optional().describe('Quantidade máxima de resultados'),
      },
    },
    async ({ query, limit }) => {
      try {
        const results = docManager.search(query as string, (limit as number | undefined) ?? 5);
        if (!results.length) {
          return createTextResponse('Nenhum trecho encontrado. Tente outro termo.');
        }

        const markdown = results
          .map(
            (result, index) =>
              `### ${index + 1}. ${result.title}\n${result.snippet}\n[abrir documentação](${result.url})\nPontuação: ${result.score}`
          )
          .join('\n\n');

        return createTextResponse(markdown);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function registerDocRefreshTool(server: McpServer) {
  server.registerTool(
    'refreshAsaasDocs',
    {
      title: 'Atualizar cache da documentação',
      description: 'Força a releitura dos links oficiais do Asaas para obter conteúdo atualizado.',
      inputSchema: {},
    },
    async () => {
      try {
        const result = await docManager.refresh();
        const markdown = [
          '### Cache atualizado',
          `- Páginas processadas: ${result.processed}`,
          result.errors.length ? `- Avisos: ${result.errors.join('; ')}` : '- Sem avisos',
        ].join('\n');
        return createTextResponse(markdown);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function registerCallApiTool(server: McpServer) {
  server.registerTool(
    'callAsaasApi',
    {
      title: 'Executar operação na API Asaas',
      description:
        'Opera diretamente na API oficial do Asaas. Suporta GET, POST, PUT, PATCH e DELETE, com query params e payload.',
      inputSchema: {
        method: z
          .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
          .describe('Método HTTP suportado pelo Asaas'),
        path: z
          .string()
          .min(1)
          .describe('Caminho relativo (ex: /payments, /customers/{id}/payments)'),
        query: z
          .record(z.union([z.string(), z.number(), z.boolean()]))
          .optional()
          .describe('Query parameters opcionais'),
        payload: z.unknown().optional().describe('Body JSON quando aplicável'),
        idempotencyKey: z.string().optional().describe('Cabeçalho x-idempotency-key'),
        apiKey: z.string().optional().describe('API key alternativa (caso não use .env)'),
        baseUrl: z.string().optional().describe('Base URL alternativa (default https://www.asaas.com/api/v3)'),
      },
    },
    async ({ method, path, query, payload, idempotencyKey, apiKey, baseUrl }) => {
      try {
        const client = resolveAsaasClient(apiKey as string | undefined, baseUrl as string | undefined);
        const response = await client.request({
          method: method as HttpMethod,
          path: path as string,
          query: query as Record<string, string | number | boolean> | undefined,
          body: payload,
          idempotencyKey: idempotencyKey as string | undefined,
        });

        const markdown = [
          `### ✅ Asaas respondeu ${response.status}`,
          response.requestId ? `- Request-ID: ${response.requestId}` : '- Request-ID: n/d',
          '',
          '```json',
          JSON.stringify(response.data, null, 2),
          '```',
        ].join('\n');

        return createTextResponse(markdown);
      } catch (error) {
        if (error instanceof AsaasClientError) {
          const markdown = [
            `### ❌ Asaas retornou ${error.status}`,
            error.requestId ? `- Request-ID: ${error.requestId}` : '',
            '',
            '```json',
            JSON.stringify(error.details ?? { message: error.message }, null, 2),
            '```',
          ]
            .filter(Boolean)
            .join('\n');
          return createMarkdownError(markdown);
        }

        return createErrorResponse(error);
      }
    }
  );
}

function registerCodegenTool(server: McpServer) {
  server.registerTool(
    'generateIntegrationAssets',
    {
      title: 'Gerar client + schema + endpoint',
      description:
        'Gera automaticamente client TypeScript, schemas Zod, route handler Next.js e handler de webhook opcional para um recurso do Asaas.',
      inputSchema: {
        resource: z.string().min(3).describe('Recurso alvo (ex: cobranças, clientes, webhooks)'),
        operation: z.string().min(3).describe('Operação desejada (ex: criar, listar)'),
        description: z.string().optional(),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
        path: z.string().optional(),
        apiUrl: z.string().optional(),
        fields: z
          .array(
            z.object({
              name: z.string(),
              type: z.enum(['string', 'number', 'boolean', 'date', 'enum']),
              description: z.string().optional(),
              optional: z.boolean().optional(),
              enumValues: z.array(z.string()).optional(),
            })
          )
          .optional(),
        webhook: z
          .object({
            event: z.string(),
            description: z.string().optional(),
          })
          .optional(),
      },
    },
    async (input) => {
      try {
        const assets = generateIntegrationAssets(input as any);
        const markdown = assets
          .map(
            (asset) =>
              `### ${asset.label}\n**Arquivo:** ${asset.filename}\n\n\`\`\`${asset.language}\n${asset.content}\n\`\`\``
          )
          .join('\n\n');
        return createTextResponse(markdown);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function registerRecommendationTool(server: McpServer) {
  server.registerTool(
    'recommendFinancialFlow',
    {
      title: 'Recomendar fluxo financeiro',
      description:
        'Sugere passos, endpoints e referências oficiais para um cenário financeiro (ex: conciliação, cobrança PIX, webhooks).',
      inputSchema: {
        scenario: z.string().min(5).describe('Descrição do cenário desejado'),
        goals: z.array(z.string()).optional().describe('Metas específicas do usuário'),
        maxDocs: z.number().min(1).max(6).optional(),
      },
    },
    async ({ scenario, goals, maxDocs }) => {
      try {
        const docResults = docManager.search(scenario as string, (maxDocs as number | undefined) ?? 4);
        const codeExamples = docManager.getCodeSamples(scenario as string, 2);
        const recommendation = buildRecommendations({
          scenario: scenario as string,
          goals: goals as string[] | undefined,
          docResults,
          requestedExamples: codeExamples,
        });

        const markdown = [
          `## ${recommendation.summary}`,
          '',
          '**Passos sugeridos**',
          ...recommendation.steps.map((step, index) => `${index + 1}. ${step}`),
          '',
          recommendation.docReferences.length ? '**Fontes oficiais**' : '',
          ...recommendation.docReferences.map((doc) => `- [${doc.title}](${doc.url})`),
          '',
          recommendation.codeExamples.length ? '**Exemplos**' : '',
          ...recommendation.codeExamples.map((sample) => `\`\`\`\n${sample}\n\`\`\``),
        ]
          .filter(Boolean)
          .join('\n');

        return createTextResponse(markdown);
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
}

function resolveAsaasClient(apiKey?: string, baseUrl?: string) {
  const key = apiKey ?? defaultApiKey;
  if (!key) {
    throw new Error('Defina ASAAS_API_KEY no .env ou informe apiKey na chamada.');
  }
  if (!apiKey && !baseUrl && sharedClient) {
    return sharedClient;
  }
  return new AsaasClient({ apiKey: key, baseUrl: baseUrl ?? defaultBaseUrl });
}

function createTextResponse(markdown: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: markdown,
      },
    ],
  };
}

function createMarkdownError(markdown: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: markdown,
      },
    ],
    isError: true,
  };
}

function createErrorResponse(error: unknown) {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : JSON.stringify(error, null, 2);
  return {
    content: [
      {
        type: 'text' as const,
        text: `❌ ${message}`,
      },
    ],
    isError: true,
  };
}

main().catch((error) => {
  console.error('[asaas-mcp] Erro fatal', error);
  process.exit(1);
});
