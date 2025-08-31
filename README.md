# Alusa Monorepo (MVP Base)

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
