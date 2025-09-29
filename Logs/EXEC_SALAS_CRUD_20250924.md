# Execução Salas CRUD 2025-09-24

## Escopo

Implementação vertical de Salas: Prisma (schema + migration), seeds, Zod schema, serviço, rotas API, página UI, wizard (drawer), criação inline futura (integração a Turmas pending), testes unit e e2e básicos.

## Alterações Principais

- Prisma: modelo Sala ajustado (descricao, capacidade NOT NULL, status enum Status ATIVO/INATIVO).
- Migration: `20250924_salas_crud` criada.
- Seeds: Atualização para criar Sala Principal (30) e Sala Secundária (15).
- Zod: `sala.schema.ts` refeito com validações solicitadas.
- Service: `sala.service.ts` com create/update/list/delete (soft = INATIVO).
- API: rotas `/api/salas` e `/api/salas/[id]`.
- UI: Página `/salas` com tabela, busca, ordenação simples e skeletons.
- Wizard: `SalaWizardDrawer` + steps (dados básicos, status, resumo).
- Testes: `sala.service.test.ts` e e2e inicial `sala.wizard.spec.ts`.
- Log: este arquivo.

## Pendências / Próximos Passos

- Integração inline create no select de Sala dentro do Wizard de Turmas (abrir drawer; recarregar lookups) – Pendente.
- Ações de editar / inativar na UI (diálogo de confirmação) – Pendente.
- Paginação server side real em /salas (atual é client side) – Opcional.
- Ajustar e2e para fluxo de autenticação caso necessário.

## Observações Técnicas

- Migration torna capacidade NOT NULL; valores nulos antigos recebem 0 (adaptação dev). Em produção avaliar correção manual prévia.
- Status antigos 'ATIVA'/'INATIVA' foram normalizados para enum Status.
- Erros TipScript resolvidos após `prisma generate`.

## Eventos

- Emissão de `salas:changed` após criação para recarregar tabela.

-- fim --
