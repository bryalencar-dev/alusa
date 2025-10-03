# 🔧 Correções de Arquitetura - Casos Comuns

> **Objetivo:** Documentar erros comuns de arquitetura e suas correções para evitar repetição.

**Data:** 2 de outubro de 2025

---

## 📋 Índice

1. [Erro: Criar Páginas Duplicadas](#erro-criar-páginas-duplicadas)
2. [Erro: Lógica de Negócio na Página](#erro-lógica-de-negócio-na-página)
3. [Erro: Ignorar Sistema de Roles](#erro-ignorar-sistema-de-roles)
4. [Boas Práticas](#boas-práticas)

---

## ❌ Erro: Criar Páginas Duplicadas

### Caso Real: Matrículas em `/recepcao/matriculas`

**O que aconteceu:**

- Foi criada uma página completa em `app/(app)/recepcao/matriculas/page.tsx`
- A página já existia em `app/(app)/matriculas/page.tsx`
- Resultado: Código duplicado e confusão na estrutura

**Estrutura INCORRETA criada:**

```
❌ app/(app)/recepcao/
   └── matriculas/
       ├── page.tsx              # 550 linhas (DUPLICADO!)
       ├── [id]/
       │   └── page.tsx          # 795 linhas (DUPLICADO!)
       └── nova/
           └── page.tsx
```

**Estrutura CORRETA existente:**

```
✅ app/(app)/matriculas/
   └── page.tsx                  # 12 linhas (wrapper simples)

✅ features/cadastro/matriculas/
   ├── MatriculasFeature.tsx     # 264 linhas (lógica completa)
   ├── hooks/
   │   └── use-matriculas.ts
   └── services/
       └── matriculas-service.ts
```

### Por que estava errado?

1. **Duplicação de Código:** Toda a lógica foi recriada ao invés de reutilizar
2. **Quebra do Padrão Feature-Based:** Lógica na página em vez da feature
3. **Ignorou Sistema de Roles:** Criou pasta separada `/recepcao/` quando deveria usar roles
4. **Manutenção Difícil:** Mudanças teriam que ser feitas em múltiplos lugares

### Como corrigir?

```bash
# 1. Deletar estrutura incorreta
rm -rf "apps/web/app/(app)/recepcao"

# 2. Usar a estrutura correta existente
# A página já existe em:
# - app/(app)/matriculas/page.tsx
# - features/cadastro/matriculas/MatriculasFeature.tsx

# 3. Se precisar de controle de acesso, use roles (veja abaixo)
```

---

## ❌ Erro: Lógica de Negócio na Página

### Exemplo INCORRETO

```tsx
❌ // app/(app)/matriculas/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function MatriculasPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch('/api/matriculas');
      const json = await res.json();
      setData(json.data);
      setLoading(false);
    }
    fetchData();
  }, [search]);

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      <table>
        {/* 200 linhas de tabela */}
      </table>
    </div>
  );
}
```

**Problemas:**

- ❌ Toda lógica na página
- ❌ Não reutilizável
- ❌ Difícil de testar
- ❌ Não segue o padrão do projeto

### Exemplo CORRETO

```tsx
✅ // app/(app)/matriculas/page.tsx

'use client';

import MatriculasFeature from '@/features/cadastro/matriculas/MatriculasFeature';

export default function MatriculasPage() {
  return <MatriculasFeature />;
}
```

```tsx
✅ // features/cadastro/matriculas/MatriculasFeature.tsx

'use client';

import { useState } from 'react';
import TableLayout from '@/components/layout/TableLayout';
import DataTable from '@/components/layout/DataTable';
import { useMatriculas } from './hooks/use-matriculas';
import useCurrentUser from '@/hooks/use-current-user';

export default function MatriculasFeature() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');

  const { items, loading } = useMatriculas({
    contaId: user?.contaId ?? null,
    search,
  });

  const columns = [
    // definição de colunas
  ];

  return (
    <TableLayout title="Matrículas">
      <DataTable
        data={items}
        columns={columns}
        loading={loading}
      />
    </TableLayout>
  );
}
```

**Vantagens:**

- ✅ Separação clara de responsabilidades
- ✅ Lógica reutilizável
- ✅ Fácil de testar
- ✅ Segue padrão do projeto
- ✅ Usa componentes reutilizáveis

---

## ❌ Erro: Ignorar Sistema de Roles

### Cenário: "Preciso criar uma página só para recepção"

**Forma INCORRETA:**

```bash
❌ Criar: app/(app)/recepcao/matriculas/page.tsx
❌ Criar: app/(app)/recepcao/alunos/page.tsx
❌ Criar: app/(app)/admin/configuracoes/page.tsx
```

**Forma CORRETA:**

```bash
✅ Usar: app/(app)/matriculas/page.tsx (já existe)
✅ Controlar acesso via ROLES no componente
```

### Como implementar controle de acesso?

#### 1. No Frontend (Ocultar elementos)

```tsx
✅ // features/cadastro/matriculas/MatriculasFeature.tsx

import useCurrentUser from '@/hooks/use-current-user';

export default function MatriculasFeature() {
  const { user } = useCurrentUser();

  // Definir permissões por role
  const canCreate = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');
  const canEdit = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');
  const canDelete = user?.role === 'ADMIN';
  const canViewFinanceiro = ['ADMIN', 'FINANCEIRO'].includes(user?.role ?? '');

  return (
    <TableLayout
      title="Matrículas"
      actions={
        canCreate && (
          <Button onClick={handleCreate}>Nova Matrícula</Button>
        )
      }
    >
      <DataTable
        columns={[
          {
            id: 'actions',
            render: (item) => (
              <div>
                {canEdit && <Button onClick={handleEdit}>Editar</Button>}
                {canDelete && <Button onClick={handleDelete}>Excluir</Button>}
                {canViewFinanceiro && <Button onClick={handleViewFinanceiro}>Ver Cobranças</Button>}
              </div>
            ),
          },
        ]}
      />
    </TableLayout>
  );
}
```

#### 2. No Backend (API Routes)

```typescript
✅ // app/api/matriculas/route.ts

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // Verificar autenticação
  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Não autenticado' } },
      { status: 401 }
    );
  }

  // Verificar role - apenas ADMIN e RECEPCAO podem criar matrículas
  const allowedRoles = ['ADMIN', 'RECEPCAO'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: { message: 'Sem permissão para criar matrículas' } },
      { status: 403 }
    );
  }

  // Prosseguir com criação...
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  // Apenas ADMIN pode excluir
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { message: 'Apenas administradores podem excluir' } },
      { status: 403 }
    );
  }

  // Prosseguir com exclusão...
}
```

#### 3. No Middleware (Proteger rotas inteiras)

```typescript
✅ // middleware.ts

export const config = {
  matcher: [
    '/admin/:path*',        // Protege toda área administrativa
    '/alunos/:path*',
    '/matriculas/:path*',
    '/dashboard/:path*'
  ]
};

// Para controle mais granular, adicione verificação no próprio componente
```

### Matriz de Permissões por Role

| Ação                  | ADMIN    | FINANCEIRO | RECEPCAO | PROFESSOR | RESPONSAVEL      |
| --------------------- | -------- | ---------- | -------- | --------- | ---------------- |
| Ver matrículas        | ✅ Todas | ✅ Todas   | ✅ Todas | ❌        | ✅ Suas próprias |
| Criar matrícula       | ✅       | ❌         | ✅       | ❌        | ❌               |
| Editar matrícula      | ✅       | ❌         | ✅       | ❌        | ❌               |
| Cancelar matrícula    | ✅       | ✅         | ✅       | ❌        | ❌               |
| Excluir matrícula     | ✅       | ❌         | ❌       | ❌        | ❌               |
| Ver dados financeiros | ✅       | ✅         | ❌       | ❌        | ✅ Suas próprias |
| Processar pagamento   | ✅       | ✅         | ❌       | ❌        | ❌               |

---

## ✅ Boas Práticas

### Checklist ANTES de criar uma nova página

```bash
☐ 1. Verificar se a página já existe
     grep -r "page.tsx" apps/web/app/(app)/

☐ 2. Verificar se a feature já existe
     ls apps/web/features/cadastro/

☐ 3. Se existir, NÃO CRIAR DUPLICATA
     - Usar a existente
     - Adicionar controle de acesso via roles se necessário

☐ 4. Se não existir, seguir estrutura padrão:
     ✅ Criar wrapper em app/(app)/[rota]/page.tsx (< 15 linhas)
     ✅ Criar feature em features/cadastro/[entidade]/
     ✅ Criar hook em features/cadastro/[entidade]/hooks/
     ✅ Criar service em features/cadastro/[entidade]/services/
     ✅ Reutilizar componentes de layout (TableLayout, DataTable, etc.)
```

### Template de Página (Copie e Cole)

```tsx
// app/(app)/[sua-rota]/page.tsx

'use client';

import [Sua]Feature from '@/features/cadastro/[sua-entidade]/[Sua]Feature';

export default function [Sua]Page() {
  return <[Sua]Feature />;
}
```

### Template de Feature (Copie e Cole)

```tsx
// features/cadastro/[sua-entidade]/[Sua]Feature.tsx

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import TableLayout from '@/components/layout/TableLayout';
import EntityFiltersBar from '@/components/layout/EntityFiltersBar';
import DataTable, { type DataTableColumn } from '@/components/layout/DataTable';
import Pagination from '@/components/layout/Pagination';
import StatusBadge from '@/components/shared/StatusBadge';
import useCurrentUser from '@/hooks/use-current-user';
import { use[SuaEntidade] } from './hooks/use-[sua-entidade]';
import type { [SuaEntidade]ListItem } from './services/[sua-entidade]-service';

export default function [Sua]Feature() {
  const { user } = useCurrentUser();
  const contaId = user?.contaId ?? null;

  const [search, setSearch] = useState('');
  const [statusValue, setStatusValue] = useState<StatusValue>('TODOS');

  const { items, loading, page, pageSize, total, setPage, reload } = use[SuaEntidade]({
    contaId,
    search: search || undefined,
    status: statusFilter,
  });

  const columns: DataTableColumn<[SuaEntidade]ListItem>[] = useMemo(
    () => [
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
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        width: 'w-[120px]',
        render: (item) => (
          <Button variant="outline" size="sm">
            Editar
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <TableLayout
      title="[Título da Página]"
      subtitle="[Subtítulo opcional]"
      actions={
        <Button onClick={handleCreate}>
          Novo [Item]
        </Button>
      }
      filtersBar={
        <EntityFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          statusValue={statusValue}
          onStatusChange={setStatusValue}
          searchPlaceholder="Buscar por..."
        />
      }
      footer={
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onChange={setPage}
        />
      }
    >
      <div className="bg-white rounded-xl border overflow-hidden">
        <DataTable
          data={items}
          columns={columns}
          rowKey={(item) => item.id}
          loading={loading}
          emptyMessage="Nenhum registro encontrado"
          skeletonRows={6}
        />
      </div>
    </TableLayout>
  );
}
```

---

## 🔍 Como Identificar Erros de Arquitetura

### Sinais de Alerta

#### 🚨 Sinal 1: Código duplicado

```bash
# Se encontrar isso, está errado:
app/(app)/recepcao/matriculas/page.tsx      # 500+ linhas
app/(app)/matriculas/page.tsx               # 500+ linhas
```

**Solução:** Mantenha apenas uma, transforme em feature, use roles.

#### 🚨 Sinal 2: Página com muitas linhas

```tsx
// Se sua página tem > 50 linhas, provavelmente está errado
app / app / matriculas / page.tsx; // 550 linhas ❌
```

**Solução:** Mover lógica para feature component.

#### 🚨 Sinal 3: Pastas por role

```bash
app/(app)/recepcao/      # ❌
app/(app)/admin/         # ❌ (a menos que seja funcionalidade exclusiva)
app/(app)/professor/     # ❌
```

**Solução:** Usar `app/(app)/[funcionalidade]` + controle via roles.

#### 🚨 Sinal 4: Importações de hooks diretamente na página

```tsx
// ❌ Página fazendo isso está errada
import { useMatriculas } from '@/hooks/use-matriculas';
```

**Solução:** Mover para feature component.

---

## 📊 Fluxo de Decisão

```
Preciso criar uma nova funcionalidade
              |
              v
    Já existe uma página para isso?
         /          \
       SIM          NÃO
        |            |
        v            v
    Preciso        Criar nova
    restringir     estrutura
    acesso?        feature-based
        |
        v
    Use ROLES
    no componente
    existente
```

### Exemplo de Decisão

**Cenário:** "Preciso criar gestão de matrículas para recepção"

```
1. Existe página de matrículas?
   ✅ SIM - app/(app)/matriculas/page.tsx

2. Preciso restringir acesso?
   ✅ SIM - Apenas ADMIN e RECEPCAO podem ver

3. Solução:
   ✅ Usar página existente
   ✅ Adicionar verificação de role no MatriculasFeature
   ✅ NÃO criar /recepcao/matriculas
```

---

## 🎓 Exemplos de Correções

### Exemplo 1: Corrigir Página Duplicada

**Antes (Errado):**

```
apps/web/
├── app/(app)/
│   ├── matriculas/
│   │   └── page.tsx              # Original
│   └── recepcao/
│       └── matriculas/
│           └── page.tsx          # DUPLICATA! ❌
└── features/cadastro/
    └── matriculas/
        └── MatriculasFeature.tsx
```

**Depois (Correto):**

```bash
# 1. Deletar duplicata
rm -rf apps/web/app/(app)/recepcao/matriculas

# 2. Adicionar controle de roles no componente existente
```

```tsx
// features/cadastro/matriculas/MatriculasFeature.tsx

export default function MatriculasFeature() {
  const { user } = useCurrentUser();

  // Verificar se usuário tem permissão
  const canAccess = ['ADMIN', 'RECEPCAO', 'FINANCEIRO'].includes(user?.role ?? '');

  if (!canAccess) {
    return <div>Você não tem permissão para acessar esta página.</div>;
  }

  // ... resto do código
}
```

### Exemplo 2: Mover Lógica de Página para Feature

**Antes (Errado):**

```tsx
// ❌ app/(app)/alunos/page.tsx - 400 linhas

'use client';

export default function AlunosPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // fetch data...
  }, []);

  return <div>{/* 300 linhas de UI */}</div>;
}
```

**Depois (Correto):**

```tsx
// ✅ app/(app)/alunos/page.tsx - 7 linhas

'use client';

import AlunosFeature from '@/features/cadastro/alunos/AlunosFeature';

export default function AlunosPage() {
  return <AlunosFeature />;
}
```

```tsx
// ✅ features/cadastro/alunos/AlunosFeature.tsx - 400 linhas

'use client';

import { useAlunos } from './hooks/use-alunos';
import TableLayout from '@/components/layout/TableLayout';

export default function AlunosFeature() {
  const { items, loading } = useAlunos({ contaId });

  return <TableLayout title="Alunos">{/* UI aqui */}</TableLayout>;
}
```

---

## 📝 Resumo

### ✅ DO (Faça)

- ✅ Criar páginas simples (< 15 linhas) em `app/(app)/`
- ✅ Colocar lógica em `features/cadastro/`
- ✅ Reutilizar componentes de layout
- ✅ Usar sistema de roles para controle de acesso
- ✅ Verificar se funcionalidade já existe antes de criar
- ✅ Seguir estrutura feature-based
- ✅ Usar hooks customizados para lógica de dados
- ✅ Sempre validar `contaId` (multi-tenancy)

### ❌ DON'T (Não Faça)

- ❌ Criar páginas duplicadas
- ❌ Colocar lógica de negócio em páginas
- ❌ Criar pastas por role (`/recepcao/`, `/admin/`)
- ❌ Ignorar componentes reutilizáveis
- ❌ Copiar e colar código entre features
- ❌ Criar páginas com 500+ linhas
- ❌ Esquecer validação de role
- ❌ Esquecer validação de contaId

---

## 🆘 Quando Algo Der Errado

1. **Consulte este documento**
2. **Consulte `ARQUITETURA_E_PADROES.md`**
3. **Busque features similares existentes:**
   ```bash
   ls apps/web/features/cadastro/
   ```
4. **Siga o padrão existente**
5. **Em caso de dúvida, pergunte ao time**

---

**Documento criado baseado em:** Correção de 2/10/2025 - Matrícula duplicada em `/recepcao/`  
**Mantido por:** Equipe de Desenvolvimento ALUSA  
**Versão:** 1.0.0
