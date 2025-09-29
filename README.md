# Alusa – Estrutura de UI (App Router)

Este documento descreve a estrutura padrão da aplicação web, adotada para garantir consistência visual e fluidez das transições.

## Visão geral
- Next.js App Router (apps/web/app/(app)).
- Sidebar fixo com estados expandido (262px) e recolhido (64px).
- Layout com card central com sombra multilayer e bordas arredondadas.
- Transições suaves sincronizadas (300ms, ease-out custom).
- Tema claro/escuro com persistência SSR/CSR (ThemeProvider).

## Sidebar
- Componente: `apps/web/components/layout/Sidebar.tsx`.
- Tokens:
  - `width = 262`, `widthCollapsed = 64`, `itemH = 52`, `itemW = 192`.
- Estados:
  - Expandido: exibe logo, marker flutuante (leftmark) e labels.
  - Recolhido: apenas ícones centralizados; pílulas quadradas (52x52) com gutter de 6px para não cortar bordas.
- Transições:
  - Largura do aside, hover overlays e marker flutuante.
  - Logo anima junto (opacidade/escala) sem alterar o layout.

## Layout principal
- Componente: `apps/web/app/(app)/layout.tsx`.
- Classe `with-sidebar` aplica padding-left baseado em `--sidebar-w` + `--sidebar-gap`.
- Card principal:
  - Raio: 40px; Padding: 32px; Gap lateral com sidebar: 12px.
  - Sombra: `rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 70, 0.03) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 2px 2px -1px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.03) 0px 5px 5px -2.5px, rgba(42, 51, 70, 0.03) 0px 10px 10px -5px, rgba(42, 51, 70, 0.03) 0px 24px 24px -8px`.

## Dropdowns e sobreposições
- Dropdown do usuário e menus usam mesma sombra do card para consistência.
- Z-indexes:
  - Sidebar: `z-40`.
  - Overlays/menus: `z-overlay` e portais Radix (>= 50) para cobrir inclusive o sidebar.

## Rotas protegidas
- Verificação em `PROTECTED` no `layout.tsx` do app.
- Inclui: `/dashboard`, `/alunos`, `/colaboradores`, `/matriculas`, `/recepcao`, `/financeiro`, `/portal`, `/admin`.

## Módulo Colaboradores
- Rota nova: `/colaboradores`.
- Compatibilidade: `/professores` redireciona para `/colaboradores`.
- Enquanto migramos o domínio, reutilizamos os componentes de professores sem alterar o visual.

## Convenções de estilo
- Tailwind utilitárias + tokens CSS via variáveis.
- Transições: `duration-300` com `cubic-bezier(0.22,1,0.36,1)`.
- Evitar FOUC: data-theme SSR e ThemeProvider sincronizados.

## Como contribuir
- Manter tokens em `Sidebar.tsx` e gaps no `layout.tsx`.
- Reusar a sombra padrão para novos popovers/dialogs.
- Ao criar novas rotas, adicionar ao array `PROTECTED` se aplicável.# Alusa Monorepo (MVP Base)

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
