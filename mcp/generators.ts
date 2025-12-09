/**
 * @file MCP Alusa - Geradores de Código
 * @description Geradores automáticos de código baseados na estrutura do banco
 */

import type {
  TableDescription,
  PrismaModel,
  PrismaField,
  PrismaEnum,
  GeneratedCode,
  ZodSchemaOptions,
  ServiceLayerOptions,
  ApiRouteOptions,
  FormOptions,
  TableOptions,
} from './types.js';
import { isSensitiveColumn } from './security.js';

// =============================================================================
// Helpers de Geração
// =============================================================================

/**
 * Converte nome de tabela PostgreSQL para PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Converte nome para camelCase
 */
function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Converte tipo Prisma/PostgreSQL para tipo Zod
 */
function toZodType(prismaType: string, isOptional: boolean, hasDefault: boolean): string {
  const baseType = (() => {
    switch (prismaType) {
      case 'String':
        return 'z.string()';
      case 'Int':
      case 'BigInt':
        return 'z.number().int()';
      case 'Float':
      case 'Decimal':
        return 'z.number()';
      case 'Boolean':
        return 'z.boolean()';
      case 'DateTime':
        return 'z.coerce.date()';
      case 'Json':
        return 'z.record(z.unknown())';
      case 'Bytes':
        return 'z.instanceof(Buffer)';
      default:
        // Enum ou tipo customizado
        return `z.nativeEnum(${prismaType})`;
    }
  })();

  if (isOptional || hasDefault) {
    return `${baseType}.optional()`;
  }

  return baseType;
}

/**
 * Converte tipo Prisma para tipo TypeScript
 */
function toTsType(prismaType: string): string {
  switch (prismaType) {
    case 'String':
      return 'string';
    case 'Int':
    case 'BigInt':
    case 'Float':
    case 'Decimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'DateTime':
      return 'Date';
    case 'Json':
      return 'Record<string, unknown>';
    case 'Bytes':
      return 'Buffer';
    default:
      return prismaType;
  }
}

// =============================================================================
// Gerador de Schema Zod
// =============================================================================

/**
 * Gera schema Zod a partir de um model Prisma
 */
export function generateZodSchema(
  model: PrismaModel,
  enums: PrismaEnum[],
  options: ZodSchemaOptions = {}
): GeneratedCode {
  const { includeRelations = false, partialFields = [], omitFields = [] } = options;

  const modelName = model.name;
  const schemaName = `${toCamelCase(modelName)}Schema`;

  const lines: string[] = [
    `/**`,
    ` * Schema Zod para ${modelName}`,
    ` * @generated Gerado automaticamente pelo MCP Alusa`,
    ` */`,
    ``,
    `import { z } from 'zod';`,
    ``,
  ];

  // Adiciona imports de enums usados
  const usedEnums = new Set<string>();
  for (const field of model.fields) {
    if (field.kind === 'enum') {
      usedEnums.add(field.type);
    }
  }

  if (usedEnums.size > 0) {
    // Gera enums inline
    for (const enumName of usedEnums) {
      const enumDef = enums.find((e) => e.name === enumName);
      if (enumDef) {
        lines.push(`// Enum ${enumName}`);
        lines.push(`export const ${enumName} = {`);
        for (const value of enumDef.values) {
          lines.push(`  ${value}: '${value}',`);
        }
        lines.push(`} as const;`);
        lines.push(``);
      }
    }
  }

  // Schema base
  lines.push(`export const ${schemaName} = z.object({`);

  for (const field of model.fields) {
    // Pula campos de relação (object kind) se não solicitado
    if (field.kind === 'object' && !includeRelations) continue;

    // Pula campos na lista de omissão
    if (omitFields.includes(field.name)) continue;

    // Pula campos sensíveis
    if (isSensitiveColumn(field.name)) continue;

    const isPartial = partialFields.includes(field.name);
    const zodType = toZodType(
      field.type,
      !field.isRequired || isPartial,
      field.hasDefaultValue
    );

    // Adiciona comentário se houver
    if (field.documentation) {
      lines.push(`  /** ${field.documentation} */`);
    }

    lines.push(`  ${field.name}: ${zodType},`);
  }

  lines.push(`});`);
  lines.push(``);

  // Schema de criação (sem id e campos automáticos)
  lines.push(`export const ${toCamelCase(modelName)}CreateSchema = ${schemaName}.omit({`);
  lines.push(`  id: true,`);
  lines.push(`  createdAt: true,`);
  lines.push(`  updatedAt: true,`);
  lines.push(`});`);
  lines.push(``);

  // Schema de atualização (todos opcionais)
  lines.push(`export const ${toCamelCase(modelName)}UpdateSchema = ${schemaName}.partial().omit({`);
  lines.push(`  id: true,`);
  lines.push(`  createdAt: true,`);
  lines.push(`});`);
  lines.push(``);

  // Tipos inferidos
  lines.push(`// Tipos inferidos`);
  lines.push(`export type ${modelName} = z.infer<typeof ${schemaName}>;`);
  lines.push(`export type ${modelName}Create = z.infer<typeof ${toCamelCase(modelName)}CreateSchema>;`);
  lines.push(`export type ${modelName}Update = z.infer<typeof ${toCamelCase(modelName)}UpdateSchema>;`);

  return {
    filename: `${toCamelCase(modelName)}.schema.ts`,
    content: lines.join('\n'),
    language: 'typescript',
    description: `Schema Zod para validação do model ${modelName}`,
  };
}

// =============================================================================
// Gerador de Service Layer
// =============================================================================

/**
 * Gera camada de serviço para um model
 */
export function generateServiceLayer(
  model: PrismaModel,
  options: ServiceLayerOptions = {}
): GeneratedCode {
  const { includePagination = true, includeFilters = true } = options;

  const modelName = model.name;
  const serviceName = `${toCamelCase(modelName)}Service`;
  const varName = toCamelCase(modelName);

  const lines: string[] = [
    `/**`,
    ` * Service Layer para ${modelName}`,
    ` * @generated Gerado automaticamente pelo MCP Alusa`,
    ` */`,
    ``,
    `import { prisma } from '@/lib/prisma';`,
    `import { ${toCamelCase(modelName)}CreateSchema, ${toCamelCase(modelName)}UpdateSchema } from './${toCamelCase(modelName)}.schema';`,
    `import type { ${modelName}, ${modelName}Create, ${modelName}Update } from './${toCamelCase(modelName)}.schema';`,
    ``,
  ];

  // Interface de filtros
  if (includeFilters) {
    lines.push(`export interface ${modelName}Filters {`);
    lines.push(`  search?: string;`);
    lines.push(`  contaId?: string;`);
    lines.push(`  status?: string;`);
    lines.push(`}`);
    lines.push(``);
  }

  // Interface de paginação
  if (includePagination) {
    lines.push(`export interface PaginationParams {`);
    lines.push(`  page?: number;`);
    lines.push(`  limit?: number;`);
    lines.push(`  orderBy?: string;`);
    lines.push(`  orderDir?: 'asc' | 'desc';`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`export interface PaginatedResult<T> {`);
    lines.push(`  data: T[];`);
    lines.push(`  total: number;`);
    lines.push(`  page: number;`);
    lines.push(`  limit: number;`);
    lines.push(`  totalPages: number;`);
    lines.push(`}`);
    lines.push(``);
  }

  // Classe do serviço
  lines.push(`export const ${serviceName} = {`);

  // findById
  lines.push(`  /**`);
  lines.push(`   * Busca ${modelName} por ID`);
  lines.push(`   */`);
  lines.push(`  async findById(id: string): Promise<${modelName} | null> {`);
  lines.push(`    return prisma.${varName}.findUnique({`);
  lines.push(`      where: { id },`);
  lines.push(`    });`);
  lines.push(`  },`);
  lines.push(``);

  // findMany
  if (includePagination && includeFilters) {
    lines.push(`  /**`);
    lines.push(`   * Lista ${modelName} com paginação e filtros`);
    lines.push(`   */`);
    lines.push(`  async findMany(`);
    lines.push(`    filters: ${modelName}Filters = {},`);
    lines.push(`    pagination: PaginationParams = {}`);
    lines.push(`  ): Promise<PaginatedResult<${modelName}>> {`);
    lines.push(`    const { page = 1, limit = 20, orderBy = 'createdAt', orderDir = 'desc' } = pagination;`);
    lines.push(`    const skip = (page - 1) * limit;`);
    lines.push(``);
    lines.push(`    const where: Record<string, unknown> = {};`);
    lines.push(``);
    lines.push(`    if (filters.contaId) {`);
    lines.push(`      where.contaId = filters.contaId;`);
    lines.push(`    }`);
    lines.push(``);
    lines.push(`    if (filters.status) {`);
    lines.push(`      where.status = filters.status;`);
    lines.push(`    }`);
    lines.push(``);
    lines.push(`    if (filters.search) {`);
    lines.push(`      where.OR = [`);
    lines.push(`        { nome: { contains: filters.search, mode: 'insensitive' } },`);
    lines.push(`      ];`);
    lines.push(`    }`);
    lines.push(``);
    lines.push(`    const [data, total] = await Promise.all([`);
    lines.push(`      prisma.${varName}.findMany({`);
    lines.push(`        where,`);
    lines.push(`        skip,`);
    lines.push(`        take: limit,`);
    lines.push(`        orderBy: { [orderBy]: orderDir },`);
    lines.push(`      }),`);
    lines.push(`      prisma.${varName}.count({ where }),`);
    lines.push(`    ]);`);
    lines.push(``);
    lines.push(`    return {`);
    lines.push(`      data,`);
    lines.push(`      total,`);
    lines.push(`      page,`);
    lines.push(`      limit,`);
    lines.push(`      totalPages: Math.ceil(total / limit),`);
    lines.push(`    };`);
    lines.push(`  },`);
  } else {
    lines.push(`  /**`);
    lines.push(`   * Lista todos ${modelName}`);
    lines.push(`   */`);
    lines.push(`  async findMany(): Promise<${modelName}[]> {`);
    lines.push(`    return prisma.${varName}.findMany();`);
    lines.push(`  },`);
  }
  lines.push(``);

  // create
  lines.push(`  /**`);
  lines.push(`   * Cria novo ${modelName}`);
  lines.push(`   */`);
  lines.push(`  async create(data: ${modelName}Create): Promise<${modelName}> {`);
  lines.push(`    const validated = ${toCamelCase(modelName)}CreateSchema.parse(data);`);
  lines.push(`    return prisma.${varName}.create({`);
  lines.push(`      data: validated,`);
  lines.push(`    });`);
  lines.push(`  },`);
  lines.push(``);

  // update
  lines.push(`  /**`);
  lines.push(`   * Atualiza ${modelName}`);
  lines.push(`   */`);
  lines.push(`  async update(id: string, data: ${modelName}Update): Promise<${modelName}> {`);
  lines.push(`    const validated = ${toCamelCase(modelName)}UpdateSchema.parse(data);`);
  lines.push(`    return prisma.${varName}.update({`);
  lines.push(`      where: { id },`);
  lines.push(`      data: validated,`);
  lines.push(`    });`);
  lines.push(`  },`);
  lines.push(``);

  // delete
  lines.push(`  /**`);
  lines.push(`   * Remove ${modelName}`);
  lines.push(`   */`);
  lines.push(`  async delete(id: string): Promise<void> {`);
  lines.push(`    await prisma.${varName}.delete({`);
  lines.push(`      where: { id },`);
  lines.push(`    });`);
  lines.push(`  },`);

  lines.push(`};`);

  return {
    filename: `${toCamelCase(modelName)}.service.ts`,
    content: lines.join('\n'),
    language: 'typescript',
    description: `Service layer com CRUD completo para ${modelName}`,
  };
}

// =============================================================================
// Gerador de API Routes (Next.js App Router)
// =============================================================================

/**
 * Gera API Route Handler para Next.js App Router
 */
export function generateNextApiRoute(
  model: PrismaModel,
  options: ApiRouteOptions = {}
): GeneratedCode {
  const { methods = ['GET', 'POST', 'PUT', 'DELETE'], includeAuth = true, includeValidation = true } = options;

  const modelName = model.name;
  const serviceName = `${toCamelCase(modelName)}Service`;
  const varName = toCamelCase(modelName);

  const lines: string[] = [
    `/**`,
    ` * API Route Handler para ${modelName}`,
    ` * @generated Gerado automaticamente pelo MCP Alusa`,
    ` */`,
    ``,
    `import { NextRequest, NextResponse } from 'next/server';`,
    `import { ${serviceName} } from '@/features/${varName}/${varName}.service';`,
  ];

  if (includeValidation) {
    lines.push(`import { ${toCamelCase(modelName)}CreateSchema, ${toCamelCase(modelName)}UpdateSchema } from '@/features/${varName}/${varName}.schema';`);
  }

  if (includeAuth) {
    lines.push(`import { auth } from '@/lib/auth';`);
  }

  lines.push(``);

  // GET - Lista ou busca por ID
  if (methods.includes('GET')) {
    lines.push(`/**`);
    lines.push(` * GET /api/${varName}s`);
    lines.push(` * Lista ${modelName} com paginação e filtros`);
    lines.push(` */`);
    lines.push(`export async function GET(request: NextRequest) {`);
    lines.push(`  try {`);

    if (includeAuth) {
      lines.push(`    const session = await auth();`);
      lines.push(`    if (!session?.user) {`);
      lines.push(`      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });`);
      lines.push(`    }`);
      lines.push(``);
    }

    lines.push(`    const { searchParams } = new URL(request.url);`);
    lines.push(`    const page = parseInt(searchParams.get('page') || '1');`);
    lines.push(`    const limit = parseInt(searchParams.get('limit') || '20');`);
    lines.push(`    const search = searchParams.get('search') || undefined;`);
    lines.push(``);
    lines.push(`    const result = await ${serviceName}.findMany(`);
    lines.push(`      { search, contaId: session?.user?.contaId },`);
    lines.push(`      { page, limit }`);
    lines.push(`    );`);
    lines.push(``);
    lines.push(`    return NextResponse.json(result);`);
    lines.push(`  } catch (error) {`);
    lines.push(`    console.error('[API] Erro ao listar ${modelName}:', error);`);
    lines.push(`    return NextResponse.json(`);
    lines.push(`      { error: 'Erro interno do servidor' },`);
    lines.push(`      { status: 500 }`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(``);
  }

  // POST - Criar
  if (methods.includes('POST')) {
    lines.push(`/**`);
    lines.push(` * POST /api/${varName}s`);
    lines.push(` * Cria novo ${modelName}`);
    lines.push(` */`);
    lines.push(`export async function POST(request: NextRequest) {`);
    lines.push(`  try {`);

    if (includeAuth) {
      lines.push(`    const session = await auth();`);
      lines.push(`    if (!session?.user) {`);
      lines.push(`      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });`);
      lines.push(`    }`);
      lines.push(``);
    }

    lines.push(`    const body = await request.json();`);

    if (includeValidation) {
      lines.push(``);
      lines.push(`    const validationResult = ${toCamelCase(modelName)}CreateSchema.safeParse(body);`);
      lines.push(`    if (!validationResult.success) {`);
      lines.push(`      return NextResponse.json(`);
      lines.push(`        { error: 'Dados inválidos', details: validationResult.error.flatten() },`);
      lines.push(`        { status: 400 }`);
      lines.push(`      );`);
      lines.push(`    }`);
    }

    lines.push(``);
    lines.push(`    const created = await ${serviceName}.create({`);
    lines.push(`      ...${includeValidation ? 'validationResult.data' : 'body'},`);
    lines.push(`      contaId: session?.user?.contaId,`);
    lines.push(`    });`);
    lines.push(``);
    lines.push(`    return NextResponse.json(created, { status: 201 });`);
    lines.push(`  } catch (error) {`);
    lines.push(`    console.error('[API] Erro ao criar ${modelName}:', error);`);
    lines.push(`    return NextResponse.json(`);
    lines.push(`      { error: 'Erro interno do servidor' },`);
    lines.push(`      { status: 500 }`);
    lines.push(`    );`);
    lines.push(`  }`);
    lines.push(`}`);
  }

  return {
    filename: `route.ts`,
    content: lines.join('\n'),
    language: 'typescript',
    description: `API Route Handler Next.js para ${modelName} (app/api/${varName}s/route.ts)`,
  };
}

// =============================================================================
// Gerador de Formulário ShadCN
// =============================================================================

/**
 * Gera componente de formulário usando ShadCN UI
 */
export function generateShadcnForm(
  model: PrismaModel,
  enums: PrismaEnum[],
  options: FormOptions = {}
): GeneratedCode {
  const { layout = 'single-column', includeValidation = true, includeRelationSelects = false } = options;

  const modelName = model.name;
  const formName = `${modelName}Form`;
  const varName = toCamelCase(modelName);

  const lines: string[] = [
    `/**`,
    ` * Formulário ${modelName}`,
    ` * @generated Gerado automaticamente pelo MCP Alusa`,
    ` */`,
    ``,
    `'use client';`,
    ``,
    `import { useForm } from 'react-hook-form';`,
    `import { zodResolver } from '@hookform/resolvers/zod';`,
    `import { Button } from '@/components/ui/button';`,
    `import {`,
    `  Form,`,
    `  FormControl,`,
    `  FormField,`,
    `  FormItem,`,
    `  FormLabel,`,
    `  FormMessage,`,
    `} from '@/components/ui/form';`,
    `import { Input } from '@/components/ui/input';`,
    `import {`,
    `  Select,`,
    `  SelectContent,`,
    `  SelectItem,`,
    `  SelectTrigger,`,
    `  SelectValue,`,
    `} from '@/components/ui/select';`,
    `import { ${toCamelCase(modelName)}CreateSchema, type ${modelName}Create } from './${varName}.schema';`,
    ``,
  ];

  // Props interface
  lines.push(`interface ${formName}Props {`);
  lines.push(`  defaultValues?: Partial<${modelName}Create>;`);
  lines.push(`  onSubmit: (data: ${modelName}Create) => void | Promise<void>;`);
  lines.push(`  isLoading?: boolean;`);
  lines.push(`}`);
  lines.push(``);

  // Componente
  lines.push(`export function ${formName}({`);
  lines.push(`  defaultValues,`);
  lines.push(`  onSubmit,`);
  lines.push(`  isLoading = false,`);
  lines.push(`}: ${formName}Props) {`);
  lines.push(`  const form = useForm<${modelName}Create>({`);
  lines.push(`    resolver: zodResolver(${toCamelCase(modelName)}CreateSchema),`);
  lines.push(`    defaultValues: defaultValues ?? {},`);
  lines.push(`  });`);
  lines.push(``);

  lines.push(`  return (`);
  lines.push(`    <Form {...form}>`);
  lines.push(`      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">`);

  if (layout === 'two-column') {
    lines.push(`        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`);
  }

  // Gera campos do formulário
  const editableFields = model.fields.filter(
    (f) =>
      f.kind === 'scalar' &&
      !f.isId &&
      !f.isReadOnly &&
      f.name !== 'createdAt' &&
      f.name !== 'updatedAt' &&
      !isSensitiveColumn(f.name)
  );

  for (const field of editableFields) {
    const fieldName = field.name;
    const label = fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    lines.push(`          <FormField`);
    lines.push(`            control={form.control}`);
    lines.push(`            name="${fieldName}"`);
    lines.push(`            render={({ field }) => (`);
    lines.push(`              <FormItem>`);
    lines.push(`                <FormLabel>${label}</FormLabel>`);
    lines.push(`                <FormControl>`);

    // Determina o tipo de input
    if (field.type === 'Boolean') {
      lines.push(`                  <Select`);
      lines.push(`                    onValueChange={(v) => field.onChange(v === 'true')}`);
      lines.push(`                    value={field.value?.toString()}`);
      lines.push(`                  >`);
      lines.push(`                    <SelectTrigger>`);
      lines.push(`                      <SelectValue placeholder="Selecione" />`);
      lines.push(`                    </SelectTrigger>`);
      lines.push(`                    <SelectContent>`);
      lines.push(`                      <SelectItem value="true">Sim</SelectItem>`);
      lines.push(`                      <SelectItem value="false">Não</SelectItem>`);
      lines.push(`                    </SelectContent>`);
      lines.push(`                  </Select>`);
    } else if (field.type === 'DateTime') {
      lines.push(`                  <Input type="date" {...field} />`);
    } else if (field.type === 'Int' || field.type === 'Float' || field.type === 'Decimal') {
      lines.push(`                  <Input`);
      lines.push(`                    type="number"`);
      lines.push(`                    {...field}`);
      lines.push(`                    onChange={(e) => field.onChange(Number(e.target.value))}`);
      lines.push(`                  />`);
    } else {
      lines.push(`                  <Input {...field} />`);
    }

    lines.push(`                </FormControl>`);
    lines.push(`                <FormMessage />`);
    lines.push(`              </FormItem>`);
    lines.push(`            )}`);
    lines.push(`          />`);
  }

  // Gera selects para enums
  const enumFields = model.fields.filter((f) => f.kind === 'enum');
  for (const field of enumFields) {
    const enumDef = enums.find((e) => e.name === field.type);
    if (!enumDef) continue;

    const label = field.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    lines.push(`          <FormField`);
    lines.push(`            control={form.control}`);
    lines.push(`            name="${field.name}"`);
    lines.push(`            render={({ field }) => (`);
    lines.push(`              <FormItem>`);
    lines.push(`                <FormLabel>${label}</FormLabel>`);
    lines.push(`                <FormControl>`);
    lines.push(`                  <Select onValueChange={field.onChange} value={field.value}>`);
    lines.push(`                    <SelectTrigger>`);
    lines.push(`                      <SelectValue placeholder="Selecione ${label.toLowerCase()}" />`);
    lines.push(`                    </SelectTrigger>`);
    lines.push(`                    <SelectContent>`);

    for (const value of enumDef.values) {
      const displayValue = value.replace(/_/g, ' ').toLowerCase();
      lines.push(`                      <SelectItem value="${value}">${displayValue}</SelectItem>`);
    }

    lines.push(`                    </SelectContent>`);
    lines.push(`                  </Select>`);
    lines.push(`                </FormControl>`);
    lines.push(`                <FormMessage />`);
    lines.push(`              </FormItem>`);
    lines.push(`            )}`);
    lines.push(`          />`);
  }

  if (layout === 'two-column') {
    lines.push(`        </div>`);
  }

  lines.push(``);
  lines.push(`        <Button type="submit" disabled={isLoading}>`);
  lines.push(`          {isLoading ? 'Salvando...' : 'Salvar'}`);
  lines.push(`        </Button>`);
  lines.push(`      </form>`);
  lines.push(`    </Form>`);
  lines.push(`  );`);
  lines.push(`}`);

  return {
    filename: `${formName}.tsx`,
    content: lines.join('\n'),
    language: 'tsx',
    description: `Formulário ShadCN UI para ${modelName}`,
  };
}

// =============================================================================
// Gerador de Tabela TanStack
// =============================================================================

/**
 * Gera componente de tabela usando TanStack Table + ShadCN
 */
export function generateTanstackTable(
  model: PrismaModel,
  options: TableOptions = {}
): GeneratedCode {
  const {
    includePagination = true,
    includeFilters = true,
    includeSorting = true,
    includeSelection = false,
    includeActions = true,
  } = options;

  const modelName = model.name;
  const tableName = `${modelName}Table`;
  const varName = toCamelCase(modelName);

  const lines: string[] = [
    `/**`,
    ` * Tabela ${modelName}`,
    ` * @generated Gerado automaticamente pelo MCP Alusa`,
    ` */`,
    ``,
    `'use client';`,
    ``,
    `import { useState } from 'react';`,
    `import {`,
    `  ColumnDef,`,
    `  flexRender,`,
    `  getCoreRowModel,`,
    `  useReactTable,`,
    includePagination ? `  getPaginationRowModel,` : '',
    includeSorting ? `  getSortedRowModel,` : '',
    includeSorting ? `  SortingState,` : '',
    `} from '@tanstack/react-table';`,
    `import {`,
    `  Table,`,
    `  TableBody,`,
    `  TableCell,`,
    `  TableHead,`,
    `  TableHeader,`,
    `  TableRow,`,
    `} from '@/components/ui/table';`,
    `import { Button } from '@/components/ui/button';`,
  ].filter(Boolean);

  if (includeActions) {
    lines.push(`import {`);
    lines.push(`  DropdownMenu,`);
    lines.push(`  DropdownMenuContent,`);
    lines.push(`  DropdownMenuItem,`);
    lines.push(`  DropdownMenuTrigger,`);
    lines.push(`} from '@/components/ui/dropdown-menu';`);
    lines.push(`import { MoreHorizontal, Pencil, Trash } from 'lucide-react';`);
  }

  if (includeSorting) {
    lines.push(`import { ArrowUpDown } from 'lucide-react';`);
  }

  lines.push(`import type { ${modelName} } from './${varName}.schema';`);
  lines.push(``);

  // Definição de colunas
  lines.push(`const columns: ColumnDef<${modelName}>[] = [`);

  // Colunas baseadas nos campos
  const displayFields = model.fields.filter(
    (f) =>
      f.kind === 'scalar' &&
      !isSensitiveColumn(f.name) &&
      f.name !== 'createdAt' &&
      f.name !== 'updatedAt'
  ).slice(0, 6); // Limita a 6 colunas

  for (const field of displayFields) {
    const header = field.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    lines.push(`  {`);
    lines.push(`    accessorKey: '${field.name}',`);

    if (includeSorting) {
      lines.push(`    header: ({ column }) => (`);
      lines.push(`      <Button`);
      lines.push(`        variant="ghost"`);
      lines.push(`        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}`);
      lines.push(`      >`);
      lines.push(`        ${header}`);
      lines.push(`        <ArrowUpDown className="ml-2 h-4 w-4" />`);
      lines.push(`      </Button>`);
      lines.push(`    ),`);
    } else {
      lines.push(`    header: '${header}',`);
    }

    // Formatação específica por tipo
    if (field.type === 'DateTime') {
      lines.push(`    cell: ({ row }) => {`);
      lines.push(`      const date = row.getValue<Date>('${field.name}');`);
      lines.push(`      return date ? new Date(date).toLocaleDateString('pt-BR') : '-';`);
      lines.push(`    },`);
    } else if (field.type === 'Decimal' || field.type === 'Float') {
      lines.push(`    cell: ({ row }) => {`);
      lines.push(`      const value = row.getValue<number>('${field.name}');`);
      lines.push(`      return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });`);
      lines.push(`    },`);
    } else if (field.type === 'Boolean') {
      lines.push(`    cell: ({ row }) => row.getValue('${field.name}') ? 'Sim' : 'Não',`);
    }

    lines.push(`  },`);
  }

  // Coluna de ações
  if (includeActions) {
    lines.push(`  {`);
    lines.push(`    id: 'actions',`);
    lines.push(`    header: 'Ações',`);
    lines.push(`    cell: ({ row }) => {`);
    lines.push(`      const item = row.original;`);
    lines.push(`      return (`);
    lines.push(`        <DropdownMenu>`);
    lines.push(`          <DropdownMenuTrigger asChild>`);
    lines.push(`            <Button variant="ghost" className="h-8 w-8 p-0">`);
    lines.push(`              <MoreHorizontal className="h-4 w-4" />`);
    lines.push(`            </Button>`);
    lines.push(`          </DropdownMenuTrigger>`);
    lines.push(`          <DropdownMenuContent align="end">`);
    lines.push(`            <DropdownMenuItem onClick={() => onEdit?.(item)}>`);
    lines.push(`              <Pencil className="mr-2 h-4 w-4" />`);
    lines.push(`              Editar`);
    lines.push(`            </DropdownMenuItem>`);
    lines.push(`            <DropdownMenuItem`);
    lines.push(`              className="text-destructive"`);
    lines.push(`              onClick={() => onDelete?.(item.id)}`);
    lines.push(`            >`);
    lines.push(`              <Trash className="mr-2 h-4 w-4" />`);
    lines.push(`              Excluir`);
    lines.push(`            </DropdownMenuItem>`);
    lines.push(`          </DropdownMenuContent>`);
    lines.push(`        </DropdownMenu>`);
    lines.push(`      );`);
    lines.push(`    },`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push(``);

  // Props interface
  lines.push(`interface ${tableName}Props {`);
  lines.push(`  data: ${modelName}[];`);
  if (includeActions) {
    lines.push(`  onEdit?: (item: ${modelName}) => void;`);
    lines.push(`  onDelete?: (id: string) => void;`);
  }
  lines.push(`}`);
  lines.push(``);

  // Componente
  lines.push(`export function ${tableName}({ data${includeActions ? ', onEdit, onDelete' : ''} }: ${tableName}Props) {`);

  if (includeSorting) {
    lines.push(`  const [sorting, setSorting] = useState<SortingState>([]);`);
  }

  lines.push(``);
  lines.push(`  const table = useReactTable({`);
  lines.push(`    data,`);
  lines.push(`    columns,`);
  lines.push(`    getCoreRowModel: getCoreRowModel(),`);
  if (includePagination) {
    lines.push(`    getPaginationRowModel: getPaginationRowModel(),`);
  }
  if (includeSorting) {
    lines.push(`    getSortedRowModel: getSortedRowModel(),`);
    lines.push(`    onSortingChange: setSorting,`);
    lines.push(`    state: { sorting },`);
  }
  lines.push(`  });`);
  lines.push(``);

  lines.push(`  return (`);
  lines.push(`    <div className="space-y-4">`);
  lines.push(`      <div className="rounded-md border">`);
  lines.push(`        <Table>`);
  lines.push(`          <TableHeader>`);
  lines.push(`            {table.getHeaderGroups().map((headerGroup) => (`);
  lines.push(`              <TableRow key={headerGroup.id}>`);
  lines.push(`                {headerGroup.headers.map((header) => (`);
  lines.push(`                  <TableHead key={header.id}>`);
  lines.push(`                    {header.isPlaceholder`);
  lines.push(`                      ? null`);
  lines.push(`                      : flexRender(`);
  lines.push(`                          header.column.columnDef.header,`);
  lines.push(`                          header.getContext()`);
  lines.push(`                        )}`);
  lines.push(`                  </TableHead>`);
  lines.push(`                ))}`);
  lines.push(`              </TableRow>`);
  lines.push(`            ))}`);
  lines.push(`          </TableHeader>`);
  lines.push(`          <TableBody>`);
  lines.push(`            {table.getRowModel().rows?.length ? (`);
  lines.push(`              table.getRowModel().rows.map((row) => (`);
  lines.push(`                <TableRow key={row.id}>`);
  lines.push(`                  {row.getVisibleCells().map((cell) => (`);
  lines.push(`                    <TableCell key={cell.id}>`);
  lines.push(`                      {flexRender(cell.column.columnDef.cell, cell.getContext())}`);
  lines.push(`                    </TableCell>`);
  lines.push(`                  ))}`);
  lines.push(`                </TableRow>`);
  lines.push(`              ))`);
  lines.push(`            ) : (`);
  lines.push(`              <TableRow>`);
  lines.push(`                <TableCell colSpan={columns.length} className="h-24 text-center">`);
  lines.push(`                  Nenhum resultado encontrado.`);
  lines.push(`                </TableCell>`);
  lines.push(`              </TableRow>`);
  lines.push(`            )}`);
  lines.push(`          </TableBody>`);
  lines.push(`        </Table>`);
  lines.push(`      </div>`);

  if (includePagination) {
    lines.push(``);
    lines.push(`      <div className="flex items-center justify-end space-x-2">`);
    lines.push(`        <Button`);
    lines.push(`          variant="outline"`);
    lines.push(`          size="sm"`);
    lines.push(`          onClick={() => table.previousPage()}`);
    lines.push(`          disabled={!table.getCanPreviousPage()}`);
    lines.push(`        >`);
    lines.push(`          Anterior`);
    lines.push(`        </Button>`);
    lines.push(`        <Button`);
    lines.push(`          variant="outline"`);
    lines.push(`          size="sm"`);
    lines.push(`          onClick={() => table.nextPage()}`);
    lines.push(`          disabled={!table.getCanNextPage()}`);
    lines.push(`        >`);
    lines.push(`          Próximo`);
    lines.push(`        </Button>`);
    lines.push(`      </div>`);
  }

  lines.push(`    </div>`);
  lines.push(`  );`);
  lines.push(`}`);

  return {
    filename: `${tableName}.tsx`,
    content: lines.join('\n'),
    language: 'tsx',
    description: `Tabela TanStack + ShadCN para ${modelName}`,
  };
}
