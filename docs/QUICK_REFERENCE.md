# 🚀 Quick Reference - ALUSA

> **Guia rápido de referência para desenvolvimento no projeto ALUSA**

---

## 📁 Estrutura de Arquivos

### Onde criar cada tipo de arquivo?

| O que preciso criar       | Onde criar                                                    | Exemplo                                                 |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Nova página               | `app/(app)/[rota]/page.tsx`                                   | `app/(app)/eventos/page.tsx`                            |
| Lógica de negócio         | `features/cadastro/[entidade]/[Entidade]Feature.tsx`          | `features/cadastro/eventos/EventosFeature.tsx`          |
| Hook de dados             | `features/cadastro/[entidade]/hooks/use-[entidade].ts`        | `features/cadastro/eventos/hooks/use-eventos.ts`        |
| Service de API (frontend) | `features/cadastro/[entidade]/services/[entidade]-service.ts` | `features/cadastro/eventos/services/eventos-service.ts` |
| API Route                 | `app/api/[entidade]/route.ts`                                 | `app/api/eventos/route.ts`                              |
| Service backend           | `packages/lib/src/services/[entidade].ts`                     | `packages/lib/src/services/evento.ts`                   |
| Componente reutilizável   | `components/[categoria]/[Component].tsx`                      | `components/shared/EventCard.tsx`                       |
| Componente específico     | `features/cadastro/[entidade]/components/[Component].tsx`     | `features/cadastro/eventos/components/EventoCard.tsx`   |

---

## 🎯 Templates Rápidos

### Template: Página Nova

```tsx
// app/(app)/[rota]/page.tsx
'use client';

import [Nome]Feature from '@/features/cadastro/[entidade]/[Nome]Feature';

export default function [Nome]Page() {
  return <[Nome]Feature />;
}
```

### Template: Feature Nova

```tsx
// features/cadastro/[entidade]/[Nome]Feature.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar from '@/components/layout/EntityFiltersBar';
import DataTable from '@/components/layout/DataTable';
import Pagination from '@/components/layout/Pagination';
import StatusBadge from '@/components/shared/StatusBadge';
import useCurrentUser from '@/hooks/use-current-user';
import { use[Entidade] } from './hooks/use-[entidade]';

export default function [Nome]Feature() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const [search, setSearch] = useState('');
  const [statusValue, setStatusValue] = useState('TODOS');

  const { items, loading, page, pageSize, total, setPage } = use[Entidade]({
    contaId,
    search: search || undefined,
  });

  const columns = useMemo(() => [
    {
      id: 'nome',
      header: 'Nome',
      align: 'left',
      width: 'w-1/3',
      render: (item) => <span>{item.nome}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      width: 'w-1/6',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ], []);

  return (
    <TableLayout
      title="[Título]"
      subtitle="[Subtítulo]"
      actions={<Button>Novo Item</Button>}
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
          emptyMessage="Nenhum registro encontrado"
        />
      </div>
    </TableLayout>
  );
}
```

### Template: Hook de Dados

```typescript
// hooks/use-[entidade].ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { list[Entidade]Request } from '../services/[entidade]-service';

export interface Use[Entidade]Options {
  contaId: string | null;
  search?: string;
}

export function use[Entidade]({ contaId, search }: Use[Entidade]Options) {
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
      const result = await list[Entidade]Request({
        contaId,
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
  }, [contaId, search, state.page, state.pageSize]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const reload = useCallback(() => load(), [load]);
  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  return { ...state, reload, setPage };
}
```

### Template: Service (Frontend)

```typescript
// services/[entidade]-service.ts

export interface [Entidade]ListItem {
  id: string;
  nome: string;
  status: 'ATIVO' | 'INATIVO';
  // ... outros campos
}

export interface List[Entidade]Params {
  contaId: string;
  search?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function list[Entidade]Request(params: List[Entidade]Params) {
  const usp = new URLSearchParams({ contaId: params.contaId });

  if (params.search) usp.set('q', params.search);
  if (params.page) usp.set('page', String(params.page));
  if (params.pageSize) usp.set('pageSize', String(params.pageSize));

  const res = await fetch(`/api/[entidade]?${usp.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: params.signal,
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar dados');
  }

  return res.json();
}

export async function create[Entidade]Request(data: Create[Entidade]Data) {
  const res = await fetch('/api/[entidade]', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Falha ao criar registro');
  }

  return res.json();
}
```

### Template: API Route

```typescript
// app/api/[entidade]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listar[Entidade] } from '@alusa/lib/services/[entidade]';

export async function GET(req: Request) {
  // 1. Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 });
  }

  // 2. Autorização (role)
  const allowedRoles = ['ADMIN', 'RECEPCAO'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
  }

  // 3. Validar contaId
  const { searchParams } = new URL(req.url);
  const contaId = searchParams.get('contaId');

  if (contaId !== session.user.contaId) {
    return NextResponse.json({ error: { message: 'Acesso negado' } }, { status: 403 });
  }

  // 4. Parsear parâmetros
  const search = searchParams.get('q') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    // 5. Chamar service
    const result = await listar[Entidade]({
      contaId,
      search,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 });
  }

  const allowedRoles = ['ADMIN', 'RECEPCAO'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
  }

  try {
    const body = await req.json();
    // validar e processar...

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }
}
```

---

## 🧩 Componentes Reutilizáveis

### Layout Components

```tsx
// TableLayout - Layout padrão para páginas de listagem
<TableLayout
  title="Título"
  subtitle="Subtítulo"
  actions={<Button>Ação</Button>}
  filtersBar={<EntityFiltersBar {...props} />}
  footer={<Pagination {...props} />}
>
  {children}
</TableLayout>

// DataTable - Tabela de dados
<DataTable
  data={items}
  columns={columns}
  rowKey={(item) => item.id}
  loading={loading}
  emptyMessage="Nenhum registro"
  skeletonRows={6}
/>

// EntityFiltersBar - Barra de filtros
<EntityFiltersBar
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Buscar..."
  statusValue={statusValue}
  onStatusChange={setStatusValue}
  sortOrder={sortOrder}
  onSortChange={setSortOrder}
/>

// Pagination - Paginação
<Pagination
  total={100}
  page={1}
  pageSize={20}
  onChange={setPage}
/>

// StatusBadge - Badge de status
<StatusBadge status="ATIVA" />
<StatusBadge status="CANCELADA" />
```

### Dialog Components

```tsx
// ConfirmDeleteDialog - Dialog de confirmação
<ConfirmDeleteDialog
  open={Boolean(target)}
  onOpenChange={(open) => !open && setTarget(null)}
  title="Confirmar exclusão"
  description="Tem certeza que deseja excluir?"
  confirmLabel="Excluir"
  cancelLabel="Cancelar"
  onConfirm={async () => {
    await deleteItem(target.id);
  }}
/>
```

---

## 🔐 Sistema de Roles

### Roles Disponíveis

```typescript
enum Role {
  ADMIN           // Acesso total
  FINANCEIRO      // Área financeira
  RECEPCAO        // Matrículas, alunos, turmas
  PROFESSOR       // Suas turmas
  RESPONSAVEL     // Seus dependentes
}
```

### Verificar Role no Frontend

```tsx
import useCurrentUser from '@/hooks/use-current-user';

const { user } = useCurrentUser();

const canEdit = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');
const canDelete = user?.role === 'ADMIN';

{
  canEdit && <Button onClick={handleEdit}>Editar</Button>;
}
{
  canDelete && <Button onClick={handleDelete}>Excluir</Button>;
}
```

### Verificar Role no Backend

```typescript
const session = await getServerSession(authOptions);

const allowedRoles = ['ADMIN', 'RECEPCAO'];
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
}
```

---

## 🎨 Padrões de Código

### Imports

```tsx
// 1. React
import { useState, useEffect, useMemo } from 'react';

// 2. UI Components
import { Button } from '@/components/ui/button';

// 3. Layout Components
import TableLayout from '@/components/layout/TableLayout';

// 4. Custom Hooks
import useCurrentUser from '@/hooks/use-current-user';

// 5. Feature Hooks
import { useMatriculas } from './hooks/use-matriculas';

// 6. Types
import type { MatriculaListItem } from './services/matriculas-service';

// 7. Utils
import { maskCpf } from '@alusa/lib';
```

### Estado e Hooks

```tsx
// useCurrentUser - SEMPRE usar para obter contaId
const { user } = useCurrentUser();
const contaId = user?.contaId ?? null;

// useState - Para estados locais
const [search, setSearch] = useState('');
const [statusValue, setStatusValue] = useState('TODOS');

// useMemo - Para colunas de tabela (performance)
const columns = useMemo(() => [...], []);

// Custom hook - Para lógica de dados
const { items, loading, reload } = useMatriculas({ contaId, search });
```

### Nomenclatura

```
✅ PascalCase: Components, Types, Enums
   MatriculasFeature, MatriculaListItem, StatusMatricula

✅ camelCase: Variáveis, funções, hooks
   useMatriculas, listMatriculasRequest, contaId

✅ kebab-case: Arquivos
   use-matriculas.ts, matriculas-service.ts

✅ UPPER_SNAKE_CASE: Constantes
   DEFAULT_PAGE_SIZE, MAX_ITEMS_PER_PAGE
```

---

## 🚫 Erros Comuns

### ❌ NÃO Faça

```tsx
// ❌ Lógica na página
app/(app)/matriculas/page.tsx  // 500+ linhas

// ❌ Criar páginas duplicadas
app/(app)/recepcao/matriculas/page.tsx
app/(app)/matriculas/page.tsx

// ❌ Pastas por role
app/(app)/recepcao/
app/(app)/admin/
app/(app)/professor/

// ❌ Esquecer validação de contaId
const result = await prisma.matricula.findMany(); // Sem where: { contaId }

// ❌ Esquecer validação de role
export async function DELETE(req: Request) {
  // Qualquer um pode excluir?
}
```

### ✅ Faça

```tsx
// ✅ Página simples
app / app / matriculas / page.tsx; // 12 linhas

// ✅ Uma página, controle via roles
app / app / matriculas / page.tsx; // Único lugar

// ✅ Validar contaId sempre
const result = await prisma.matricula.findMany({
  where: { contaId }, // ✅
});

// ✅ Validar role sempre
const allowedRoles = ['ADMIN'];
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
}
```

---

## 🔍 Comandos Úteis

```bash
# Verificar estrutura existente
ls apps/web/app/(app)/
ls apps/web/features/cadastro/

# Buscar features
grep -r "Feature" apps/web/features/

# Buscar componentes
grep -r "export.*function" components/

# Buscar uso de hook
grep -r "useMatriculas" apps/web/

# Rodar dev server
pnpm dev

# Rodar testes
pnpm test

# Verificar tipos TypeScript
pnpm type-check
```

---

## 📊 Checklist de Nova Feature

```
☐ 1. Verificar se já existe
☐ 2. Criar estrutura de pastas
     └── features/cadastro/[entidade]/
         ├── [Entidade]Feature.tsx
         ├── hooks/
         │   └── use-[entidade].ts
         └── services/
             └── [entidade]-service.ts

☐ 3. Criar página wrapper
     └── app/(app)/[rota]/page.tsx

☐ 4. Criar API route
     └── app/api/[entidade]/route.ts

☐ 5. Criar service backend
     └── packages/lib/src/services/[entidade].ts

☐ 6. Implementar autenticação (middleware)
☐ 7. Implementar autorização (roles)
☐ 8. Validar multi-tenancy (contaId)
☐ 9. Adicionar tratamento de erros
☐ 10. Testar todos os fluxos
```

---

## 🆘 Ajuda Rápida

| Preciso de...           | Onde encontrar                           |
| ----------------------- | ---------------------------------------- |
| Documentação completa   | `docs/ARQUITETURA_E_PADROES.md`          |
| Exemplos de correções   | `docs/CORREMOS_DE_ARQUITETURA.md`        |
| Referência rápida       | `docs/QUICK_REFERENCE.md` (este arquivo) |
| Exemplos de código      | Outras features em `features/cadastro/`  |
| Componentes disponíveis | `components/`                            |

---

**Versão:** 1.0.0  
**Última atualização:** 2 de outubro de 2025
