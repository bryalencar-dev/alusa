# Context Snapshot para LLM (ChatGPT / IA Assistentes)

_Gerado em: 2025-09-23_

> Objetivo: Fornecer contexto mínimo, estruturado e coerente para que uma IA entenda o estado atual do projeto sem precisar explorar todo o repositório. Use este arquivo como prompt base (pode recortar se necessário).

## 1. Identidade do Projeto

- Nome: Alusa (plataforma de gestão escolar / academias – foco em alunos, colaboradores, professores, matrículas, planos, financeiro básico e convites multi-conta).
- Arquitetura: Monorepo PNPM + Turbo.
- Principais camadas:
  - Frontend & BFF: `apps/web` (Next.js 14 App Router + rotas API).
  - Domínio/Serviços: `packages/lib` (serviços, schemas zod, lógica de domínio).
  - Design System / Primitives: `packages/ui`.
  - Persistência: Prisma + Postgres (`prisma/schema.prisma`).
- Tenant model: Multi-tenant por `contaId` (indices dedicados + uniques compostos). Ownership de conta via `Conta.ownerUserId`.

## 2. Objetivos Funcionais Atuais

- Gestão de Colaboradores, Professores, Alunos (CRUD + wizards com múltiplos steps).
- Convites de usuários (Invite + aceite controlado).
- Matrículas e associação a Turmas, Planos e Combos.
- Controle de descontos e cobrança (modelos já preparados).
- Autenticação com NextAuth + papéis (Role enum) e status.

## 3. Principais Entidades (Resumo Prisma)

(Ver `prisma/schema.prisma` completo; abaixo recorte conceitual)

- Conta: raiz multi-tenant; relaciona usuários, alunos, professores, colaboradores, invites.
- Usuario: credencial/autorização; pode estar ligado a diferentes papéis e a Colaborador/Aluno/Responsável.
- Colaborador (cargo + acesso opcional, unique por conta cpf/email).
- Professor (atributos acadêmico/contratuais, unique cpf/email global).
- Aluno (dados pessoais, saúde, responsaveis, tags, integra matrícula).
- Responsavel (parent/guardian; muitos-para-muitos via AlunoResponsavel).
- Turma, Plano, Matricula, Desconto(+Matricula), Combo(+Turma), Cobranca, Pagamento.
- Invite (token + status + aceite).

## 4. Fluxos Chave Implementados

1. Cadastro Wizard (Aluno / Colaborador / Professor) com steps: identificação, endereço, acesso, confirmação etc.
2. Listagens com filtro, ordenação e paginação client-side (ex: Colaboradores).
3. Convite de usuários (gera token e controla aceitação).
4. Autenticação + primeira criação de usuário (serviço `first-user-service.ts`).
5. Upload & Crop de imagem (ImageCropDialog + react-easy-crop).

## 5. Principais Diretórios

```
apps/web/app/(app)      -> Páginas autenticadas (ex: colaboradores/page.tsx)
apps/web/components     -> UI composta (wizards, dialogs, layout, domain lists)
apps/web/lib            -> Serviços web (auth, rate-limit, helpers, validators internos)
apps/web/hooks          -> Hooks específicos (ex: use-current-user)
packages/lib/src        -> Domínio puro (alunos, invite, services, schemas, validators)
packages/ui/src         -> Primitives (Button, Select, etc.)
prisma                  -> Schema e migrations
Logs                    -> Relatórios gerados (arquitetura, dependências, snapshot)
```

## 6. Tecnologias Base

| Aspecto   | Tecnologia                      | Observações                           |
| --------- | ------------------------------- | ------------------------------------- |
| Runtime   | Node >=22                       | Aderente a features modernas (ES2022) |
| Web       | Next.js 14                      | App Router + Edge possível            |
| ORM       | Prisma 5.18                     | Migrations iterativas em dev          |
| DB        | Postgres                        | Multi-tenant lógico (contaId)         |
| UI        | Tailwind + Radix + shadcn style | Wrappers em `components/ui`           |
| Validação | Zod                             | Diversos schemas; risco de duplicação |
| Auth      | NextAuth                        | Extensões em `lib/auth-*`             |
| Test      | Vitest + Playwright             | Unit + potencial E2E                  |
| Forms     | React Hook Form + Zod resolvers | Wizards                               |

## 7. Dependências (Pontos de Atenção)

- Duplicidade de libs de toast: `react-hot-toast` e `sonner` (decidir 1).
- Estilização: `clsx`, `tailwind-merge`, `class-variance-authority` (consolidar).
- `pnpm` listado como dependency no app (remover).
- `add` pacote possivelmente sobrando (verificar uso).
- `@prisma/client` tanto no root (dev) quanto no app (runtime).

Referência detalhada em `Logs/RELATORIO_DEPENDENCIAS.md`.

## 8. Riscos Técnicos Resumidos

| Tema                    | Risco                              | Mitigação Rápida                            |
| ----------------------- | ---------------------------------- | ------------------------------------------- |
| Schema divergente       | Zod vs Prisma duplicados           | Gerar Zod automaticamente                   |
| Multi-tenant scoping    | Possíveis esquecimentos em queries | Wrapper Prisma com `contaId` enforced       |
| Logs não estruturados   | Diagnóstico difícil                | Introduzir `pino` + middlewares requestId   |
| Testes UI insuficientes | Regressões silenciosas             | Testes de interação (Testing Library) + axe |
| Duplicação variants     | Estilos inconsistentes             | Centralizar tokens em `@alusa/ui`           |
| Dependências residuais  | Superfície de ataque & bundle      | knip + ts-prune + depcheck em CI            |

## 9. Estratégia de Testes Atual (Gap)

- Cobertura: serviços de domínio, alguns hooks, utils.
- Falta: páginas complexas (ex: listagens com filtros), passos de wizards, testes de acessibilidade, snapshots visuais.
- E2E Playwright configurado mas specs não listadas (avaliar criação).

## 10. Variáveis de Ambiente (Dev Exemplo)

(De `.env.example` – NÃO usar segredos em plaintext em produção.)

```
DATABASE_URL=postgresql://postgres:alusa@localhost:5432/alusa?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=*** (mudar em prod)
NEXT_PUBLIC_AUTH_DEBUG=0
AUTH_DEBUG=0
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Boas práticas pendentes: rotacionar segredo, separar env de build vs runtime, adicionar prefixo `NEXT_PUBLIC_` somente ao necessário.

## 11. Exemplo de Página Crítica (Colaboradores)

Características principais (`app/(app)/colaboradores/page.tsx`):

- Client component com estado: filtros (status, busca), ordenação ASC/DESC, blur de dados sensíveis.
- Paginação client-side manual.
- Ações: criar (wizard), editar (dialog), excluir (confirmação).
- Acessibilidade: uso parcial de `aria-label`, necessita melhoria em células e ordenação.
- Sugestão: extrair tabela para componente reutilizável e adicionar testes de interação.

## 12. Próximos Passos Prioritários (Executivo)

1. Configurar CI (lint + typecheck + test + prisma validate + orphan check).
2. Unificar toasts & consolidar styling utilities.
3. Introduzir logger estruturado e policy multi-tenant central.
4. Gerar schemas Zod a partir do Prisma e remover duplicações manuais conflitantes.
5. Criar suite de testes focada em wizards (validação step-by-step + edge cases).
6. Adicionar Storybook para primitives + componentes complexos (tabela, wizards).
7. Implementar Renovate e agrupar atualizações críticas.
8. Monitorar bundle (analyzer) e remover dependências residuais (`add`, `pnpm`).

## 13. Padrões de Código / Estilo Importante

- Typescript strict; evitar `any` (apenas via narrowing explícito).
- Preferir funções puras no domínio (`packages/lib`), side-effects concentrados em camada web/server.
- Reutilizar adaptadores de UI via `components/ui/*` antes de criar novos wrappers.
- Convenção de nomes: Dialogs terminam em `*Dialog.tsx`; wizards em `*WizardDialog.tsx`; steps isolados em pasta `wizard/steps`.
- Evitar acessar diretórios internos de outro pacote exceto via exports explícitos.

## 14. Ferramentas Recomendadas (A Inserir)

- Renovate + Config base.
- knip / ts-prune / depcheck integrados (`pnpm orphan:check`).
- pino + middleware (requestId + contaId).
- Storybook + Chromatic (visual regression).
- Prisma Zod generator.
- ESLint rule custom para impedir imports internos não públicos.

## 15. Como a IA Deve Responder (Guia para Prompts Futuros)

Quando pedirem código:

- Manter separação de camadas (não colocar lógica de domínio em página).
- Usar Zod para validações novas.
- Preservar multi-tenant (`contaId`) como argumento obrigatório em qualquer operação de leitura/escrita.
- Evitar introduzir dependências novas antes de justificar (checar libs existentes).
- Incluir testes (Vitest) para novos serviços + exemplos de uso.
- Garantir acessibilidade mínima (aria-label, roles em componentes de interação).

## 16. Indicadores Simples de Saúde (Sem Automação Ainda)

| Eixo                 | Status Atual       | Nota                    |
| -------------------- | ------------------ | ----------------------- |
| Build / Typecheck    | Scripts existentes | Precisa CI              |
| Testes Domínio       | Bom início         | Ampliar para UI         |
| Testes UI            | Fraco              | Prioritário             |
| Cobertura E2E        | Baixo              | Escrever specs          |
| Observabilidade      | Básica             | Adicionar logs/métricas |
| Consistência Schemas | Média              | Unificar geração        |
| Gestão Dependências  | Manual             | Adotar Renovate         |

## 17. Glossário Rápido

- Wizard: fluxo multi-step para cadastro/edição.
- Conta: entidade multi-tenant isoladora de dados.
- Invite: mecanismo de onboarding controlado via token.
- Step: componente isolado contendo sub-formulário validável.

## 18. Limitações do Snapshot

- Não inclui diff histórico, apenas estado atual.
- Não executou auditoria de licenças real.
- Não verificou efetivamente imports (órfãos heurísticos).

---

_Gerado automaticamente. Atualize este snapshot sempre que ocorrerem mudanças estruturais relevantes._
