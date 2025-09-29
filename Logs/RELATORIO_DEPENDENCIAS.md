# Relatório de Dependências e Ecosistema

_Gerado em: 2025-09-23_

## Objetivo

Mapear dependências (por escopo), classificar criticidade, apontar riscos de versão, redundâncias, oportunidades de consolidação e sugerir políticas de atualização.

## Sumário

1. Visão Geral da Estratégia de Dependências
2. Tabela Consolidada (Root + Apps + Packages)
3. Dependências por Contexto
4. Classificação de Criticidade
5. Redundâncias / Sobreposições
6. Dependências Potencialmente Transitivas Desnecessárias
7. Versões e Política de Atualização Recomendada
8. Licenças (Resumo Inicial)
9. Segurança e Hardening (Surface de Risco)
10. Ferramentas Sugeridas para Gestão Contínua
11. Roadmap de Manutenção

---

## 1. Visão Geral da Estratégia de Dependências

O monorepo utiliza PNPM workspaces: dependências de runtime específicas ficam em cada pacote/app; root mantém apenas tooling transversal e algumas libs compartilhadas (ex: @prisma/client – considerar mover para camadas que realmente usam).

Padrões observados:

- Tipagem estrita (typescript strict) reduz dependências de runtime utilitárias genéricas.
- Uso de Radix UI + shadcn wrappers para UI consistente.
- Prisma presente em root e app web – duplicação potencial.
- Reutilização de pacotes internos via `workspace:*`.

## 2. Tabela Consolidada

Formato: Nome | Versão (declarada) | Local(s) | Tipo (dep/dev/peer) | Observações

```
@prisma/client | 5.18.0 | root(dev), web(dep) | ORM | Duplicado (avaliar centralizar)
prisma | 5.18.0 | root(dev), web(dev) | CLI | OK (ferramenta)
next | 14.2.5 | web(dep) | Framework | Alinhado Node >= 18 (Node 22 ok)
react | 18.2.0 | root(dev), web(dep), ui(peer) | UI | Duplicação controlada (workspace resolve)
react-dom | 18.2.0 | root(dev), web(dep), ui(peer) | UI | idem acima
typescript | 5.5.4 | root(dev), web(dev), lib(dev), ui(dev) | Tooling | Versão uniforme ✅
zod | 3.23.8 | root(dev), web(dep) | Validação | Avaliar mover p/ lib se central
@testing-library/react | 16.0.0 | root(dev), web(dev) | Test | Duplicado
@testing-library/jest-dom | 6.4.2 | root(dev), web(dev) | Test | Duplicado
vitest | 1.6.0 | root(dev), web(dev), lib(dev), ui(dev) | Test Runner | Versão uniforme ✅
@vitest/coverage-v8 | 1.6.0 | root(dev), web(dev) | Coverage | OK
playwright/test | 1.46.1 | web(dev) | E2E | Usado no app
class-variance-authority | 0.7.0 | web(dep) | CSS Variants | Pode migrar parte p/ @alusa/ui
clsx | 2.1.1 | web(dep) | CSS merge | Pode substituir cva+clsx por utils unificados
tailwindcss | 3.4.10 | web(dev) | CSS | OK
tailwind-merge | 2.5.2 | web(dep) | Tailwind util | Redundância parcial com clsx/cva
radix libs (@radix-ui/*) | ~1.x | web(dep) | Headless UI | Usar consolidado em @alusa/ui
framer-motion | ^12.23.12 | web(dep) | Animations | Verificar tree-shaking
date-fns | ^4.1.0 | web(dep) | Datas | Versão major 4 (ok)
react-hook-form | 7.53.0 | web(dep) | Forms | Integrar com zod resolver
@hookform/resolvers | 3.9.0 | web(dep) | Adapter | OK
react-hot-toast | ^2.6.0 | web(dep) | Toasts | Duplicado potencial com sonner
sonner | 1.5.0 | web(dep) | Toasts | Escolher 1 biblioteca
react-dropzone | ^14.3.8 | web(dep) | Upload | OK
react-easy-crop | ^5.5.0 | web(dep) | Cropper | OK
react-qr-code | ^2.0.18 | web(dep) | QR | Tipagem local (types/)
@tanstack/react-table | ^8.21.3 | web(dep) | Tabela | Considerar wrapper interno
bcryptjs | 2.4.3 | root(dev) | Hash | Se usado server -> mover para runtime de lib/server
cep-promise | ^4.4.1 | root(dep), web(dep) | CEP | Duplicação (centralizar em lib)
add | ^2.0.6 | web(dep) | ??? | Provável leftover (avaliar remoção)
pnpm | ^10.15.1 | web(dep) | Gerenciador | Incomum como runtime dep (remover)
```

## 3. Dependências por Contexto

### Root (tooling + algumas libs)

- Qualidade: eslint, prettier, typescript, turbo, vitest.
- ORM: prisma + @prisma/client.
- Test: jsdom, @testing-library/\*.
- Segurança/autenticação: bcryptjs (avaliar presença em pacotes consumidores).

### App Web

- Framework/UI: next, react, radix, tailwind.
- Domínio: depende de `@alusa/lib`.
- Formulários e validação: react-hook-form + zod.
- Notificações duplicadas: react-hot-toast & sonner.
- Acessórios: recorte de imagem, QR code, tabelas, animações (framer-motion).
- Possível pacote estranho: `add` (ver objetivo) e `pnpm` como dependency.

### Package Lib (`@alusa/lib`)

- Apenas typescript (dev). (Falta talvez dependências server-side se serviços usarem bcryptjs ou zod; zod não listado aqui – dependente indireto do app. Risco: divergência se lib for reutilizada fora do app.)

### Package UI (`@alusa/ui`)

- Peer de `react` e `react-dom` (boa prática). Sem dependências extras – leve.

### ESLint Preset

- Peers: eslint, typescript – correto.

## 4. Classificação de Criticidade

| Nível   | Critério                                         | Exemplos                                                |
| ------- | ------------------------------------------------ | ------------------------------------------------------- |
| Crítico | Afeta segurança/dados/core runtime               | next, @prisma/client, prisma, react, bcryptjs           |
| Alto    | Abrange validação, formulários, infra de UI base | zod, react-hook-form, radix, tailwindcss                |
| Médio   | Qualidade de UX / Dev Experience                 | framer-motion, @tanstack/react-table, date-fns          |
| Baixo   | Cosmetic/auxiliares / facilmente substituíveis   | react-hot-toast, sonner, clsx, class-variance-authority |
| Revisar | Uso pouco claro / potencial leftover             | add, pnpm (como dep), duplicações                       |

## 5. Redundâncias / Sobreposições

| Tema                 | Bibliotecas                                    | Ação Sugerida                                         |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Toasts               | react-hot-toast & sonner                       | Escolher uma (padronizar API wrapper interna)         |
| Styling util         | clsx, tailwind-merge, class-variance-authority | Criar `@alusa/ui/style` agregando; remover não usados |
| CEP lib              | cep-promise em root e web                      | Centralizar em `@alusa/lib` e reexportar              |
| Validação            | zod em root e web                              | Definir fonte canonical (talvez root ok)              |
| Notificação/feedback | Toast + possivelmente UI custom                | Criar adaptador único em `components/ui/toast`        |

## 6. Dependências Potencialmente Transitivas Desnecessárias

- `pnpm` em `web` (não deve ser runtime). Remover.
- `add` (verificar se é pacote experimental; se nenhuma importação, retirar).
- `@prisma/client` no root dev e web runtime: se apenas backend serverless (rotas API), manter em web; remover do root ou mover para lib se lib exportar serviços DB.
- `bcryptjs` no root: mover para lib ou web (onde usado) como runtime dependency.

## 7. Versões e Política de Atualização Recomendada

| Categoria                              | Política                                                | Ferramenta Sugerida           |
| -------------------------------------- | ------------------------------------------------------- | ----------------------------- |
| Core (next, react, prisma)             | Atualização minor mensal; major via branch de hardening | Renovate/Dependabot           |
| Segurança (bcryptjs)                   | Patch imediato ao CVE                                   | Renovate + GH Security Alerts |
| Test tooling (vitest, testing-library) | Minor trimestral                                        | Renovate agrupar PRs          |
| UI (radix, tailwind)                   | Minor bimestral                                         | Renovate labels `ui`          |
| Utilidades (date-fns, framer-motion)   | Semanal se patch, minor bimestral                       | Renovate                      |
| Lint/Type tooling                      | Acompanhar TS release (<=30 dias)                       | Renovate + workflow CI        |

Recomendação: Adicionar `renovate.json` no root com agrupamentos por categoria.

## 8. Licenças (Resumo Inicial)

(Necessário rodar auditoria real; inferência por popularidade.)

- MIT predominante: react, next, radix-ui, tailwindcss, zod, vitest.
- BSD/Apache possíveis em sub-deps.
- Ação: executar `pnpm licenses list --json` e gerar anexo de compliance.

## 9. Segurança e Hardening

| Área                  | Observação                                              | Ação                                                           |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Hash Senhas           | bcryptjs (JS puro) menos performático que bcrypt nativo | Avaliar argon2/bcrypt nativo se performance crítica            |
| Dependências Órfãs    | Possível superfície de supply chain                     | Rodar `depcheck`, `knip`                                       |
| Prisma Client         | Regenerar em CI para evitar drift                       | Adicionar job `prisma generate`                                |
| Rate Limiting         | Lib própria simples                                     | Considerar lib consolidada (ex: `@upstash/ratelimit` se Redis) |
| Toast libs duplicadas | Maior bundle e ataque XSS se não padronizado sanitize   | Unificar e validar inputs                                      |

## 10. Ferramentas Sugeridas para Gestão Contínua

- Renovate Bot (config granular por grupo).
- Knip + ts-prune (detecção de arquivos e exports não usados).
- Depcheck (cross-check pacotes declarados vs importados).
- Changesets (versionamento se houver intenção de publicar libs `ui`/`lib`).
- Bundle Analyzer (`next-bundle-analyzer`) para detectar impacto de libs (ex: framer-motion, table).
- License checker (oss-review-toolkit ou `pnpm licenses`).

## 11. Roadmap de Manutenção

1. Remover dependências suspeitas (`add`, `pnpm` do runtime) – validar imports antes.
2. Criar adaptador `toast` unificado e remover uma das libs.
3. Mover `zod` para root apenas (ou para `@alusa/lib`) e reexportar tipos comuns.
4. Centralizar libs de endereço/CEP em `@alusa/lib` e adaptar web.
5. Introduzir `renovate.json` com grupos: core, ui, test, tooling.
6. Script `pnpm deps:audit` que roda: `pnpm audit --prod && pnpm licenses list` (ou integrar GitHub Advanced Security se disponível).
7. Adicionar step de `size-limit` ou `bundle-analyzer` para monitorar peso incremental.
8. Criar dashboard leve (markdown gerado) com diff de dependências por commit (hook CI).
9. Revisar periodicidade de updates antes de congelar release semestral.
10. Documentar política de breaking changes para `@alusa/ui` e `@alusa/lib` (caso publicação futura).

---

### Anexo A: Próximas Ações Automatizáveis

```bash
# (Exemplo de script sugerido)
pnpm dlx knip --json > Logs/knip-report.json
pnpm dlx ts-prune > Logs/ts-prune-report.txt
pnpm dlx depcheck > Logs/depcheck-report.txt
```

### Anexo B: Template renovate.json (esboço)

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "rangeStrategy": "bump",
  "packageRules": [
    { "groupName": "core-framework", "matchPackagePatterns": ["^next$", "^react$", "^react-dom$"] },
    { "groupName": "orm", "matchPackagePatterns": ["prisma", "@prisma/client"] },
    { "groupName": "ui-headless", "matchPackagePatterns": ["@radix-ui/"] },
    { "groupName": "testing", "matchPackagePatterns": ["vitest", "@testing-library/"] },
    { "groupName": "linting", "matchPackagePatterns": ["eslint", "typescript"] }
  ]
}
```

---

_Gerado automaticamente. Atualize após qualquer mudança relevante de dependências._
