---
applyTo: '**'
---
# ⚙️ Instruções de CI/CD — Projeto Alusa

## Pipeline
1. Lint (`pnpm lint`)
2. Typecheck (`pnpm typecheck`)
3. Unit/Integration (`pnpm test:unit`)
4. Build (`pnpm build`)
5. E2E (`pnpm test:e2e`)

## Regras
- Fail-fast: se lint/typecheck falhar → não roda E2E.
- PR só passa com todos testes verdes.
- Commits: seguir Conventional Commits.
- Nunca expor segredos → usar GitHub Secrets.