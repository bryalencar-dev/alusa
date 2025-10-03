<div align="center">

# Alusa Monorepo

Plataforma multi-módulo (Next.js + Prisma) – documentação consolidada.

</div>

## Sumário

- [📚 Documentação Técnica](#-documentação-técnica) ⭐ **NOVO**
- [Stack & Estrutura](#stack--estrutura)
- [Design System & Layout](#design-system--layout)
- [Scripts Principais](#scripts-principais)
- [Setup Rápido](#setup-rápido)
- [Estratégia de Cache (.next)](#estratégia-de-cache-next)
- [Política de Exclusão (Hard Delete)](#política-de-exclusão-hard-delete)
- [Status vs Exclusão](#status-vs-exclusão)
- [Proteção de Rotas](#proteção-de-rotas)
- [Boas Práticas de Contribuição](#boas-práticas-de-contribuição)
- [Debug & Troubleshooting](#debug--troubleshooting)

---

## 📚 Documentação Técnica

**Documentação completa de arquitetura, padrões e boas práticas está disponível em [`docs/`](./docs/).**

### 📖 Documentos Principais

| Documento                                                                | Descrição                                                                 | Quando Usar                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------- |
| **[docs/README.md](./docs/README.md)**                                   | Índice completo da documentação                                           | Começar aqui                              |
| **[docs/ARQUITETURA_E_PADROES.md](./docs/ARQUITETURA_E_PADROES.md)**     | Arquitetura feature-based, estrutura de pastas, componentes reutilizáveis | Antes de criar novas funcionalidades      |
| **[docs/CORREMOS_DE_ARQUITETURA.md](./docs/CORREMOS_DE_ARQUITETURA.md)** | Erros comuns e como corrigi-los                                           | Troubleshooting ou antes de criar páginas |
| **[docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)**                 | Templates e referência rápida                                             | Durante desenvolvimento                   |
| **[docs/COPILOT_INSTRUCTIONS.md](./docs/COPILOT_INSTRUCTIONS.md)**       | Instruções para AI assistants                                             | Configurar AI/Copilot                     |

### 🚀 Quick Start para Desenvolvedores

1. **Novo no projeto?** Leia [docs/ARQUITETURA_E_PADROES.md](./docs/ARQUITETURA_E_PADROES.md)
2. **Criar nova funcionalidade?** Use templates de [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)
3. **Algo deu errado?** Consulte [docs/CORREMOS_DE_ARQUITETURA.md](./docs/CORREMOS_DE_ARQUITETURA.md)

### ⚠️ Regras de Ouro

- ✅ **Páginas são apenas wrappers** (< 15 linhas em `app/(app)/`)
- ✅ **Lógica vai em Features** (`features/cadastro/[entidade]/`)
- ✅ **Use componentes reutilizáveis** (TableLayout, DataTable, etc.)
- ✅ **NUNCA crie páginas duplicadas** (ex: `/recepcao/matriculas` quando já existe `/matriculas`)
- ✅ **Use sistema de roles** ao invés de criar pastas por perfil

---

## Stack & Estrutura

Monorepo Turborepo com:

- Next.js 14 App Router (`apps/web`)
- TypeScript 5
- Tailwind CSS + tokens utilitários
- Prisma + PostgreSQL
- Vitest / Playwright
- Pacotes internos: `@alusa/ui`, `@alusa/lib`, `@alusa/config`

```
apps/web        -> Front-end & rotas API
packages/ui     -> Componentes compartilhados
packages/lib    -> Domain services (Prisma + schemas Zod)
packages/config -> ESLint e configs compartilhadas
prisma          -> schema.prisma, migrations, seeds
Logs/           -> relatórios de execuções e checkpoints
```

## Design System & Layout

Sidebar fixa (262px / 64px colapsado). Layout principal em `apps/web/app/(app)/layout.tsx` com card central (radius 40px, padding 32px) e sombra multilayer padronizada.

Características:

- Transições: `duration-300` + `cubic-bezier(0.22,1,0.36,1)`
- Tema claro/escuro SSR + hidratação
- Z-index: Sidebar (40) / Overlays (>=50)

### Layout de Configurações

`apps/web/app/(app)/admin/configuracoes/layout.tsx` é Server Component. Se precisar fallback mínimo:

```tsx
export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

## Scripts Principais

Root / monorepo:

```
pnpm install          # dependências
pnpm dev              # build ui/lib + inicia web
pnpm dev:clean        # remove .next do @alusa/web e inicia dev
pnpm build            # build de todos os workspaces
pnpm build:clean      # build limpo para @alusa/web
pnpm lint             # eslint multi-pacote
pnpm typecheck        # tsc em todos
pnpm test             # testes (Vitest)
```

App web (`apps/web`):

```
pnpm dev              # next dev
pnpm dev:clean        # rimraf .next && next dev
pnpm build:clean      # rimraf .next && next build
pnpm test:unit        # vitest
pnpm test:e2e         # playwright
```

## Setup Rápido

1. Criar `.env` a partir de `.env.example` e ajustar `DATABASE_URL`.
2. Subir Postgres local.
3. Executar:

```bash
pnpm install
pnpm prisma:generate
pnpm db:migrate   # ou prisma migrate dev --schema=prisma/schema.prisma
pnpm dev:clean
```

## Estratégia de Cache (.next)

Sempre que trocar de branch, rollback ou aplicar migrations grandes:

```bash
pnpm dev:clean
```

Hard reload no navegador (`Ctrl+Shift+R`) se aparecer `ChunkLoadError`.

## Política de Exclusão (Hard Delete)

As entidades abaixo agora são removidas permanentemente:

- Salas
- Modalidades

Motivação: simplificação operacional e evitar acúmulo de registros inativos não utilizados.

Implementação:

- Services (`sala.service.ts`, `modalidade.service.ts`) usam `prisma.delete`.
- Dialog de confirmação deixa explícito “ação permanente”.

Auditoria futura (opcional): criar tabelas `SalaAudit` / `ModalidadeAudit` e registrar o snapshot antes do delete.

## Status vs Exclusão

- Campos `status` ainda existem para fluxo de ativação/inativação em outras entidades (ex: planos, usuários etc.).
- Para Salas e Modalidades, o status só é alterável via edição (não pela lixeira). A lixeira = delete definitivo.

## Proteção de Rotas

Array `PROTECTED` no layout principal cobre: `/dashboard`, `/alunos`, `/colaboradores`, `/matriculas`, `/recepcao`, `/financeiro`, `/portal`, `/admin`.

## Boas Práticas de Contribuição

- Reutilizar sombra padrão e tokens de spacing.
- Evitar `null` quando schema espera `undefined` (normalizar antes de Zod).
- Ao adicionar rota com layout próprio, manter minimal server component sem `"use client"` a menos que necessário.
- Commits: preferir mensagens no formato `escopo: resumo` (ex: `salas: hard delete implementado`).

## Debug & Troubleshooting

| Problema                               | Ação                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| ChunkLoadError em /admin/configuracoes | `pnpm dev:clean` + hard reload                                                    |
| 422 ao criar sala/modalidade           | Verificar descrição null -> normalizar para undefined                             |
| Duplicidade de nome                    | Verificar índice único por conta (mensagem de erro já traduzida)                  |
| Exclusão não remove da UI              | Conferir se evento custom (`salas:changed` / `modalidades:changed`) foi disparado |

---

Última atualização deste README: 2025-09-29.

Monorepo Turborepo com Next.js 15 (App Router), React 19, Tailwind 4, shadcn/ui, Prisma, Vitest e Playwright.

## Estrutura

```
apps/web        -> Front-end & API (Next.js)
packages/ui     -> Biblioteca de componentes compartilhados
packages/lib    -> Hooks e utilidades
packages/config -> Configurações compartilhadas (ESLint, etc.)
prisma          -> Schema, migrations e seed
```

## Scripts

- `pnpm install` instala dependências.
- `pnpm lint` lint multi-pacote.
- `pnpm typecheck` checagem TypeScript.
- `pnpm build` build de todos.
- `pnpm test` roda testes (Vitest/E2E conforme filtros).

## Setup Rápido

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`.
2. Inicie Postgres local (db: alusa).
3. Rode:

```
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
pnpm build
pnpm dev # (adicionaremos script dev em apps/web)
```

## Notas

- Tailwind 4 (preview) configurado via `@tailwind`.
- Prisma schema inicial vazio (somente `User` placeholder mínimo para autenticação futura).
- Ajuste Node 22+.

## Limpeza de cache (.next) após trocar de branch / rollback

Para evitar erros de ChunkLoadError devido a chunks órfãos de builds antigos:

1. Sempre que trocar de branch, aplicar rollback ou reset de migrations, rode:

```bash
pnpm --filter @alusa/web dev:clean
```

Isto remove a pasta `.next/` antes de iniciar o servidor de desenvolvimento.

2. Para builds limpos em CI ou antes de testar um pacote de release:

```bash
pnpm --filter @alusa/web build:clean
```

3. Se o navegador exibir erro `ChunkLoadError` ou mencionar falha ao carregar `.../admin/configuracoes/layout`:
   - Faça um hard reload: `Ctrl+Shift+R` (ou limpar cache manualmente) e tente novamente.
   - Confirme que o arquivo `apps/web/app/(app)/admin/configuracoes/layout.tsx` existe e exporta um `default function`.

### Sobre o layout de Configurações

O layout atual em `apps/web/app/(app)/admin/configuracoes/layout.tsx` é um Server Component (não possui `"use client"`) e pode importar componentes client como `SettingsCardNav`. Caso haja necessidade de fallback mínimo, o conteúdo mínimo válido seria:

```tsx
export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Mantivemos o layout completo existente para preservar UX.
