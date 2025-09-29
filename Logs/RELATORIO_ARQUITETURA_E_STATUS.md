# Relatório de Arquitetura, Componentes e Estado do Monorepo Alusa

_Gerado em: 2025-09-23_

## Sumário

1. Visão Geral do Monorepo
2. Estrutura de Pastas (Árvore Resumida)
3. Packages e Apps
4. Stack Tecnológica
5. Convenções e Boas Práticas Observadas
6. Backlog de Boas Práticas Recomendadas
7. Componentes (Web) – Classificação de Uso
8. Hooks / Utils / Serviços
9. Domínio Prisma & Migrations
10. Validações (Zod) & Schemas
11. Testes (Cobertura Estrutural)
12. Possíveis Arquivos/Componentes Órfãos (Revisar)
13. Riscos / Débitos Técnicos
14. Próximos Passos Sugeridos

---

## 1. Visão Geral do Monorepo

Monorepo PNPM/Turborepo com três camadas principais:

- `apps/web` (Next.js 14 / App Router) – Front-end + rotas API edge/server.
- `packages/lib` – Lógica de domínio (serviços, schemas, utilidades).
- `packages/ui` – Componentes base/primitive reutilizáveis.
- `prisma` – Schema e migrations (multi-tenant hints, evolução incremental de modelos Aluno, Colaborador, Professor, Matrícula, Invite, Conta etc.).

Foco atual: Fluxos de cadastro e gestão (Alunos, Colaboradores, Professores, Convites) + Autenticação (NextAuth) + Estrutura de convites multi-conta.

## 2. Estrutura de Pastas (Árvore Resumida)

(Obs: Árvore completa muito extensa; abaixo recorte hierárquico relevante)

```
/ (root)
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  eslint.config.js
  prisma/
    schema.prisma
    migrations/
    seed.ts
  apps/
    web/
      app/(app)/colaboradores/page.tsx
      app/(app)/dashboard/*
      app/(auth)/login/*
      app/api/* (auth, colaboradores, health)
      components/
        alunos/
        colaboradores/
        professores/
        invite/
        layout/
        notifications/
        settings/
        shared/
        theme/
        ui/ (wrapper shadcn/radix + custom)
      hooks/
      lib/
        auth/
        validators/
        services/utilities
      scripts/
      types/
  packages/
    ui/src/primitive (Button, Select...)
    lib/src/(alunos|invite|server/services|schemas|validators|hooks)
    config/
    eslint-preset/
```

## 3. Packages e Apps

### Apps

- `@alusa/web`: Next.js 14 (App Router), autenticação, páginas de gestão, integra `@alusa/lib` e `@alusa/ui`.

### Packages

- `@alusa/lib`: Serviços de domínio (aluno, colaborador, professor, convite, matrícula), schemas zod, validators, repositórios e adapters simples.
- `@alusa/ui`: Primitive components (Button, Select etc.) – base para design system.
- `config` / `eslint-preset`: Configurações compartilhadas (lint).

## 4. Stack Tecnológica

- Linguagem: TypeScript (ES2022, strict mode).
- Framework Web: Next.js 14 (App Router + Rotas API).
- UI: Radix UI, Tailwind CSS, shadcn-like wrappers (`components/ui/*`).
- State/Form: React Hook Form (uso em wizards / dialogs), Zod (validação tipada), react-hot-toast / sonner (feedback usuário).
- Auth: NextAuth (session, callbacks custom possivelmente – ver testes `auth-service.test.ts`).
- DB: Prisma ORM + Postgres (assumido) + Migrations.
- Testes: Vitest (unit), Playwright (E2E scaffolding), Testing Library (React), alguns contratos.
- Monorepo Tools: PNPM workspaces + Turbo build cache.
- Qualidade: ESLint flat config, Prettier, TS strict, noUnused\*, noImplicitOverride.

## 5. Convenções e Boas Práticas Observadas

- Alias centralizados em `tsconfig.base.json` (`@/*`, `@alusa/lib`, `@alusa/ui`).
- Separação clara: camada de domínio em `packages/lib`; UI primitive em `packages/ui`; composição e pages em `apps/web`.
- Uso de Zod para schemas -> validação consistente e tipagem derivada.
- Componentização de padrões repetidos (Dialogs de Wizard por entidade, Badges, etc.).
- Reutilização de estilos com `class-variance-authority` (aparece em dependências) e `variants.ts(x)`.
- Testes unitários presentes em pontos críticos (serviços, hooks, env, math util, etc.).
- Estrutura de wizard segmentada em `steps/` com responsabilidades claras (Ex: `IdentificacaoFields`, `EnderecoFields`).
- Paginação client-side declarativa e acessível (aria-labels nos botões de paginação).
- ESLint configurado com regras de hooks e supressão de fricção em protótipos (`no-unused-vars` warn com prefixo `_`).
- Uso de `use client` bem localizado em páginas interativas (ex: `colaboradores/page.tsx`).
- Filtro/ordenação com estado controlado e reset de página reativo.

## 6. Backlog de Boas Práticas Recomendadas

| Item                                                | Descrição                                                              | Prioridade |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| Storybook / Visual Regression                       | Montar catálogos de componentes `@alusa/ui` + wrappers `components/ui` | Média      |
| Barrel files consistentes                           | Garantir `index.ts` para cada subdomínio (ex: services)                | Média      |
| Test coverage report consolidado                    | Unificar cobertura (Vitest + Playwright) em output único               | Alta       |
| Lint custom para imports proibidos                  | Evitar que páginas acessem internals de `lib` não exportados           | Média      |
| Docs de design tokens                               | Formalizar cores, spacing, tipografia                                  | Média      |
| CI pipeline (build + lint + test + prisma validate) | Automatizar gates no PR                                                | Alta       |
| Script orphan detection                             | CLI para detectar arquivos não importados (baseado em graph)           | Média      |
| Logging estruturado (server)                        | Introduzir pino/winston para rotas API e serviços                      | Alta       |
| Observabilidade mínima                              | Health check (já existe) + métricas básicas                            | Média      |
| Acessibilidade contínua                             | Testes axe nos componentes críticos                                    | Média      |
| Hardening multi-tenant                              | Policies e scoping centralizado para todas queries Prisma              | Alta       |

## 7. Componentes (Web) – Classificação de Uso

Legenda: [WIZARD], [DIALOG], [LIST], [UI], [LAYOUT], [DOMAIN], [AUX]. (Inferido por nome / pasta.)

### Alunos (`components/alunos`)

- AlunoWizardDialog.tsx [WIZARD/DIALOG]
- AlunoEditDialog.tsx [DIALOG]
- AlunoDeleteDialog.tsx [DIALOG]
- wizard/steps/\* (IdentificacaoFields, EnderecoFields, ResponsavelFields, SaudeFields, PerfilFields, FotoFields, ConfirmacaoSection) [WIZARD STEPS]
- wizard/hooks.ts, ui.tsx, utils.ts [WIZARD CORE]

### Colaboradores (`components/colaboradores`)

- ColaboradorWizardDialog.tsx [WIZARD/DIALOG]
- ColaboradorEditDialog.tsx [DIALOG]
- ColaboradorDeleteDialog.tsx [DIALOG]
- ColaboradoresList.tsx [LIST]
- wizard/ (AcessoFields, IdentificacaoFields, EnderecoFields, FotoFields, VinculoFields, ConfirmacaoSection, index.ts, ui.tsx, utils.ts, validators.ts) [WIZARD CORE]

### Professores (`components/professores`)

- ProfessorWizardDialog.tsx [WIZARD/DIALOG]
- ProfessorEditDialog.tsx [DIALOG]
- ProfessorDeleteDialog.tsx [DIALOG]
- ProfessoresList.tsx [LIST]

### Invite / Settings / Notifications / Usuarios

- InviteLinkModal.tsx; InviteModal.tsx; InviteList.tsx; UsersInvitePanel.tsx; UserTable.tsx [DIALOG/LIST]
- NotificationsPanel.tsx [AUX]
- UsuarioEditDialog.tsx, UsuarioDeleteDialog.tsx [DIALOG]

### Layout / Shared / Theme / UI

- Sidebar.tsx, HeaderGate.tsx, UserMenu.tsx, ThemeToggle.tsx, CardHeader.tsx, StatCard.tsx [LAYOUT]
- shared/ImageCropDialog.tsx [DIALOG/UTILITY]
- shared/variants.tsx [STYLE VARIANTS]
- theme/ThemeProvider.tsx [THEME]
- ui/\* (avatar, badge, button, card, datatable, dialog, dropdown-menu, input, progress, select, skeleton, toast) [UI ADAPTERS]

## 8. Hooks / Utils / Serviços

### Web `hooks/`

- `use-current-user.ts` (hook para sessão/usuário logado)

### Web `lib/`

- `auth/` (session.ts) integra NextAuth.
- `auth-service.ts`, `first-user-service.ts`, `rate-limit.ts` (infra/auth cross-cutting).
- `cep.ts`, `cn.ts`, `safe-redirect.ts`, `utils.ts` (helpers).
- `validators/professor.ts` (Zod validators específicos UI layer).
- `variants.ts(x)` – possivelmente tokens / class variance.
- `debug-logger.ts` – logger simples (avaliar evolução p/ structured logging).

### Lib (`packages/lib/src`)

- Domínio Aluno (`alunos/`): schema, service, util map-flatten.
- Invite (`invite/`): builder de URL.
- Server layer (`server/services/*`, `server/repositories/*`): serviços de professor, colaborador, invite, etc.
- Validators / Schemas: `schemas/colaborador.ts`, `schemas/professor.ts`, `validators/professor.ts`.
- Hook `useIsClient` (compat UI/SSR detection). Pode ser deslocado para `@alusa/ui` se genérico.
- `math.ts` + testes utilitários (exemplo de base para libs futuras).

## 9. Domínio Prisma & Migrations

- Evolução incremental rica: várias migrations diárias numeradas – indica prototipagem ativa.
- Tópicos: adição de foto aluno/usuario, indices multi-tenant, modelos professor, matrícula, convite, ownership de conta, ajustes de unicidade CPF/responsável.
- Recomendações:
  - Consolidar migrations instáveis antigas antes de release (squash) – somente se aceitável perder histórico dev.
  - Automatizar `prisma migrate diff` em CI para detectar drift.
  - Adicionar testes de repositório cobrindo constraints principais (unique, foreign keys) mockando cenários de violação.

## 10. Validações (Zod) & Schemas

- Schemas espalhados: `packages/lib/src/schemas`, `apps/web/lib/validators`, `prisma/zod/aluno.ts` (gerado/espelhado?).
- Risco de divergência entre schema Prisma e Zod manual.
- Sugestão: Centralizar geração automática com `prisma-zod-generator` (se não já em uso) e exportar versão canonical, mantendo refinamentos UI à parte.

## 11. Testes (Cobertura Estrutural)

Arquivos de teste identificados:

- `apps/web/src/__tests__/*` (auth callbacks, env, safe-redirect, auth-service)
- `packages/lib/src/*/*.test.ts` (math, map-flatten, aluno.service, invite url builder, hooks, colaborador-service, invite-service)
- UI: Apenas `Button.test.tsx` no momento.
- E2E: infraestrutura Playwright configurada (`playwright.config.ts`) – não foram listados specs E2E adicionais (verificar `apps/web/e2e/`).

Gap Principal: ausência de testes para componentes de página/table complexos (`colaboradores/page.tsx`) e steps de wizard (testes de fluxo e validação). Cobertura visual não mencionada.

## 12. Possíveis Arquivos/Componentes Órfãos (Revisar)

(Não foi feito data-flow estático completo; heurística baseada em nomes/padrões comuns.)

- `apps/web/components/colaboradores/ColaboradoresList.tsx` (página usa lógica inline, talvez substituído) – verificar import em pages.
- `apps/web/components/professores/ProfessoresList.tsx` (similar acima).
- `apps/web/components/shared/variants.tsx` vs `apps/web/lib/variants.ts` (duplicação potencial).
- `apps/web/lib/debug-logger.ts` (se não referenciado em runtime, considerar remover ou promover a logger estruturado).
- `packages/lib/src/services/matricula.ts` (não há testes ou imports verificados – checar uso real).
- `packages/lib/src/validators/professor.ts` e `apps/web/lib/validators/professor.ts` (sobreposição de responsabilidade?).
- `apps/web/test-*.js` (scripts de experimentação usando JS puro, migrar ou remover).
- `apps/web/components/invite/InviteLinkModal.tsx` (verificar se Settings/Users já substituíram funcionalidade).

Ação recomendada: rodar grafo de dependências (ex: `ts-prune`, `knip`) para confirmação.

## 13. Riscos / Débitos Técnicos

| Categoria                         | Risco                            | Impacto               | Mitigação                                |
| --------------------------------- | -------------------------------- | --------------------- | ---------------------------------------- |
| Divergência Schemas               | Zod vs Prisma duplicados         | Bugs validação        | Gerador central + lint schema drift      |
| Ausência Logger Estruturado       | Dificuldade diagnóstico produção | Alto em escalonamento | Introduzir pino (context tenant, userId) |
| Test Coverage Baixa UI Complexa   | Regressões silenciosas           | Médio                 | Adicionar testes de interação + axe      |
| Migrations numerosas em protótipo | Fricção onboarding               | Baixo/Médio           | Squash pré 1.0 / Documentar timeline     |
| Steps Wizard sem contrato formal  | Quebra silenciosa se renomeado   | Médio                 | Barrels + types centrais para step IDs   |
| Duplicação variants.\*            | Estilos inconsistentes           | Médio                 | Consolidar tokens/design system          |
| Rate limiting ad-hoc              | Segurança incompleta             | Médio                 | Centralizar middleware rate-limit        |
| Multi-tenant scoping manual       | Vazamento dados cross-conta      | Alto                  | Policy guard central (ex wrapper prisma) |

## 14. Próximos Passos Sugeridos

1. Criar script `pnpm orphan:check` usando `ts-prune` + `knip` e gerar relatório automático em CI.
2. Introduzir `logger.ts` com pino (campos padrão: requestId, userId, contaId) e substituir `console.*`.
3. Consolidar `variants` em design tokens exportados de `@alusa/ui`.
4. Adicionar testes para `colaboradores/page.tsx` (ex: filtragem, ordenação, blur de dados sensíveis).
5. Normalizar wizards (interface Step { id: string; title: string; schema?: ZodSchema; }) e gerar doc automática.
6. Implementar pipeline CI (Github Actions) com jobs: install/cache -> lint -> typecheck -> test -> prisma validate.
7. Adotar geração Zod a partir do schema Prisma (ou vice-versa) para eliminar divergências.
8. Criar pasta `docs/arquitetura` movendo este relatório e adicionar diagrama(s) (C4 nível 2/3) + fluxos críticos (cadastro aluno/colaborador).
9. Adicionar Storybook e snapshot visual para componentes `@alusa/ui` e wrappers complexos.
10. Revisar e remover arquivos legacy experimentais `test-*.js` após migração para testes formais.

---

### Notas Metodológicas

Este relatório foi gerado de forma estática com base na estrutura atual de arquivos listada no workspace. A identificação de "órfãos" é heurística e deve ser validada com análise de import graph real. Recomenda-se complementar com ferramentas automatizadas.

### Checklist de Saúde Atual

- Build monorepo: OK (scripts definidos; não verificado em execução neste relatório)
- Lint config: Presente (flat) – precisa integração CI.
- Tests: Presentes mas cobertura parcial (falta agregação e métricas).
- Tipagem: Strict habilitado.
- A11y: Sem tooling automatizado detectado.
- Observabilidade: Básica (health route), sem logs estruturados.

---

_Gerado automaticamente. Atualize periodicamente para manter confiabilidade._
