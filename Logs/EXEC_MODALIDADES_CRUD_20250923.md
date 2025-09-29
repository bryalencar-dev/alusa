## Execução 2025-09-23 - Vertical Modalidades

Escopo: Implementação completa (DB + migration + seed + schema Zod + service + rotas API + página + wizard + testes unitários e E2E + sidebar + logging).

Itens entregues:

- Prisma: adicionada coluna descricao ao model Modalidade e migration `20250923123000_modalidades_crud`.
- Seeds: Ballet e Jazz com descrições.
- Zod: `modalidade.schema.ts` com campos nome, descricao?, status.
- Service: create/update/list/delete com validação duplicidade e suporte descricao.
- API: rotas GET/POST `/api/modalidades` e PATCH/DELETE `/api/modalidades/[id]` atualizadas para descricao.
- UI: Página `/modalidades` com DataTable (TanStack) + busca + skeleton + wizard.
- Wizard: 3 steps (Dados Básicos, Status, Resumo) com RHF + Zod.
- Sidebar: item "Modalidades" em Cadastro.
- Testes: unit `modalidade.service.test.ts` (criar, duplicado, atualizar, soft delete) e E2E `modalidade.wizard.spec.ts`.
- Acessibilidade: labels e aria-invalid/aria-describedby em erros.

Eventos: disparo `modalidades:changed` após criação.

Pendências futuras (opcional): Paginação real server-side (hoje apenas pageSize default), edição inline, toggle de status na tabela.

-- end --
