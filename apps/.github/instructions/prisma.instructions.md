---
applyTo: '**'
---
# Instruções de Banco de Dados — Projeto Alusa

## Regras
- Migrations pequenas e nomeadas:
  ```bash
  pnpm prisma:migrate --name <feature>
Seeds idempotentes (prisma/seed.ts).

Gerar Zod a partir do schema (prisma/zod/*).

Usar include/select para evitar N+1 queries.

Soft delete (deletedAt) em dados críticos.

Restrições
Nunca usar SQL cru no código.

Não alterar migrations aplicadas em produção.

yaml
Copiar código

---