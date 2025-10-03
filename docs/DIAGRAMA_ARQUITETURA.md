# 📐 Diagrama de Arquitetura - ALUSA

> Representação visual da arquitetura do projeto para facilitar entendimento.

---

## 🏛️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALUSA - Sistema de Gestão                   │
│                         Multi-Tenant SaaS Platform                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
         ┌─────────────┐     ┌─────────────┐    ┌─────────────┐
         │   Frontend  │     │   Backend   │    │  Database   │
         │  (Next.js)  │────▶│ (API Routes)│───▶│ (PostgreSQL)│
         │   React 18  │     │  Next.js    │    │   Prisma    │
         └─────────────┘     └─────────────┘    └─────────────┘
```

---

## 📁 Estrutura de Camadas

```
┌────────────────────────────────────────────────────────────────────┐
│ CAMADA 1: APRESENTAÇÃO (UI)                                        │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ app/(app)/[rota]/page.tsx                                      │ │
│ │ • Páginas minimalistas (< 15 linhas)                          │ │
│ │ • Apenas wrappers de Features                                 │ │
│ │ • Routing e metadata                                          │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ imports
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ CAMADA 2: FEATURES (Lógica de Negócio)                            │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ features/cadastro/[entidade]/[Entidade]Feature.tsx            │ │
│ │ • Componente principal com toda lógica                        │ │
│ │ • Estado, efeitos, eventos                                    │ │
│ │ • Composição de componentes                                   │ │
│ │                                                                │ │
│ │ hooks/use-[entidade].ts                                       │ │
│ │ • Lógica de estado e dados                                    │ │
│ │ • Integração com services                                     │ │
│ │                                                                │ │
│ │ services/[entidade]-service.ts                                │ │
│ │ • Requisições HTTP                                            │ │
│ │ • Normalização de dados                                       │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ fetch
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ CAMADA 3: API (Backend)                                            │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ app/api/[entidade]/route.ts                                   │ │
│ │ • Autenticação (NextAuth)                                     │ │
│ │ • Autorização (Roles)                                         │ │
│ │ • Validação de contaId (Multi-tenancy)                        │ │
│ │ • Processamento de requests                                   │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ calls
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ CAMADA 4: SERVICES (Backend Logic)                                 │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ packages/lib/src/services/[entidade].ts                       │ │
│ │ • Lógica de negócio backend                                   │ │
│ │ • Queries Prisma                                              │ │
│ │ • Transformação de dados                                      │ │
│ │ • Regras de negócio                                           │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ queries
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ CAMADA 5: DADOS (Database)                                         │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ PostgreSQL Database                                           │ │
│ │ • Schema Prisma                                               │ │
│ │ • Migrations                                                  │ │
│ │ • Seeds                                                       │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados Completo

### Listagem de Dados (GET)

```
1. USUÁRIO
   └─▶ Acessa /matriculas
        │
        ▼
2. PAGE (apps/web/app/(app)/matriculas/page.tsx)
   └─▶ Renderiza <MatriculasFeature />
        │
        ▼
3. FEATURE (features/cadastro/matriculas/MatriculasFeature.tsx)
   └─▶ Chama useMatriculas({ contaId, search, status })
        │
        ▼
4. HOOK (hooks/use-matriculas.ts)
   └─▶ Chama listMatriculasRequest({ contaId, ... })
        │
        ▼
5. SERVICE FRONTEND (services/matriculas-service.ts)
   └─▶ fetch('/api/matriculas?contaId=...&search=...')
        │
        ▼
6. API ROUTE (app/api/matriculas/route.ts)
   ├─▶ Valida sessão (NextAuth)
   ├─▶ Valida role (ADMIN, RECEPCAO, FINANCEIRO)
   ├─▶ Valida contaId (Multi-tenancy)
   └─▶ Chama listarMatriculas({ contaId, ... })
        │
        ▼
7. SERVICE BACKEND (packages/lib/src/services/matricula.ts)
   └─▶ prisma.matricula.findMany({ where: { contaId } })
        │
        ▼
8. DATABASE (PostgreSQL)
   └─▶ SELECT * FROM matriculas WHERE conta_id = ...
        │
        ▼
9. RESPOSTA
   └─▶ Retorna dados na ordem inversa até o usuário
```

### Criação de Dados (POST)

```
1. USUÁRIO
   └─▶ Clica "Nova Matrícula"
        │
        ▼
2. FEATURE
   └─▶ Abre <MatriculaWizardDialog />
   └─▶ Usuário preenche formulário
   └─▶ Submit: createMatriculaRequest(data)
        │
        ▼
3. SERVICE FRONTEND
   └─▶ fetch('/api/matriculas', { method: 'POST', body: data })
        │
        ▼
4. API ROUTE
   ├─▶ Valida sessão
   ├─▶ Valida role (ADMIN, RECEPCAO)
   ├─▶ Valida dados (Zod schema)
   └─▶ Chama criarMatricula(data)
        │
        ▼
5. SERVICE BACKEND
   └─▶ prisma.matricula.create({ data: { ...data, contaId } })
        │
        ▼
6. DATABASE
   └─▶ INSERT INTO matriculas ...
        │
        ▼
7. RESPOSTA
   └─▶ Retorna matrícula criada
   └─▶ Feature chama reload()
   └─▶ Lista atualiza automaticamente
```

---

## 🔐 Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AUTENTICAÇÃO (NextAuth)                                  │
│    • Login via email/senha                                  │
│    • Sessão JWT                                             │
│    • Middleware protege rotas                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AUTORIZAÇÃO (Roles)                                      │
│    • ADMIN: Acesso total                                    │
│    • FINANCEIRO: Área financeira                            │
│    • RECEPCAO: Matrículas, alunos, turmas                   │
│    • PROFESSOR: Suas turmas                                 │
│    • RESPONSAVEL: Seus dependentes                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MULTI-TENANCY (contaId)                                  │
│    • Isolamento de dados por conta                          │
│    • SEMPRE filtrar por contaId                             │
│    • Validação em TODAS as queries                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDAÇÃO (Zod)                                          │
│    • Schemas de validação                                   │
│    • Input sanitization                                     │
│    • Type safety                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes e Reutilização

```
┌──────────────────────────────────────────────────────────────┐
│ LAYOUT COMPONENTS (Sempre reutilizar!)                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ TableLayout                                            │  │
│ │ ├─ Header (title, subtitle, actions)                  │  │
│ │ ├─ FiltersBar                                         │  │
│ │ ├─ Content (children)                                 │  │
│ │ └─ Footer (pagination)                                │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ DataTable                                              │  │
│ │ ├─ Columns (header, render)                           │  │
│ │ ├─ Rows (data mapping)                                │  │
│ │ ├─ Loading (skeleton)                                 │  │
│ │ └─ Empty state                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ EntityFiltersBar                                       │  │
│ │ ├─ Search input                                       │  │
│ │ ├─ Status select                                      │  │
│ │ └─ Sort order toggle                                  │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ SHARED COMPONENTS                                            │
├──────────────────────────────────────────────────────────────┤
│ • StatusBadge - Badges visuais de status                    │
│ • Pagination - Componente de paginação                      │
│ • ConfirmDeleteDialog - Dialog de confirmação               │
│ • EditEntityDialog - Dialog de edição genérico              │
│ • ImageCropDialog - Crop de imagens                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Organização de Features

```
features/cadastro/[entidade]/
│
├── [Entidade]Feature.tsx          ← Componente principal
│   ├─ Imports de UI
│   ├─ Imports de Layout
│   ├─ useCurrentUser() para contaId
│   ├─ Estados locais (search, filters)
│   ├─ Custom hook (use[Entidade])
│   ├─ Definição de colunas (useMemo)
│   ├─ Handlers de eventos
│   └─ Render com TableLayout
│
├── hooks/
│   └── use-[entidade].ts          ← Hook de dados
│       ├─ Estado (items, loading, error)
│       ├─ Função load() com fetch
│       ├─ useEffect para auto-load
│       ├─ Funções auxiliares (reload, setPage)
│       └─ Return de estado + funções
│
├── services/
│   └── [entidade]-service.ts      ← Service de API
│       ├─ Types (interfaces)
│       ├─ Funções de request
│       │   ├─ list[Entidade]Request
│       │   ├─ create[Entidade]Request
│       │   ├─ update[Entidade]Request
│       │   └─ delete[Entidade]Request
│       └─ Funções de normalização
│
└── components/                     ← Componentes internos (opcional)
    └── [Component].tsx
```

---

## 🎯 Padrão de Nomenclatura

```
┌─────────────────────────────────────────────────────────────┐
│ TIPO                    PADRÃO              EXEMPLO          │
├─────────────────────────────────────────────────────────────┤
│ Components              PascalCase          MatriculasFeature│
│ Files (components)      PascalCase.tsx      AlunosFeature.tsx│
│ Files (hooks/services)  kebab-case.ts       use-alunos.ts    │
│ Hooks                   useCamelCase        useMatriculas    │
│ Functions               camelCase           listarAlunos     │
│ Variables               camelCase           contaId          │
│ Constants               UPPER_SNAKE_CASE    MAX_PAGE_SIZE    │
│ Types/Interfaces        PascalCase          MatriculaListItem│
│ Enums                   PascalCase          StatusMatricula  │
│ Folders                 kebab-case          cadastro/alunos/ │
│ Routes                  kebab-case          /alunos/         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Fluxo de Criação de Feature

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Verificar se já existe                              │
│ ├─ ls apps/web/app/(app)/                                   │
│ ├─ ls apps/web/features/cadastro/                           │
│ └─ Se existe: REUTILIZAR, não duplicar!                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Criar estrutura de pastas                           │
│ ├─ features/cadastro/[entidade]/                            │
│ ├─ features/cadastro/[entidade]/hooks/                      │
│ ├─ features/cadastro/[entidade]/services/                   │
│ ├─ app/(app)/[rota]/                                        │
│ └─ app/api/[entidade]/                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Usar templates                                      │
│ ├─ Copiar template de página (< 15 linhas)                  │
│ ├─ Copiar template de feature                               │
│ ├─ Copiar template de hook                                  │
│ ├─ Copiar template de service                               │
│ └─ Copiar template de API route                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Implementar lógica                                  │
│ ├─ Definir tipos/interfaces                                 │
│ ├─ Implementar colunas da tabela                            │
│ ├─ Implementar filtros                                      │
│ ├─ Adicionar ações (create, edit, delete)                   │
│ └─ Implementar validações                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Adicionar segurança                                 │
│ ├─ Validar contaId (multi-tenancy)                          │
│ ├─ Validar roles (autorização)                              │
│ ├─ Validar inputs (Zod)                                     │
│ └─ Tratar erros                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Testar                                               │
│ ├─ Listagem funciona?                                       │
│ ├─ Filtros funcionam?                                       │
│ ├─ Paginação funciona?                                      │
│ ├─ CRUD funciona?                                           │
│ ├─ Validações funcionam?                                    │
│ └─ Roles funcionam?                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Matriz de Responsabilidades

```
┌────────────────┬─────────────────────────────────────────────┐
│ CAMADA         │ RESPONSABILIDADE                            │
├────────────────┼─────────────────────────────────────────────┤
│ Page           │ • Routing                                   │
│                │ • Metadata (SEO)                            │
│                │ • Wrapper de Feature                        │
│                │ • < 15 linhas                               │
├────────────────┼─────────────────────────────────────────────┤
│ Feature        │ • Lógica de UI                              │
│                │ • Estado local                              │
│                │ • Composição de componentes                 │
│                │ • Handlers de eventos                       │
│                │ • Controle de acesso (role)                 │
├────────────────┼─────────────────────────────────────────────┤
│ Hook           │ • Estado de dados                           │
│                │ • Side effects                              │
│                │ • Integração com services                   │
│                │ • Loading/error states                      │
├────────────────┼─────────────────────────────────────────────┤
│ Service (FE)   │ • Requisições HTTP                          │
│                │ • Normalização de dados                     │
│                │ • Type safety                               │
│                │ • Error handling                            │
├────────────────┼─────────────────────────────────────────────┤
│ API Route      │ • Autenticação                              │
│                │ • Autorização (roles)                       │
│                │ • Validação de contaId                      │
│                │ • Orquestração de services                  │
├────────────────┼─────────────────────────────────────────────┤
│ Service (BE)   │ • Lógica de negócio                         │
│                │ • Queries Prisma                            │
│                │ • Transformação de dados                    │
│                │ • Regras de negócio complexas               │
├────────────────┼─────────────────────────────────────────────┤
│ Database       │ • Persistência                              │
│                │ • Integridade referencial                   │
│                │ • Constraints                               │
│                │ • Indexes                                   │
└────────────────┴─────────────────────────────────────────────┘
```

---

**Última atualização:** 2 de outubro de 2025  
**Versão:** 1.0.0
