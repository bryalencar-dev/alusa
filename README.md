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


---

### 🤖 Conduta da IA — Autenticação/Sessão (Projeto Alusa)

Stack: Next.js (App Router) + NextAuth (credenciais) + Prisma + PostgreSQL + Playwright + Vitest.

---

#### 🔒 Regras Fixas
1. **Service First** → toda autenticação via `verifyCredentials(email, password)` usando `prisma.user` + `bcrypt`.  
2. **Contrato de Sessão imutável** → callbacks do NextAuth DEVEM sempre mapear:
   - jwt(): `token.id`, `token.email`, `token.name`, `token.role ??= "USER"`.  
   - session(): `session.user = { id, email, name, role }`.  
3. **Seed idempotente obrigatório** → sempre criar/upsertar:
   - aluno@example.com / senha123 (ADMIN)  
   - professor@example.com / senha123 (PROFESSOR)  
   - responsavel@example.com / senha123 (RESPONSAVEL)  
   Usar **modelo User** do Prisma.  
4. **Unit/Integration SEM HTTP** → nunca rodar `fetch localhost:3000`.  
   - Testar apenas funções puras (`auth-service`, callbacks).  
   - Se houver teste HTTP, renomear para `.skip.ts`.  
5. **E2E resiliente** →  
   - Sempre usar `expect.poll` em `/api/auth/session`.  
   - Só navegar para `/portal` quando `session.user` existir.  
   - Seletores com `data-testid`.  
6. **Rotas de teste** → só habilitadas com `TEST_ROUTES_ENABLED=true`. Nunca ativas em produção.  
7. **CI fail-fast** → pipeline executa em ordem:
   - `lint` → `typecheck`  
   - unit (auth-service + contrato callbacks)  
   - build  
   - E2E (Playwright)  

---

#### 🚨 Quando detectar problema
- `session.user.email` ou `session.user.role` vem `undefined`.  
- E2E trava no `/portal` ou entra em loop `/login ↔ /portal`.  
- Seeds não criam professor/responsável.  
- Algum unit test sobe servidor HTTP.  

---

#### 🛠️ Correção rápida (passo a passo)
1. Rodar `pnpm -w prisma migrate deploy && pnpm -w tsx prisma/seed.ts`.  
2. Conferir `verifyCredentials()` retorna `{ id,email,name,role }`.  
3. Ajustar callbacks `jwt/session` para sempre preencher `email/name/role`.  
4. Rodar `auth-callbacks.contract.test.ts` → deve passar.  
5. Garantir middleware libera `/login` e `/api/auth/*`.  
6. Se erro “Test routes disabled” → habilitar flag `TEST_ROUTES_ENABLED=true` no `webServer.env`.  
7. Se erro de cache (`EPERM`) → apagar `.next/cache` e reexecutar.  

---

#### ✅ Saídas esperadas
- `verifyCredentials()` autentica aluno, professor e responsável.  
- `session.user` sempre contém `{ id, email, name, role }`.  
- `auth-callbacks.contract.test.ts` verde.  
- E2E “Roles Access Control” 3/3 verde.  

---

⚠️ Nunca aceitar PR que:  
- Tenha `session.user` parcial.  
- Dependa de testes HTTP em unit.  
- Não rode seeds antes de validar.  
