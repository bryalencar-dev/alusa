# 📐 Arquitetura e Padrões de Desenvolvimento - ALUSA

> **Objetivo:** Este documento descreve a arquitetura, estrutura de pastas, padrões de desenvolvimento e convenções do projeto ALUSA para evitar criação de código duplicado ou estruturas incorretas.

**Data da última atualização:** 2 de outubro de 2025

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Padrão de Páginas (Routes)](#padrão-de-páginas-routes)
4. [Padrão de Features](#padrão-de-features)
5. [Componentes Reutilizáveis](#componentes-reutilizáveis)
6. [Sistema de Roles e Permissões](#sistema-de-roles-e-permissões)
7. [Services e APIs](#services-e-apis)
8. [Fluxo de Dados](#fluxo-de-dados)
9. [Checklist de Desenvolvimento](#checklist-de-desenvolvimento)

---

## 🏗️ Visão Geral da Arquitetura

O projeto ALUSA segue uma **arquitetura feature-based** com Next.js 14 (App Router), separando claramente:

- **Routes (Páginas):** Apenas wrappers minimalistas em `app/(app)/`
- **Features:** Lógica de negócio completa em `features/cadastro/`
- **Components:** Componentes reutilizáveis em `components/`
- **Services:** Lógica de API e manipulação de dados
- **Hooks:** Lógica de estado e efeitos reutilizáveis

### Princípios Fundamentais

✅ **DRY (Don't Repeat Yourself):** Componentes e lógica reutilizáveis  
✅ **Separation of Concerns:** Páginas não contêm lógica de negócio  
✅ **Feature-Based:** Cada feature é autocontida com suas dependências  
✅ **Type Safety:** TypeScript em 100% do código

---

## 📁 Estrutura de Pastas

```
apps/web/
├── app/
│   ├── (app)/                    # 🚨 Páginas protegidas (requerem autenticação)
│   │   ├── layout.tsx            # Layout principal com Sidebar
│   │   ├── dashboard/            # Página de dashboard
│   │   ├── alunos/               # Gestão de alunos
│   │   ├── professores/          # Gestão de professores
│   │   ├── colaboradores/        # Gestão de colaboradores
│   │   ├── turmas/               # Gestão de turmas
│   │   ├── planos/               # Gestão de planos
│   │   ├── salas/                # Gestão de salas
│   │   ├── modalidades/          # Gestão de modalidades
│   │   ├── combos/               # Gestão de combos
│   │   ├── matriculas/           # Gestão de matrículas
│   │   ├── financeiro/           # Área financeira
│   │   ├── admin/                # Área administrativa
│   │   └── conta/                # Configurações da conta
│   ├── api/                      # API Routes (Next.js)
│   └── auth/                     # Páginas de autenticação (não protegidas)
│
├── features/                     # 🎯 Features (lógica de negócio)
│   └── cadastro/
│       ├── alunos/
│       │   ├── AlunosFeature.tsx       # ✅ Componente principal
│       │   ├── hooks/                  # Hooks específicos
│       │   │   └── use-alunos.ts
│       │   └── services/               # Services de API
│       │       └── alunos-service.ts
│       ├── turmas/
│       │   ├── TurmasFeature.tsx
│       │   ├── hooks/
│       │   └── services/
│       ├── planos/
│       ├── matriculas/
│       └── ... (outras features)
│
├── components/                   # 🧩 Componentes reutilizáveis
│   ├── layout/                   # Componentes de layout
│   │   ├── TableLayout.tsx       # ✅ Layout padrão para tabelas
│   │   ├── DataTable.tsx         # ✅ Tabela de dados reutilizável
│   │   ├── EntityFiltersBar.tsx  # ✅ Barra de filtros
│   │   ├── Pagination.tsx        # ✅ Paginação
│   │   ├── Sidebar.tsx           # Menu lateral
│   │   └── CardHeader.tsx        # Cabeçalho de cartão
│   ├── shared/                   # Componentes compartilhados
│   │   ├── StatusBadge.tsx       # ✅ Badge de status
│   │   └── ImageCropDialog.tsx   # Dialog de crop de imagem
│   ├── dialogs/                  # Dialogs reutilizáveis
│   │   ├── ConfirmDeleteDialog.tsx  # ✅ Dialog de confirmação
│   │   └── EditEntityDialog.tsx     # Dialog de edição genérico
│   ├── ui/                       # Componentes UI primitivos (shadcn/ui)
│   └── [entidade]/               # Componentes específicos (ex: alunos/, turmas/)
│
├── hooks/                        # 🪝 Hooks globais
│   └── use-current-user.ts       # ✅ Hook de usuário atual
│
├── lib/                          # Utilitários e helpers
│   └── utils.ts
│
└── prisma/                       # 🗄️ Schema do banco de dados
    └── schema.prisma

packages/
└── lib/                          # 📦 Biblioteca compartilhada
    └── src/
        └── services/             # Services compartilhados (backend)
            ├── aluno.ts
            ├── turma.ts
            ├── matricula.ts
            └── ...
```

---

## 📄 Padrão de Páginas (Routes)

### ⚠️ IMPORTANTE: Páginas são APENAS Wrappers

As páginas em `app/(app)/` **NÃO DEVEM CONTER LÓGICA DE NEGÓCIO**. Elas apenas importam e renderizam o componente Feature correspondente.

### ✅ Exemplo Correto

```tsx
// ✅ apps/web/app/(app)/matriculas/page.tsx
'use client';

import MatriculasFeature from '@/features/cadastro/matriculas/MatriculasFeature';

export default function MatriculasPage() {
  return (
    <div className="p-6">
      <MatriculasFeature />
    </div>
  );
}
```

### ❌ Exemplo INCORRETO

```tsx
// ❌ NÃO FAÇA ISSO!
// apps/web/app/(app)/recepcao/matriculas/page.tsx

export default function MatriculasPage() {
  const [data, setData] = useState([]);
  // ... lógica de negócio, hooks, etc.

  return <div>{/* Muita lógica aqui */}</div>;
}
```

### 🚨 Regras Importantes

1. **NÃO crie páginas duplicadas** em pastas como `/recepcao/`, `/admin/`, etc. se a funcionalidade já existe
2. **Use o sistema de roles** para controlar acesso (explicado mais abaixo)
3. **Uma página = Um componente Feature**
4. **Páginas podem ter subpáginas** (ex: `/matriculas/[id]/page.tsx` para detalhes)

### Estrutura de Página com Detalhes

```
app/(app)/matriculas/
├── page.tsx              # Lista de matrículas
└── [id]/
    └── page.tsx          # Detalhes de uma matrícula
```

---

## 🎯 Padrão de Features

### Estrutura de uma Feature

Cada feature deve seguir esta estrutura:

```
features/cadastro/[entidade]/
├── [Entidade]Feature.tsx       # Componente principal (OBRIGATÓRIO)
├── hooks/                      # Hooks específicos da feature
│   └── use-[entidade].ts       # Hook de listagem/manipulação
├── services/                   # Services de API
│   └── [entidade]-service.ts   # Requisições HTTP e lógica de dados
└── components/                 # Componentes internos (opcional)
    └── [Component].tsx
```

### Exemplo de Feature Completa

```tsx
// ✅ features/cadastro/matriculas/MatriculasFeature.tsx

'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar from '@/components/layout/EntityFiltersBar';
import DataTable from '@/components/layout/DataTable';
import Pagination from '@/components/layout/Pagination';
import StatusBadge from '@/components/shared/StatusBadge';
import useCurrentUser from '@/hooks/use-current-user';
import { useMatriculas } from './hooks/use-matriculas';
import type { MatriculaListItem } from './services/matriculas-service';

export default function MatriculasFeature() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  // Estados locais
  const [search, setSearch] = useState('');
  const [statusValue, setStatusValue] = useState<StatusValue>('TODOS');

  // Hook de dados
  const { items, loading, page, pageSize, total, setPage, reload } = useMatriculas({
    contaId,
    search: search || undefined,
    status: statusFilter,
  });

  // Definição de colunas
  const columns = useMemo(
    () => [
      {
        id: 'aluno',
        header: 'Aluno',
        render: (item) => <span>{item.aluno.nome}</span>,
      },
      // ... outras colunas
    ],
    [],
  );

  return (
    <TableLayout
      title="Gestão de Matrículas"
      subtitle="Acompanhe matrículas, cobranças e vínculos de turmas."
      actions={<Button onClick={() => setWizardOpen(true)}>Nova matrícula</Button>}
      filtersBar={
        <EntityFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          statusValue={statusValue}
          onStatusChange={setStatusValue}
        />
      }
      footer={<Pagination total={total} page={page} pageSize={pageSize} onChange={setPage} />}
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        <DataTable
          data={items}
          columns={columns}
          rowKey={(item) => item.id}
          loading={loading}
          emptyMessage="Nenhuma matrícula encontrada"
        />
      </div>
    </TableLayout>
  );
}
```

### Anatomia de uma Feature

1. **Imports organizados:**

   - UI components
   - Layout components
   - Custom hooks
   - Types
   - Services

2. **Hook de usuário atual:**

   ```tsx
   const { user } = useCurrentUser();
   const contaId = user?.contaId ?? null;
   ```

3. **Estados locais:** Para filtros, modals, etc.

4. **Hook de dados:** Para buscar e manipular dados da API

5. **Colunas da tabela:** Definidas com `useMemo`

6. **Render com TableLayout:** Layout padrão reutilizável

---

## 🧩 Componentes Reutilizáveis

### Layout Components (Sempre use estes!)

#### 1. TableLayout

Layout padrão para todas as páginas de listagem.

```tsx
<TableLayout
  title="Título da Página"
  subtitle="Descrição opcional"
  actions={<Button>Nova ação</Button>}
  filtersBar={<EntityFiltersBar {...props} />}
  footer={<Pagination {...props} />}
>
  {/* Conteúdo da tabela */}
</TableLayout>
```

**Props:**

- `title`: Título da página
- `subtitle`: Subtítulo opcional
- `actions`: Botões de ação (ex: "Nova matrícula")
- `filtersBar`: Barra de filtros
- `footer`: Rodapé (geralmente paginação)
- `children`: Conteúdo principal

#### 2. DataTable

Tabela de dados padronizada com loading states.

```tsx
<DataTable
  data={items}
  columns={columns}
  rowKey={(item) => item.id}
  loading={loading}
  emptyMessage="Nenhum registro encontrado"
  skeletonRows={6}
/>
```

**Props:**

- `data`: Array de dados
- `columns`: Definição de colunas (tipo `DataTableColumn<T>[]`)
- `rowKey`: Função para extrair chave única
- `loading`: Estado de carregamento
- `emptyMessage`: Mensagem quando não há dados
- `skeletonRows`: Número de linhas skeleton durante loading

**Estrutura de Coluna:**

```tsx
const columns: DataTableColumn<MyType>[] = [
  {
    id: 'nome', // ID único
    header: 'Nome', // Título da coluna
    align: 'left', // 'left' | 'center' | 'right'
    width: 'w-1/4', // Classe Tailwind de largura
    render: (
      item, // Função de renderização
    ) => <span>{item.nome}</span>,
  },
];
```

#### 3. EntityFiltersBar

Barra de filtros padrão com busca, status e ordenação.

```tsx
<EntityFiltersBar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Buscar por nome, CPF..."
  statusValue={statusValue}
  onStatusChange={setStatusValue}
  sortOrder={sortOrder}
  onSortChange={setSortOrder}
/>
```

**Props:**

- `searchValue`: Valor da busca
- `onSearchChange`: Callback de mudança de busca
- `searchPlaceholder`: Placeholder do input de busca
- `statusValue`: `'TODOS' | 'ATIVO' | 'INATIVO'`
- `onStatusChange`: Callback de mudança de status
- `sortOrder`: `'ASC' | 'DESC'`
- `onSortChange`: Callback de mudança de ordenação

#### 4. Pagination

Componente de paginação padronizado.

```tsx
<Pagination total={100} page={1} pageSize={20} onChange={(newPage) => setPage(newPage)} />
```

#### 5. StatusBadge

Badge visual para status de entidades.

```tsx
<StatusBadge status="ATIVA" />
<StatusBadge status="CANCELADA" />
<StatusBadge status="PENDENTE" />
```

**Status suportados:**

- `ATIVO` / `ATIVA`
- `INATIVO` / `CANCELADA`
- `PENDENTE` / `PENDENTE_TAXA`
- `AGUARDANDO_CONFIRMACAO`
- `RECUSADA`

### Dialog Components

#### 1. ConfirmDeleteDialog

Dialog de confirmação para ações destrutivas.

```tsx
<ConfirmDeleteDialog
  open={Boolean(deleteTarget)}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
  title="Cancelar matrícula"
  description="Tem certeza que deseja cancelar esta matrícula?"
  confirmLabel="Cancelar matrícula"
  cancelLabel="Manter ativa"
  loadingLabel="Cancelando..."
  onConfirm={async () => {
    await deleteItem(deleteTarget.id);
    toast.success('Item excluído com sucesso');
  }}
/>
```

#### 2. EditEntityDialog

Dialog genérico para criação/edição de entidades.

```tsx
<EditEntityDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  title={editTarget ? 'Editar Item' : 'Novo Item'}
  onSave={handleSave}
>
  {/* Campos do formulário */}
</EditEntityDialog>
```

### Shared Components

#### StatusBadge (já explicado acima)

#### ImageCropDialog

Dialog para crop de imagens (fotos de perfil, etc.).

---

## 🔐 Sistema de Roles e Permissões

### Roles Disponíveis

Definidos em `prisma/schema.prisma`:

```prisma
enum Role {
  ADMIN           // ⭐ Acesso total ao sistema
  FINANCEIRO      // 💰 Acesso à área financeira
  RECEPCAO        // 🎫 Acesso a matrículas, alunos, turmas
  PROFESSOR       // 👨‍🏫 Acesso limitado a suas turmas
  RESPONSAVEL     // 👨‍👩‍👧 Acesso apenas aos seus dependentes
}
```

### Como Funciona o Controle de Acesso

#### 1. Middleware (Autenticação)

O arquivo `middleware.ts` protege rotas que requerem login:

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/admin/:path*', // Apenas ADMIN
    '/alunos/:path*', // ADMIN, RECEPCAO
    '/professores/:path*', // ADMIN, RECEPCAO
    '/matriculas/:path*', // ADMIN, RECEPCAO, FINANCEIRO
    '/dashboard/:path*', // Todos autenticados
  ],
};
```

#### 2. Controle no Backend (API Routes)

Verificação de role em cada API:

```typescript
// app/api/matriculas/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  // Verificar autenticação
  if (!session?.user) {
    return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 });
  }

  // Verificar role
  const allowedRoles = ['ADMIN', 'RECEPCAO', 'FINANCEIRO'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
  }

  // Prosseguir com a lógica...
}
```

#### 3. Controle no Frontend (UI)

Ocultar elementos baseado no role:

```tsx
import useCurrentUser from '@/hooks/use-current-user';

export default function MyFeature() {
  const { user } = useCurrentUser();

  const canEdit = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');
  const canDelete = user?.role === 'ADMIN';

  return (
    <div>
      {canEdit && <Button onClick={handleEdit}>Editar</Button>}

      {canDelete && <Button onClick={handleDelete}>Excluir</Button>}
    </div>
  );
}
```

### Matriz de Permissões

| Funcionalidade       | ADMIN | FINANCEIRO | RECEPCAO | PROFESSOR | RESPONSAVEL       |
| -------------------- | ----- | ---------- | -------- | --------- | ----------------- |
| Dashboard            | ✅    | ✅         | ✅       | ✅        | ✅                |
| Alunos (CRUD)        | ✅    | ❌         | ✅       | ❌        | ❌                |
| Professores (CRUD)   | ✅    | ❌         | ✅       | ❌        | ❌                |
| Colaboradores (CRUD) | ✅    | ❌         | ❌       | ❌        | ❌                |
| Turmas (CRUD)        | ✅    | ❌         | ✅       | 👁️ Ver    | ❌                |
| Planos (CRUD)        | ✅    | ✅         | ✅       | ❌        | ❌                |
| Matrículas (CRUD)    | ✅    | ✅         | ✅       | ❌        | 👁️ Ver suas       |
| Financeiro           | ✅    | ✅         | ❌       | ❌        | 👁️ Suas cobranças |
| Configurações        | ✅    | ❌         | ❌       | ❌        | ❌                |
| Usuários (Gestão)    | ✅    | ❌         | ❌       | ❌        | ❌                |

---

## 🔌 Services e APIs

### Estrutura de Service

Cada feature tem seu próprio service que comunica com a API:

```typescript
// features/cadastro/matriculas/services/matriculas-service.ts

// 1. Types
export interface MatriculaListItem {
  id: string;
  status: MatriculaStatus;
  aluno: {
    id: string;
    nome: string;
    cpf: string | null;
  };
  plano: {
    id: string;
    nome: string;
    valor: number;
  };
  // ... outros campos
}

export interface ListMatriculasParams {
  contaId: string;
  status?: MatriculaStatus | MatriculaStatus[];
  search?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

// 2. Função de listagem
export async function listMatriculasRequest(
  params: ListMatriculasParams,
): Promise<{ data: MatriculaListItem[]; total: number; page: number; pageSize: number }> {
  const usp = new URLSearchParams({ contaId: params.contaId });

  if (params.status) {
    usp.set('status', Array.isArray(params.status) ? params.status.join(',') : params.status);
  }

  if (params.search) {
    usp.set('q', params.search);
  }

  if (params.page) usp.set('page', String(params.page));
  if (params.pageSize) usp.set('pageSize', String(params.pageSize));

  const res = await fetch(`/api/matriculas?${usp.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: params.signal,
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar matrículas');
  }

  return res.json();
}

// 3. Função de criação
export async function createMatriculaRequest(data: CreateMatriculaData) {
  const res = await fetch('/api/matriculas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Falha ao criar matrícula');
  }

  return res.json();
}

// 4. Outras operações (update, delete, etc.)
```

### Estrutura de Hook

Hooks encapsulam a lógica de estado e efeitos:

```typescript
// features/cadastro/matriculas/hooks/use-matriculas.ts

export interface UseMatriculasOptions {
  contaId: string | null;
  status?: MatriculaStatus | MatriculaStatus[];
  search?: string;
}

export function useMatriculas({ contaId, status, search }: UseMatriculasOptions) {
  const [state, setState] = useState({
    items: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 20,
  });

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!contaId) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await listMatriculasRequest({
        contaId,
        status,
        search,
        page: state.page,
        pageSize: state.pageSize,
        signal: controller.signal,
      });

      setState({
        items: result.data,
        loading: false,
        error: null,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error) {
      if (error.name === 'AbortError') return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [contaId, status, search, state.page, state.pageSize]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);
  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  return {
    ...state,
    reload,
    setPage,
  };
}
```

### API Routes (Backend)

API routes ficam em `app/api/`:

```typescript
// app/api/matriculas/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listarMatriculas } from '@alusa/lib/services/matricula';

export async function GET(req: Request) {
  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 });
  }

  // 2. Autorização (role)
  const allowedRoles = ['ADMIN', 'RECEPCAO', 'FINANCEIRO'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
  }

  // 3. Validação de contaId (multi-tenancy)
  const { searchParams } = new URL(req.url);
  const contaId = searchParams.get('contaId');

  if (contaId !== session.user.contaId) {
    return NextResponse.json({ error: { message: 'Acesso negado' } }, { status: 403 });
  }

  // 4. Parsear parâmetros
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('q') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    // 5. Chamar service do backend
    const result = await listarMatriculas({
      contaId,
      status: status?.split(',') as any,
      search,
      page,
      pageSize,
    });

    // 6. Retornar resposta
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
```

---

## 📊 Fluxo de Dados

### Fluxo Completo de Listagem

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /matriculas                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Page.tsx renderiza MatriculasFeature                    │
│    app/(app)/matriculas/page.tsx                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MatriculasFeature usa useMatriculas hook                 │
│    features/cadastro/matriculas/MatriculasFeature.tsx       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. useMatriculas chama listMatriculasRequest                │
│    hooks/use-matriculas.ts                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Service faz fetch para /api/matriculas                   │
│    services/matriculas-service.ts                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. API Route valida e chama backend service                 │
│    app/api/matriculas/route.ts                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend service consulta banco via Prisma                │
│    packages/lib/src/services/matricula.ts                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Dados retornam na ordem inversa até o componente         │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy

Todos os dados são isolados por `contaId`:

```typescript
// Hook sempre passa contaId
const { user } = useCurrentUser();
const contaId = user?.contaId ?? null;

const { items } = useMatriculas({ contaId, ... });

// Service valida contaId
if (!contaId) {
  throw new Error('ContaId é obrigatório');
}

// Backend sempre filtra por contaId
const matriculas = await prisma.matricula.findMany({
  where: {
    contaId,  // ✅ SEMPRE presente
    // outros filtros...
  },
});
```

---

## ✅ Checklist de Desenvolvimento

### Ao Criar uma Nova Funcionalidade

#### 1. Verificar se já existe

```bash
# Buscar features existentes
grep -r "Feature" apps/web/features/

# Buscar páginas existentes
ls apps/web/app/(app)/
```

❌ **NÃO crie páginas duplicadas em `/recepcao/`, `/admin/`, etc.**  
✅ **Use o sistema de roles para controlar acesso**

#### 2. Estrutura de Arquivos

```
✅ Criar Feature em features/cadastro/[entidade]/
✅ Criar Hook em features/cadastro/[entidade]/hooks/
✅ Criar Service em features/cadastro/[entidade]/services/
✅ Criar Page em app/(app)/[entidade]/page.tsx (apenas wrapper)
✅ Criar API Route em app/api/[entidade]/route.ts
✅ Criar Service backend em packages/lib/src/services/[entidade].ts
```

#### 3. Componentes a Usar

```tsx
✅ TableLayout (layout da página)
✅ DataTable (tabela de dados)
✅ EntityFiltersBar (filtros)
✅ Pagination (paginação)
✅ StatusBadge (badges de status)
✅ ConfirmDeleteDialog (confirmação de exclusão)
```

#### 4. Padrões de Código

```tsx
✅ Use 'use client' em componentes React
✅ Use TypeScript para tudo
✅ Use useCurrentUser() para obter usuário/contaId
✅ Use useMemo para colunas de tabela
✅ Use useState para estados locais
✅ Use custom hooks para lógica de dados
✅ Sempre valide contaId (multi-tenancy)
✅ Sempre valide role (autorização)
```

#### 5. Testes

```bash
# Testar listagem
- Verificar se carrega dados corretamente
- Verificar filtros (busca, status, ordenação)
- Verificar paginação
- Verificar loading states
- Verificar empty states

# Testar criação
- Verificar validações
- Verificar feedback de sucesso/erro
- Verificar reload após criação

# Testar edição/exclusão
- Verificar confirmação
- Verificar atualização da lista
```

---

## 🎨 Padrões Visuais

### Cores

```css
/* Brand Colors */
--brand-primary: #0e3f7e;
--brand-accent: #ff6b35;

/* Status Colors */
--status-ativo: #10b981; /* Green */
--status-inativo: #6b7280; /* Gray */
--status-pendente: #f59e0b; /* Yellow */
--status-cancelado: #ef4444; /* Red */
```

### Espaçamentos Padrão

```tsx
// Card padding
padding: 32px

// Card radius
borderRadius: 40px

// Gap entre sidebar e conteúdo
gap: 12px

// Padding externo
paddingTop: 20px
paddingRight: 24px
paddingBottom: 24px
```

### Tipografia

```css
/* Títulos */
h1: text-2xl font-bold text-gray-900
h2: text-xl font-semibold text-gray-900
h3: text-lg font-medium text-gray-900

/* Texto */
body: text-sm text-gray-700
small: text-xs text-gray-500
```

---

## 🚀 Exemplos Práticos

### Exemplo 1: Criar nova feature "Eventos"

```bash
# 1. Criar estrutura de pastas
mkdir -p features/cadastro/eventos/{hooks,services}
mkdir -p app/(app)/eventos
mkdir -p app/api/eventos

# 2. Criar arquivos
touch features/cadastro/eventos/EventosFeature.tsx
touch features/cadastro/eventos/hooks/use-eventos.ts
touch features/cadastro/eventos/services/eventos-service.ts
touch app/(app)/eventos/page.tsx
touch app/api/eventos/route.ts
```

```tsx
// 3. app/(app)/eventos/page.tsx
'use client';

import EventosFeature from '@/features/cadastro/eventos/EventosFeature';

export default function EventosPage() {
  return <EventosFeature />;
}
```

```tsx
// 4. features/cadastro/eventos/EventosFeature.tsx
'use client';

import TableLayout from '@/components/layout/TableLayout';
import DataTable from '@/components/layout/DataTable';
import { useEventos } from './hooks/use-eventos';

export default function EventosFeature() {
  const { items, loading } = useEventos({ contaId });

  const columns = [
    { id: 'nome', header: 'Nome', render: (item) => <span>{item.nome}</span> },
    // ... outras colunas
  ];

  return (
    <TableLayout title="Eventos">
      <DataTable data={items} columns={columns} loading={loading} />
    </TableLayout>
  );
}
```

### Exemplo 2: Adicionar filtro por plano em Matrículas

```tsx
// 1. Atualizar service para aceitar planoId
export interface ListMatriculasParams {
  contaId: string;
  status?: MatriculaStatus;
  search?: string;
  planoId?: string; // ✅ Novo parâmetro
}

// 2. Atualizar hook para passar planoId
const { items } = useMatriculas({
  contaId,
  status,
  search,
  planoId, // ✅ Novo parâmetro
});

// 3. Atualizar componente para incluir select de plano
const [planoId, setPlanoId] = useState<string | undefined>();

<select value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
  <option value="">Todos os planos</option>
  {planos.map((p) => (
    <option key={p.id} value={p.id}>
      {p.nome}
    </option>
  ))}
</select>;
```

---

## 📚 Referências Rápidas

### Hooks Globais

```typescript
useCurrentUser(); // Usuário atual e contaId
useMatriculas(); // Listagem de matrículas
useAlunos(); // Listagem de alunos
useTurmas(); // Listagem de turmas
usePlanos(); // Listagem de planos
// ... etc
```

### Services Compartilhados (Backend)

```typescript
// packages/lib/src/services/
listarMatriculas();
buscarMatriculaPorId();
criarMatricula();
cancelarMatricula();
// ... etc
```

### Componentes UI (shadcn/ui)

```typescript
// components/ui/
<Button />
<Input />
<Select />
<Dialog />
<Dropdown />
<Toast />
// ... etc
```

---

## 🔍 Troubleshooting

### Problema: Página não carrega dados

**Checklist:**

1. ✅ Verificar se `contaId` está sendo passado corretamente
2. ✅ Verificar se usuário tem a role correta
3. ✅ Verificar se API route está validando permissões
4. ✅ Verificar console do navegador para erros
5. ✅ Verificar logs do servidor

### Problema: "Forbidden" ou "Unauthorized"

**Solução:**

1. Verificar se usuário está logado
2. Verificar se role permite acesso à funcionalidade
3. Verificar se contaId corresponde aos dados solicitados

### Problema: Criou página em local errado

**Solução:**

1. Deletar a pasta/arquivo criado incorretamente
2. Verificar se já existe uma feature para a funcionalidade
3. Criar apenas o wrapper em `app/(app)/[rota]/page.tsx`
4. Criar a lógica em `features/cadastro/[entidade]/`

---

## 📝 Notas Finais

- **Sempre consulte este documento** antes de criar novas páginas/features
- **Não duplique código** - reutilize componentes existentes
- **Siga os padrões** - mantém o código consistente e fácil de manter
- **Use TypeScript** - evita bugs e melhora a experiência de desenvolvimento
- **Teste suas mudanças** - garante que tudo funciona como esperado

---

**Documento mantido por:** Equipe de Desenvolvimento ALUSA  
**Última atualização:** 2 de outubro de 2025  
**Versão:** 1.0.0
