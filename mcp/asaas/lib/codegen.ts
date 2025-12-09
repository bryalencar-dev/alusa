import type { HttpMethod } from './asaas-client.js';

export interface FieldSpec {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  description?: string;
  optional?: boolean;
  enumValues?: string[];
}

export interface WebhookSpec {
  event: string;
  description?: string;
}

export interface IntegrationAssetRequest {
  resource: string;
  operation: string;
  description?: string;
  method?: HttpMethod;
  path?: string;
  apiUrl?: string;
  fields?: FieldSpec[];
  webhook?: WebhookSpec;
}

export interface GeneratedAsset {
  label: string;
  language: string;
  filename: string;
  content: string;
}

const DEFAULT_API_URL = '/api/financeiro/asaas';

export function generateIntegrationAssets(input: IntegrationAssetRequest): GeneratedAsset[] {
  const slug = slugify(`${input.operation}-${input.resource}`);
  const pascalName = toPascalCase(slug);
  const method = (input.method ?? inferHttpMethod(input.operation)).toUpperCase() as HttpMethod;
  const path = input.path ?? inferApiPath(input.resource);
  const description = input.description ?? `Integração ${input.operation} para ${input.resource}`;
  const fields = input.fields?.length ? input.fields : inferFieldsFromResource(input.resource);
  const apiUrl = input.apiUrl ?? DEFAULT_API_URL;

  const assets: GeneratedAsset[] = [];

  assets.push({
    label: 'TypeScript Client',
    language: 'typescript',
    filename: `client/${slug}.ts`,
    content: buildClientSnippet({ pascalName, method, path, description, schemaSlug: slug }),
  });

  assets.push({
    label: 'Zod Schemas',
    language: 'typescript',
    filename: `schemas/${slug}.ts`,
    content: buildSchemaSnippet({ pascalName, fields }),
  });

  assets.push({
    label: 'Next.js Route Handler',
    language: 'typescript',
    filename: `app${apiUrl}/${slug}/route.ts`,
    content: buildRouteSnippet({ pascalName, method, path, schemaSlug: slug }),
  });

  if (input.webhook) {
    assets.push({
      label: 'Webhook Handler',
      language: 'typescript',
      filename: `app/api/webhooks/asaas/${slug}.ts`,
      content: buildWebhookSnippet({
        event: input.webhook.event,
        description: input.webhook.description,
      }),
    });
  }

  return assets;
}

function buildClientSnippet(params: {
  pascalName: string;
  method: HttpMethod;
  path: string;
  description: string;
  schemaSlug: string;
}): string {
  const fnName = toCamelCase(`execute-${params.pascalName}`);
  const payloadKey = params.method === 'GET' ? 'query' : 'body';

  return `import { AsaasClient } from '@/integrations/asaas/client'; // Ajuste o path conforme sua aplicação
import { ${params.pascalName}Input, ${params.pascalName}Response } from '@/schemas/asaas/${params.schemaSlug}';

function ensureAsaasClient() {
  if (!process.env.ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não está configurada');
  }
  return new AsaasClient({
    apiKey: process.env.ASAAS_API_KEY,
    baseUrl: process.env.ASAAS_BASE_URL,
  });
}

/**
 * ${params.description}
 */
export async function ${fnName}(payload: ${params.pascalName}Input): Promise<${params.pascalName}Response> {
  const client = ensureAsaasClient();
  const response = await client.request<${params.pascalName}Response>({
    method: '${params.method}',
    path: '${params.path}',
    ${payloadKey}: payload,
  });

  return response.data;
}
`;
}

function buildSchemaSnippet(params: { pascalName: string; fields: FieldSpec[] }): string {
  const zodLines = params.fields.map((field) => `  ${field.name}: ${toZod(field)},`).join('\n');

  return `import { z } from 'zod';

export const ${params.pascalName}InputSchema = z.object({
${zodLines}
});

export type ${params.pascalName}Input = z.infer<typeof ${params.pascalName}InputSchema>;

export const ${params.pascalName}ResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  createdDate: z.string().datetime().optional(),
  customer: z.string().optional(),
  value: z.number().optional(),
});

export type ${params.pascalName}Response = z.infer<typeof ${params.pascalName}ResponseSchema>;
`;
}

function buildRouteSnippet(params: {
  pascalName: string;
  method: HttpMethod;
  path: string;
  schemaSlug: string;
}): string {
  const payloadBlock =
    params.method === 'GET'
      ? `const payload = ${params.pascalName}InputSchema.parse(Object.fromEntries(req.nextUrl.searchParams));`
      : `const raw = await req.json();
    const payload = ${params.pascalName}InputSchema.parse(raw);`;
  const payloadKey = params.method === 'GET' ? 'query' : 'body';

  return `import { NextRequest, NextResponse } from 'next/server';
import { AsaasClient, AsaasClientError } from '@/integrations/asaas/client'; // Ajuste o path conforme sua aplicação
import { ${params.pascalName}InputSchema } from '@/schemas/asaas/${params.schemaSlug}';

const asaasClient = new AsaasClient({
  apiKey: process.env.ASAAS_API_KEY ?? '',
  baseUrl: process.env.ASAAS_BASE_URL,
});

export async function ${params.method}(req: NextRequest) {
  try {
    ${payloadBlock}

    const response = await asaasClient.request({
      method: '${params.method}',
      path: '${params.path}',
      ${payloadKey}: payload,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    if (error instanceof AsaasClientError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
  }
}
`;
}

function buildWebhookSnippet(params: { event: string; description?: string }): string {
  return `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const signature = req.headers.get('asaas-signature') ?? '';
  const payload = await req.text();

  if (!ASAAS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'ASAAS_WEBHOOK_SECRET não configurado' }, { status: 500 });
  }

  if (!isValidSignature(payload, signature, ASAAS_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  const event = JSON.parse(payload);
  if (event.event !== '${params.event}') {
    return NextResponse.json({ received: true }, { status: 202 });
  }

  // TODO: implementar ${params.description ?? 'processamento do evento recebido do Asaas'}

  return NextResponse.json({ ok: true });
}

function isValidSignature(payload: string, signature: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
`;
}

function inferHttpMethod(operation: string): HttpMethod {
  const key = operation.toLowerCase();
  if (key.startsWith('create') || key.startsWith('gerar') || key.startsWith('emitir')) return 'POST';
  if (key.startsWith('update') || key.startsWith('atualizar')) return 'PUT';
  if (key.startsWith('delete') || key.startsWith('cancelar')) return 'DELETE';
  return 'GET';
}

function inferApiPath(resource: string): string {
  const resourceSlug = slugify(resource);
  return `/${resourceSlug.endsWith('s') ? resourceSlug : `${resourceSlug}s`}`;
}

function inferFieldsFromResource(resource: string): FieldSpec[] {
  const key = resource.toLowerCase();
  if (key.includes('cobran') || key.includes('payment')) {
    return [
      { name: 'customer', type: 'string', description: 'ID do cliente' },
      { name: 'value', type: 'number', description: 'Valor da cobrança' },
      { name: 'dueDate', type: 'date', description: 'Data de vencimento' },
      { name: 'billingType', type: 'enum', enumValues: ['PIX', 'BOLETO', 'CREDIT_CARD'], description: 'Forma de pagamento' },
      { name: 'description', type: 'string', optional: true },
    ];
  }

  if (key.includes('webhook')) {
    return [
      { name: 'url', type: 'string', description: 'Endpoint HTTPS' },
      { name: 'email', type: 'string', optional: true },
      { name: 'enabled', type: 'boolean', optional: true },
    ];
  }

  if (key.includes('cliente') || key.includes('customer')) {
    return [
      { name: 'name', type: 'string', description: 'Nome completo' },
      { name: 'cpfCnpj', type: 'string', description: 'Documento' },
      { name: 'email', type: 'string', optional: true },
      { name: 'phone', type: 'string', optional: true },
    ];
  }

  return [
    { name: 'referenceId', type: 'string', description: 'Identificador interno' },
    { name: 'metadata', type: 'string', optional: true },
  ];
}

function toZod(field: FieldSpec): string {
  let base = 'z.string()';
  switch (field.type) {
    case 'number':
      base = 'z.number()';
      break;
    case 'boolean':
      base = 'z.boolean()';
      break;
    case 'date':
      base = "z.string().datetime({ offset: true })";
      break;
    case 'enum':
      base = `z.enum([${(field.enumValues ?? []).map((value) => `'${value}'`).join(', ')}])`;
      break;
    default:
      base = 'z.string()';
  }

  if (field.description) {
    base += `.describe('${field.description}')`;
  }

  if (field.optional) {
    base += '.optional()';
  }

  return base;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function toPascalCase(value: string): string {
  return slugify(value)
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join('');
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
