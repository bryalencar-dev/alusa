# 🤖 Instruções para GitHub Copilot - Projeto ALUSA

> **Objetivo:** Instruções específicas para AI assistants (GitHub Copilot, ChatGPT, Claude, etc.) evitarem erros comuns ao trabalhar neste projeto.

---

## ⚠️ REGRAS CRÍTICAS - SEMPRE SEGUIR

### 🚨 Regra #1: NUNCA Crie Páginas Duplicadas

**Antes de criar QUALQUER página:**

```bash
# 1. SEMPRE verifique se já existe
ls apps/web/app/(app)/

# 2. Se encontrar a rota, NÃO CRIE DUPLICATA
# Exemplo: Se existe app/(app)/matriculas/page.tsx
# NÃO crie app/(app)/recepcao/matriculas/page.tsx
```

**❌ Exemplos de ERROS que causaram problemas:**

```
❌ apps/web/app/(app)/recepcao/matriculas/page.tsx
   (quando já existe apps/web/app/(app)/matriculas/page.tsx)

❌ apps/web/app/(app)/admin/configuracoes/usuarios/page.tsx
   (quando já existe apps/web/app/(app)/admin/configuracoes/page.tsx)

❌ apps/web/app/(app)/professor/turmas/page.tsx
   (quando já existe apps/web/app/(app)/turmas/page.tsx)
```

**✅ Solução correta:**

- Use a página existente
- Adicione controle de acesso via **ROLES** no componente Feature
- NÃO crie pastas por role (/recepcao/, /admin/, /professor/)

---

### 🚨 Regra #2: Páginas São APENAS Wrappers

**Páginas em `app/(app)/` devem ter NO MÁXIMO 15 linhas.**

**✅ Estrutura CORRETA de uma página:**

```tsx
// app/(app)/[rota]/page.tsx
'use client';

import [Nome]Feature from '@/features/cadastro/[entidade]/[Nome]Feature';

export default function [Nome]Page() {
  return <[Nome]Feature />;
}
```

**❌ NUNCA faça isso em uma página:**

```tsx
// ❌ NÃO! Lógica na página
export default function MatriculasPage() {
  const [data, setData] = useState([]);  // ❌ Estado
  const [loading, setLoading] = useState(false);  // ❌ Loading

  useEffect(() => {  // ❌ Efeitos
    fetch('/api/matriculas')...
  }, []);

  return (
    <div>
      <input />  // ❌ UI complexa
      <table>... 200 linhas ...</table>  // ❌ Muita lógica
    </div>
  );
}
```

**✅ Coloque TODA lógica em Features:**

- `features/cadastro/[entidade]/[Entidade]Feature.tsx`

---

### 🚨 Regra #3: Use Sistema de Roles, Não Pastas

**❌ NÃO crie estruturas como:**

```
app/(app)/
├── recepcao/           ❌ Errado!
│   ├── matriculas/
│   ├── alunos/
│   └── turmas/
├── admin/              ❌ Evite (exceto funcionalidades exclusivas)
│   └── usuarios/
└── professor/          ❌ Errado!
    └── turmas/
```

**✅ Estrutura CORRETA:**

```
app/(app)/
├── matriculas/         ✅ Uma página única
├── alunos/             ✅ Uma página única
└── turmas/             ✅ Uma página única

# Controle de acesso VIA CÓDIGO:
```

```tsx
// ✅ No componente Feature
import useCurrentUser from '@/hooks/use-current-user';

export default function MatriculasFeature() {
  const { user } = useCurrentUser();

  // Controlar acesso por role
  const canCreate = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');
  const canEdit = ['ADMIN', 'RECEPCAO'].includes(user?.role ?? '');
  const canDelete = user?.role === 'ADMIN';

  return (
    <TableLayout actions={canCreate && <Button>Nova Matrícula</Button>}>{/* ... */}</TableLayout>
  );
}
```

---

### 🚨 Regra #4: Estrutura de Arquivos É FIXA

**Quando criar nova funcionalidade, SEMPRE siga esta ordem:**

```
1. ✅ features/cadastro/[entidade]/
   ├── [Entidade]Feature.tsx         # Componente principal
   ├── hooks/
   │   └── use-[entidade].ts         # Hook de dados
   └── services/
       └── [entidade]-service.ts     # Requisições API

2. ✅ app/(app)/[rota]/
   └── page.tsx                      # Wrapper (< 15 linhas)

3. ✅ app/api/[entidade]/
   └── route.ts                      # API route

4. ✅ packages/lib/src/services/
   └── [entidade].ts                 # Service backend (Prisma)
```

**Exemplo prático - Criar funcionalidade "Eventos":**

```
✅ features/cadastro/eventos/EventosFeature.tsx
✅ features/cadastro/eventos/hooks/use-eventos.ts
✅ features/cadastro/eventos/services/eventos-service.ts
✅ app/(app)/eventos/page.tsx
✅ app/api/eventos/route.ts
✅ packages/lib/src/services/evento.ts
```

---

## 🧩 Componentes OBRIGATÓRIOS

### Sempre use estes componentes de layout:

```tsx
// 1. TableLayout - Layout padrão para listagens
import TableLayout from '@/components/layout/TableLayout';

<TableLayout
  title="Título"
  subtitle="Subtítulo"
  actions={<Button>Nova ação</Button>}
  filtersBar={<EntityFiltersBar {...} />}
  footer={<Pagination {...} />}
>
  {children}
</TableLayout>

// 2. DataTable - Tabela de dados
import DataTable from '@/components/layout/DataTable';

<DataTable
  data={items}
  columns={columns}
  rowKey={(item) => item.id}
  loading={loading}
  emptyMessage="Nenhum registro"
/>

// 3. EntityFiltersBar - Barra de filtros
import EntityFiltersBar from '@/components/layout/EntityFiltersBar';

<EntityFiltersBar
  searchValue={search}
  onSearchChange={setSearch}
  statusValue={statusValue}
  onStatusChange={setStatusValue}
/>

// 4. Pagination - Paginação
import Pagination from '@/components/layout/Pagination';

<Pagination
  total={total}
  page={page}
  pageSize={pageSize}
  onChange={setPage}
/>

// 5. StatusBadge - Badge de status
import StatusBadge from '@/components/shared/StatusBadge';

<StatusBadge status="ATIVA" />
```

### ❌ NUNCA crie versões customizadas destes componentes sem motivo!

---

## 🔐 Segurança OBRIGATÓRIA

### Multi-Tenancy (contaId)

**SEMPRE valide contaId em TODAS as operações:**

```tsx
// ✅ Frontend
const { user } = useCurrentUser();
const contaId = user?.contaId ?? null;

const { items } = useMatriculas({
  contaId, // ✅ Sempre passar
});

// ✅ Backend (API Routes)
const { searchParams } = new URL(req.url);
const contaId = searchParams.get('contaId');

if (contaId !== session.user.contaId) {
  return NextResponse.json({ error: { message: 'Acesso negado' } }, { status: 403 });
}

// ✅ Backend (Services)
const matriculas = await prisma.matricula.findMany({
  where: {
    contaId, // ✅ SEMPRE filtrar por contaId
    // outros filtros...
  },
});
```

### Roles (Autorização)

**SEMPRE valide role em API Routes:**

```typescript
// ✅ Backend (API Routes)
const session = await getServerSession(authOptions);

const allowedRoles = ['ADMIN', 'RECEPCAO'];
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
}
```

**Roles disponíveis:**

- `ADMIN` - Acesso total
- `FINANCEIRO` - Área financeira
- `RECEPCAO` - Matrículas, alunos, turmas
- `PROFESSOR` - Suas turmas
- `RESPONSAVEL` - Seus dependentes

---

## 📝 Checklist para AI Assistants

Antes de criar qualquer código, execute este checklist:

```
☐ 1. A funcionalidade já existe?
     → Buscar em: apps/web/app/(app)/
     → Buscar em: apps/web/features/cadastro/

☐ 2. Se existe, vou reutilizar ou modificar?
     → Reutilizar: Use a existente
     → Modificar: Edite a Feature, NÃO crie duplicata

☐ 3. Estou criando uma página?
     → Tem < 15 linhas? ✅
     → Apenas importa Feature? ✅
     → Tem lógica de negócio? ❌ Mover para Feature

☐ 4. Estou criando uma Feature?
     → Usa TableLayout? ✅
     → Usa DataTable? ✅
     → Usa useCurrentUser? ✅
     → Valida contaId? ✅
     → Valida role? ✅

☐ 5. Estou criando API Route?
     → Valida autenticação? ✅
     → Valida role? ✅
     → Valida contaId? ✅
     → Retorna erros apropriados? ✅

☐ 6. Estou criando Service backend?
     → Filtra por contaId? ✅
     → Usa Prisma corretamente? ✅
     → Trata erros? ✅

☐ 7. Segui a estrutura de pastas?
     → features/cadastro/[entidade]/ ✅
     → app/(app)/[rota]/ ✅
     → app/api/[entidade]/ ✅
```

---

## 🎯 Templates Obrigatórios

### Template: Nova Página

```tsx
// app/(app)/[rota]/page.tsx
'use client';

import [Nome]Feature from '@/features/cadastro/[entidade]/[Nome]Feature';

export default function [Nome]Page() {
  return <[Nome]Feature />;
}
```

**NUNCA desvie deste template! Páginas são APENAS wrappers!**

---

### Template: Nova Feature

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
import type { [Entidade]ListItem } from './services/[entidade]-service';

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

**SEMPRE use este template como base!**

---

### Template: API Route

```typescript
// app/api/[entidade]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listar[Entidade] } from '@alusa/lib/services/[entidade]';

export async function GET(req: Request) {
  // 1. ✅ Autenticação
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: { message: 'Não autenticado' } }, { status: 401 });
  }

  // 2. ✅ Autorização (role)
  const allowedRoles = ['ADMIN', 'RECEPCAO'];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: { message: 'Sem permissão' } }, { status: 403 });
  }

  // 3. ✅ Validar contaId
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
```

**SEMPRE valide: autenticação, role e contaId!**

---

## 🚫 Lista de "NUNCA FAÇA"

```
❌ 1. NUNCA crie páginas duplicadas
❌ 2. NUNCA coloque lógica em páginas
❌ 3. NUNCA crie pastas por role (/recepcao/, /professor/)
❌ 4. NUNCA esqueça de validar contaId
❌ 5. NUNCA esqueça de validar role
❌ 6. NUNCA ignore componentes reutilizáveis
❌ 7. NUNCA crie componentes de layout customizados sem necessidade
❌ 8. NUNCA copie e cole código entre features (reutilize!)
❌ 9. NUNCA esqueça 'use client' em componentes React
❌ 10. NUNCA ignore TypeScript (use tipos sempre!)
```

---

## ✅ Lista de "SEMPRE FAÇA"

```
✅ 1. SEMPRE verifique se funcionalidade já existe
✅ 2. SEMPRE use templates fornecidos
✅ 3. SEMPRE valide contaId (multi-tenancy)
✅ 4. SEMPRE valide role (autorização)
✅ 5. SEMPRE use componentes reutilizáveis
✅ 6. SEMPRE use TypeScript com tipos completos
✅ 7. SEMPRE use 'use client' em componentes React
✅ 8. SEMPRE siga estrutura de pastas
✅ 9. SEMPRE consulte documentação antes
✅ 10. SEMPRE teste após implementar
```

---

## 📚 Documentação de Referência

**Leia SEMPRE antes de criar código:**

1. **[docs/ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)** - Arquitetura completa
2. **[docs/CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md)** - Erros comuns e correções
3. **[docs/QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Referência rápida

---

## 🎓 Exemplos de Código Correto

**Para aprender, consulte estes arquivos existentes:**

```
✅ features/cadastro/matriculas/MatriculasFeature.tsx
✅ features/cadastro/alunos/AlunosFeature.tsx
✅ features/cadastro/turmas/TurmasFeature.tsx
✅ features/cadastro/planos/PlanosFeature.tsx

✅ app/(app)/matriculas/page.tsx
✅ app/(app)/alunos/page.tsx

✅ app/api/matriculas/route.ts
✅ app/api/alunos/route.ts
```

**NÃO invente padrões novos! Siga os existentes!**

---

## 🔍 Como Validar Seu Código

Antes de considerar o trabalho completo, verifique:

```bash
# 1. Estrutura de arquivos
tree features/cadastro/[sua-entidade]/
# Deve ter: Feature.tsx, hooks/, services/

# 2. Página é simples?
wc -l apps/web/app/(app)/[sua-rota]/page.tsx
# Deve ter: < 15 linhas

# 3. Importações corretas?
grep "import.*from '@/components/layout'" features/cadastro/[sua-entidade]/[Sua]Feature.tsx
# Deve ter: TableLayout, DataTable, EntityFiltersBar, Pagination

# 4. Validação de segurança?
grep "contaId" apps/web/app/api/[sua-entidade]/route.ts
# Deve aparecer: validação de contaId

grep "allowedRoles" apps/web/app/api/[sua-entidade]/route.ts
# Deve aparecer: validação de roles
```

---

## 🆘 Se Algo Der Errado

1. **PARE imediatamente**
2. **Consulte docs/CORREMOS_DE_ARQUITETURA.md**
3. **Compare com exemplos existentes**
4. **Peça revisão humana se necessário**
5. **Documente o erro para evitar repetição**

---

## 📊 Estatísticas de Erros Comuns

**Baseado em correções reais:**

| Erro                       | Frequência | Severidade | Documentação                                               |
| -------------------------- | ---------- | ---------- | ---------------------------------------------------------- |
| Páginas duplicadas         | Alta       | Crítica    | [CORREMOS_DE_ARQUITETURA.md](./CORREMOS_DE_ARQUITETURA.md) |
| Lógica na página           | Média      | Alta       | [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)     |
| Ignorar roles              | Média      | Alta       | [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)     |
| Esquecer contaId           | Alta       | Crítica    | [ARQUITETURA_E_PADROES.md](./ARQUITETURA_E_PADROES.md)     |
| Não reutilizar componentes | Baixa      | Média      | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)                 |

---

**Criado especialmente para:** GitHub Copilot, ChatGPT, Claude, e outros AI assistants  
**Baseado em:** Erro real de 2/10/2025 - Criação duplicada de /recepcao/matriculas  
**Versão:** 1.0.0  
**Última atualização:** 2 de outubro de 2025
