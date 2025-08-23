# Resumo das Etapas

## Etapa 1 - Monorepo Base
Configuração de workspace pnpm, Turbo e TypeScript base. Risco principal: inconsistência em versions node. Mitigação: fixa Node 20.

## Etapa 2 - Next.js App
Scaffold do app `web` com Tailwind + shadcn. Cuidados: manter paths centralizados.

## Etapa 3 - Prisma Schema
Modelagem inicial (User, Role, Invite, Customer, Billing). Migrations aplicadas. Atenção a futuras alterações com migrações incrementais.

## Etapa 4 - Autenticação e Convites
NextAuth (credentials) + fluxo de convite. Segurança: nunca logar hash ou tokens em claro.

## Etapa 5 - CRUD de Customers
API rest + validação Zod + formulários. Tratamento de duplicidade CPF/CNPJ previsto.

## Etapa 6 - Integração Asaas
Adapter isolado + feature flag `FEATURE_ASAAS`. Webhook preparado para evolução (idempotência futura sugerida).

## Etapa 7 - Testes Automatizados
Infra de unit (Vitest) e E2E (Playwright). Próximo passo: ampliar cobertura e fixtures de DB reset.

## Etapa 8 - CI/CD + Deploy
Workflow GitHub Actions (lint, typecheck, test, e2e, build, deploy). Deploy Vercel (produção em `main`, preview em PR). Logs estruturados prontos para futura integração observabilidade.

## Riscos e Mitigações Gerais
- Mutações em produção sem revisão: usar `prisma migrate deploy` no futuro.
- Segredos: sempre via Vercel / GitHub Secrets.
- Performance DB: adicionar índices conforme queries reais.

## Próximos Passos Recomendados
1. Adicionar testes para adapter Asaas com mocks.
2. Implementar reset de DB dedicado para E2E.
3. Adicionar Sentry (comentado) e Logtail.
4. Configurar análise de cobertura (vitest --coverage).
