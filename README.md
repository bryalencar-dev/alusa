# Alusa

Plataforma SaaS (monorepo) com Next.js (App Router), Prisma/PostgreSQL, autenticação via NextAuth, CRUD de clientes e integração opcional com Asaas.

## Requisitos
- Node.js 20+ (recomendado LTS)
- pnpm >= 9
- PostgreSQL 14+

## Setup Rápido
```bash
git clone <repo>
cd alusa
pnpm install
cp .env.example .env # preencha variáveis
pnpm db:migrate
pnpm db:seed # opcional / idempotente
pnpm dev:web
```
App disponível em: http://localhost:3000

## Estrutura
```
apps/
  web/              # Frontend + rotas API Next.js
packages/
  ui/               # Componentes compartilhados (shadcn adaptado)
  lib/              # Lógica compartilhada (ex: cliente Asaas, logger)
  config/           # Configs ESLint/TS compartilhadas
prisma/
  schema.prisma     # Schema principal
  migrations/       # Histórico de migrações
logs/               # Registro de etapas (steps.jsonl, summary.md)
.github/workflows/  # Pipelines CI
```

## Comandos Úteis
| Comando | Descrição |
|---------|-----------|
| `pnpm dev:web` | Inicia Next.js em dev |
| `pnpm db:migrate` | Executa migrations (dev) |
| `pnpm db:seed` | Roda seed idempotente |
| `pnpm test` | Testes unitários (Vitest) |
| `pnpm test:e2e` | Testes E2E (Playwright) |
| `pnpm build` | Build dos pacotes/app |
| `pnpm typecheck` | TypeScript noEmit em todos os pacotes |

## CI/CD
- GitHub Actions executa: lint, typecheck, unit tests, e2e, build.
- Deploy automático na Vercel:
  - PR => preview deploy
  - merge em `main` => produção
- Postgres gerenciado (Railway/Neon) configurado via `DATABASE_URL` em Secrets.

## Variáveis de Ambiente (.env)
Veja `.env.example` e configure:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=
ASAAS_WEBHOOK_SECRET=
FEATURE_ASAAS=false
```

## Feature Flags
- `FEATURE_ASAAS`: controla exibição e uso da integração Asaas.

## Logs Estruturados
Logger simples em `@alusa/lib` (`logInfo`, `logError`) imprime JSON: `{ scope:"Alusa", level, message }`.

## Boas Práticas / Próximos Passos
- Adicionar testes para adapter Asaas.
- Implementar reset transacional para E2E.
- Observabilidade: integrar Sentry/Logtail.
- Segurança: revisar headers e endurecer auth (rate limit, 2FA futuro).

---
MIT License. Contribuições bem-vindas.
