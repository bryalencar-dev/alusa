# Alusa — Documento Unificado e Consolidado

**Data:** 2025-08-22

**Status:** Fonte da Verdade (substitui versões anteriores dos anexos ao projeto)

> Este documento mescla integralmente os anexos fornecidos, resolve divergências com base no **Documento Funcional Consolidado**, e adiciona um **Guia de Boas Práticas** abrangente. Nada foi removido; conteúdos originais estão preservados em Apêndices.



## Sumário
1. [Contexto e Objetivos](#contexto-e-objetivos)
2. [Visão, Escopo e Papéis](#visão-escopo-e-papéis)
3. [Decisões de Consolidação (Divergências Resolvidas)](#decisões-de-consolidação-divergências-resolvidas)
4. [Requisitos Funcionais](#requisitos-funcionais)
5. [Regras de Negócio](#regras-de-negócio)
6. [UX/UI — Paleta, Tokens e Diretrizes](#uxui-—-paleta-tokens-e-diretrizes)
7. [Arquitetura Técnica e Stack](#arquitetura-técnica-e-stack)
8. [Modelo de Dados (PostgreSQL/Prisma)](#modelo-de-dados-postgresqlprisma)
9. [Integração Asaas (MVP/Sandbox)](#integração-asaas-mvpsandbox)
10. [Fluxos Críticos](#fluxos-críticos)
11. [Segurança, Privacidade e Compliance](#segurança-privacidade-e-compliance)
12. [Observabilidade e Operação](#observabilidade-e-operação)
13. [DevEx: Build, Deploy e CI/CD](#devex-build-deploy-e-cicd)
14. [Guia de Boas Práticas (Engenharia, Produto e Design)](#guia-de-boas-práticas-engenharia-produto-e-design)
15. [Checklist de Aceite do MVP](#checklist-de-aceite-do-mvp)
16. [Glossário](#glossário)
17. [Apêndice A — Conteúdo Integral “ALusa.md”](#apêndice-a-—-conteúdo-integral-alusamd)
18. [Apêndice B — Conteúdo Integral “Documento Técnico”](#apêndice-b-—-conteúdo-integral-documento-técnico)
19. [Apêndice C — Conteúdo Integral “Paleta Visual - Alusa.md”](#apêndice-c-—-conteúdo-integral-paleta-visual---alusamd)
20. [Apêndice D — Conteúdo Integral “Documento Funcional Consolidado”](#apêndice-d-—-conteúdo-integral-documento-funcional-consolidado)


## Contexto e Objetivos
A Alusa é uma plataforma de gestão para escola de dança, cobrindo cadastros, turmas, matrículas, financeiro, presença, eventos/ingressos, e relatórios. 
Objetivo: disponibilizar um **MVP funcional** com integrações essenciais (incluindo **Asaas em sandbox**), mantendo uma base escalável, segura e coerente com os anexos originais.


## Visão, Escopo e Papéis
- **Perfis/RBAC:** Admin, Gestor, Professor, Atendente, Aluno/Responsável.
- **Módulos:** Cadastros (pessoas, professores, salas), Turmas/Combos, Matrícula (com **taxa de matrícula**), Financeiro (mensalidades, **descontos**), Presenças, Eventos/Ingressos (check-in **QR individual**), Relatórios.
- **Resultados-chave (MVP):** matrículas com combos; faturas recorrentes via Asaas; registro de presença (regra **“Atraso = Presente”** para contagem oficial, com flag de atraso para analytics).


## Decisões de Consolidação (Divergências Resolvidas)
> Todas as decisões abaixo **substituem** versões divergentes dos anexos.
1. **Asaas no MVP (Sandbox):** ativado com mapeamento `customer`, `subscription`, `payment` e **webhooks abrangentes**.  
2. **Taxa de Matrícula:** incluída no MVP (campo `taxaMatricula` na matrícula e regras financeiras associadas).  
3. **Descontos:** incluídos no MVP (percentual e valor fixo; escopo: matrícula, mensalidade, pacote/combo; cumulatividade configurável).  
4. **Combos de Turmas:** modelagem explícita com `Combo` e `ComboTurma`.  
5. **Presenças:** “Atraso conta como Presente” para fins de frequência oficial; atraso é registrado com minutagem quando possível.  
6. **Eventos/Ingressos:** ticket por pessoa com **QR único**, check-in por leitura e antifraude (uso único, registro de dispositivo/atendente).  
7. **Padrão de UI/Design System:** Paleta e tokens do anexo “Paleta Visual” tornam-se padrão oficial (modo claro/escuro, estados e acessibilidade).


## Requisitos Funcionais
- **Cadastros:** pessoa/aluno, responsável, professor, sala/espaço, planos/combos, turmas, categorias de evento.  
- **Matrícula:** wizard com seleção de turma(s) e/ou **combo**; aplicação de **taxa de matrícula**; regras de **desconto**; geração de contrato e primeira cobrança.  
- **Financeiro:** geração de mensalidades, integração Asaas (criação de `customer`, `subscription`, emissão de `payment`), conciliação via webhook, painel de inadimplência, remissão/estorno conforme regra.  
- **Presenças:** chamada por aula, tolerância de atraso configurável, relatórios por turma/aluno.  
- **Eventos:** criação, precificação (lote, meia/inteira, cortesia), emissão de ingressos com QR e check-in.  
- **Relatórios/KPIs:** matrícula por período, ocupação de turmas, churn/adesão, inadimplência, receita por produto (turma/combo/evento).  
- **Admin:** gestão de usuários, perfis, auditoria básica (log de ações críticas).


## Regras de Negócio
- **Matrícula ativa** exige vínculo a pelo menos uma turma ou combo vigente.  
- **Taxa de matrícula**: aplicada uma vez por aluno por contrato (configurável por escola; isenção possível por regra/bolsa).  
- **Descontos**: tipos `percentual` e `valor`; escopo `matricula|mensalidade|combo`; `cumulativo` (bool) e prioridade; validade por período.  
- **Combos**: agrupam turmas com preço base; cancelamento parcial segue política (ex.: substituição de turma x crédito proporcional).  
- **Presença**: atraso ≤ limite (ex.: 10 min) conta como Presente; atraso > limite pode marcar Presente (atrasado) ou Ausente, conforme política.  
- **Financeiro**: geração de faturas recorrentes; reemissão em caso de falha; regras de multa/juros; suspensão após N dias de atraso (configurável).  
- **Eventos**: cada ingresso é pessoal e intransferível; reembolso segue política e estado do payment.


## UX/UI — Paleta, Tokens e Diretrizes
- **Paleta/Tokens:** conforme anexo (cores base, tons, semânticas: sucesso/erro/alerta/info, superfícies, bordas, tipografia, espaçamentos).  
- **Acessibilidade:** contraste mínimo WCAG AA; foco visível; navegação por teclado; labels e aria-atributos; erro com instruções de correção.  
- **Layout:** Sidebar fixa, topo com busca/ações; páginas com breadcrumbs; estados de carregamento/vazio/erro padronizados.  
- **Componentes-chave:** Tabela com paginação e filtros; Form com validação inline; Wizard de matrícula; Scanner QR para check-in.  
- **Dark/Light:** tokens neutros adequados; gráficos adaptativos; preservação de contraste.


## Arquitetura Técnica e Stack
- **Front-end:** Next.js 15.x (App Router) + React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand/Server Actions onde aplicável.  
- **Back-end:** Next API routes/Edge Functions; Prisma ORM; PostgreSQL (Railway/Neon).  
- **Infra/Deploy:** Vercel (frontend+API), Railway/Neon (DB).  
- **Autenticação/Autorização:** JWT (rotas API) + middleware; RBAC por perfis.  
- **Integrações:** **Asaas (sandbox no MVP)** via REST e webhooks.  
- **Outros:** Storage de arquivos (ex.: contratos) em provider S3-compatível; CDN para ativos estáticos.


## Modelo de Dados (PostgreSQL/Prisma)
**Entidades principais (resumo):**
- `Pessoa` (aluno/responsável/professor)  
- `Usuario` (login, perfil/RBAC)  
- `Turma`, `Aula`  
- `Combo`, `ComboTurma`  
- `Matricula` (`taxaMatricula`, `descontoAplicadoId?`)  
- `Desconto`, `DescontoMatricula`  
- `Plano`/`Assinatura` (se aplicável)  
- `Pagamento` (estado, valores, referências Asaas)  
- `WebhookAsaas` (armazenamento de eventos, idempotência, status de processamento)  
- `Evento`, `Ingresso` (QR, status, check-ins)
**Campos de integração Asaas (exemplos):**
- `Pessoa.asaasCustomerId`  
- `Matricula.asaasSubscriptionId?`  
- `Pagamento.asaasPaymentId`, `statusAsaas`, `payload` (JSONB), `lastEventAt`
**Convenções:**
- Chaves surrogate (`id UUID`), timestamps (`createdAt`, `updatedAt`), `deletedAt` (soft delete quando aplicável).


## Integração Asaas (MVP/Sandbox)
**Escopo:** criação/atualização de `customer`, criação de `subscription` e `payment`, conciliação por webhooks.
**Webhooks (ouvir e processar):**
- `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`
- `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_DELETED`/`CANCELED`
**Segurança Webhook:**
- Endpoint dedicado `/api/webhooks/asaas`, verificação de assinatura/secreto, registro **idempotente** por `eventId`, resposta 2xx apenas após persistir.  
**Mapeamento de estados:** `Pagamento.status` espelha estados Asaas com tabela de conversão; reconciliações atualizam financeiro e disparam notificações.  
**Erros/Retry:** Dead-letter local (fila de reprocesso), backoff exponencial, alerta em falhas repetidas.
**Idempotência em criação:** `Idempotency-Key` por operação sensível; logs com correlação.


## Fluxos Críticos
1. **Matrícula com Combo** → seleciona combo/turmas → aplica taxa/descontos → cria `customer` (se necessário) → cria `subscription`/`payment` → confirma e envia comprovante.  
2. **Cobrança Recorrente** → geração mensal → emissão `payment` → webhook confirma recebimento → baixa no financeiro e libera acesso/registro.  
3. **Presença** → professor abre chamada → marcações (Presente/Atrasado/Ausente) → relatório com tolerância configurável.  
4. **Evento/QR** → compra/emissão → QR único → check-in → bloqueio de reuso, auditoria de tentativas.


## Segurança, Privacidade e Compliance
- **Proteção de dados:** dados pessoais minimizados; criptografia em repouso (DB provider) e em trânsito (TLS).  
- **Segredos:** variáveis em Vercel/Railway; rotação periódica; princípio do menor privilégio.  
- **Autorização:** checagem em backend; logs de auditoria para ações críticas (ex.: estorno, cancelamento).  
- **LGPD:** base legal (execução de contrato); portabilidade sob solicitação; exclusão/anonimização; registro de consentimento quando necessário.  
- **Backups:** automáticos e testes de restauração.


## Observabilidade e Operação
- **Logs estruturados** (JSON) com correlação (`requestId`, `userId`).  
- **Métricas**: latência de APIs, taxa de erro, throughput, tempo de processamento de webhooks, D+ atraso financeiro.  
- **Alertas**: pico de 5xx, falhas de webhook, falha de emissão de cobrança.  
- **Dashboards**: visão de saúde (APIs), financeiro (status de pagamentos), engajamento (presença).


## DevEx: Build, Deploy e CI/CD
- **Git:** trunk-based com PRs curtos; `main` protegida; revisão obrigatória.  
- **Commits:** Conventional Commits; versionamento SemVer.  
- **CI:** lint, typecheck, testes unitários, migrações Prisma dry-run.  
- **CD:** Vercel preview por PR; merge → deploy para produção.  
- **Migrations:** `prisma migrate` com revisão; rollback scripts; seeds idempotentes.  
- **Qualidade:** cobertura mínima acordada; testes críticos para webhooks e financeiro.


## Guia de Boas Práticas (Engenharia, Produto e Design)
### Engenharia
- **Padrões de Código:** TypeScript estrito; ESLint+Prettier; evitar any; DTOs validados (zod) nas bordas.  
- **Arquitetura:** separar domínios (módulos) e camadas (API/Service/Repo); não acessar Prisma direto de componentes.  
- **Erros:** nunca silenciar exceções; mapear para erros de domínio; mensagens seguras (sem dados sensíveis).  
- **Performance:** paginar sempre; N+1 evitado com `include/select`; cache por chave de lista; evitar renderizações custosas.  
- **Idempotência:** todas as operações financeiras e webhooks.  
- **Resiliência:** timeouts, retries com backoff, circuit breaker onde faz sentido.  
- **Observabilidade:** logs com contexto; métricas e tracing nas rotas críticas.  
- **Segurança:** sanitização de inputs; rate limit em rotas públicas; CSRF para ações sensíveis; headers de segurança.  
- **Banco:** chaves estrangeiras explícitas; índices para buscas; enum vs lookup tables conforme necessidade de extensibilidade; **não** deletar hard registros financeiros.  
- **Migrações:** uma alteração por migration; descrição clara; teste em staging.
### Produto
- **Descoberta contínua:** registrar suposições; instrumentar métricas de sucesso (ex.: tempo de matrícula, DSO).  
- **Critérios de aceite:** definidos por história; estados e mensagens incluídos; testes de usabilidade para fluxos novos.  
- **Feature flags:** liberar de forma incremental (dark launch/gradual).  
- **Documentação viva:** manter este documento atualizado a cada release.
### Design
- **Acessibilidade primeiro:** contraste, foco, leitor de tela.  
- **Consistência:** tokens + componentes; não reinventar controles nativos sem necessidade.  
- **Microcopy:** linguagem clara, orientada à ação; mensagens de erro com solução.  
- **Responsividade:** mobile-first nas telas de check-in e matrícula.  
- **Estados vazios:** educacionais, com CTA útil.


## Checklist de Aceite do MVP
- [ ] Matrícula com **taxa** e **desconto** aplicáveis  
- [ ] Combos de turmas funcionando (CRUD + matrícula)  
- [ ] Asaas sandbox: criação de customer/subscription/payment  
- [ ] Webhooks: recebidos, validados, idempotentes, reconciliam financeiro  
- [ ] Presenças com **Atraso = Presente** (configurável)  
- [ ] Eventos com QR único e check-in antifraude  
- [ ] Relatórios básicos (ocupação, inadimplência, receita)  
- [ ] RBAC completo e logs de auditoria críticos  
- [ ] Deploy produtivo estável + backups testados


## Glossário
- **Asaas:** gateway de pagamentos com cobrança recorrente.  
- **Combo:** pacote de turmas comercializado em conjunto.  
- **Webhook:** notificação assíncrona enviada por terceiro (Asaas) para conciliação interna.  
- **Idempotência:** mesma operação repetida não altera resultado além do primeiro sucesso.


## Apêndice A — Conteúdo Integral “ALusa.md”


# Alusa — Documento Único (Escopo + PRD + Boas Práticas + Stack)

> Plataforma SaaS para **gestão de escolas de dança** (ballet, jazz, hip-hop, valsa etc.). Web responsiva (mobile-first), sem app nativo no MVP.

---

## 1) Visão & Objetivos

**Proposta de valor**
Centralizar o dia a dia de escolas de dança: cadastro e gestão de alunos, turmas, professores, planos/mensalidades, eventos, acesso segmentado (gestor, financeiro, recepção, professores, responsáveis), **cobrança recorrente** e **controle de inadimplência** com a Asaas (integração planejada pós-MVP).

**Público-alvo**
Donos e gestores de escolas de dança; recepção; financeiro; professores; pais/responsáveis.

**Metas do MVP (90 dias após go-live)**

* 10 escolas ativas usando o fluxo completo de matrícula e cobrança (sandbox Asaas se necessário).
* Tempo médio de matrícula ≤ 4 min.
* Redução de 50% em erros de cadastro (idade/responsável).
* Satisfação (NPS interno) ≥ 8/10 para recepção e gestão.

---

## 2) Regras de Negócio (MVP)

1. **Planos, mensalidades e combos**

   * Escola define **planos** (ex.: 1x/semana, 2x/semana) e **mensalidades** (valores, ciclos, vencimento padrão).
   * **Combos de turmas**: conjunto pré-configurado (ex.: Ballet + Jazz) para seleção rápida no ato da matrícula.
   * Itens adicionais futuros (pós-MVP): taxa de matrícula, desconto promocional, congelamento de plano.

2. **Idade & vínculo do responsável**

   * Capturar **data de nascimento** do aluno.
   * Se **< 18 anos**: exigir **responsável principal** com CPF, e-mail e telefone; o responsável é o **usuário de login** (SSO interno).
   * Se **≥ 18 anos**: aluno é o titular; responsável é opcional (contato alternativo).

3. **Acesso & permissões**

   * **Owner/Admin** (gestor): tudo.
   * **Financeiro**: cobranças, conciliações, relatórios financeiros; sem editar turmas/alunos.
   * **Recepção**: **cadastrar/editar** alunos, turmas, planos, **criar eventos**; **sem relatórios/financeiro**.
   * **Professor**: turmas, lista de presença, agenda/eventos; sem finanças ou dados sensíveis.
   * **Responsável/Aluno** (portal): ver matrículas, faturas e status, eventos da turma, dados pessoais.

4. **Cobrança & inadimplência (via Asaas, pós-MVP)**

   * Ao concluir matrícula: criar **cliente** e **assinatura** na Asaas; ciclo **mensal** por padrão.
   * Cobranças geradas e notificadas pela **Asaas** (boleto, Pix, cartão crédito/débito, conforme escola).
   * **Sincronismo por Webhooks**: atualizar status da fatura/assinatura (ex.: `PAYMENT_CREATED`, `PAYMENT_RECEIVED`), sem polling. ([Asaas Docs][1])
   * Asaas recomenda **webhooks** (até 10 URLs, eventos configuráveis); eventos ficam **14 dias** na fila. ([Asaas Docs][2])

---

## 3) Principais Fluxos

**Fluxo de matrícula (responsável como login quando <18):**

1. Recepção inicia “Nova matrícula” → escolhe plano/combos → define turma(s) e vencimento.
2. Preenche dados do **responsável** (se <18) e do **aluno**; uploads (foto).
3. Wizard em etapas curtas (+ validações) → resumo → concluir.
4. Pós-MVP: dispara criação de **cliente** e **assinatura** na Asaas; guarda IDs; configura webhooks. ([Asaas Docs][3])
5. Fatura criada pela assinatura → Alusa atualiza **status** por webhook (ex.: pago/pendente). ([Asaas Docs][1])

**Fluxo de presença/rotina do professor:** abrir turma do dia → marcar presença → observações → salvar.

**Eventos (internos/externos):** criação pela recepção/gestão com público-alvo e inscrições simples (MVP).

---

## 4) UX/UI (MVP)

* **SPA** com **sidebar fixa** (navegação), **header fixo** (busca, ações), área de conteúdo de rotas (sem full reload).
* **Transições suaves** de rotas e **animação** ao expandir/ocultar o menu lateral.
* **Skeletons** para carregamento; **toasts** (sucesso/erro/aviso).
* **Tabelas e gráficos** (listagens de alunos, turmas, finanças básicas).
* **Tags/Badges** de status (Ativo/Inativo, Pago/Em atraso).
* **Formulários** com máscaras (CPF/CNPJ, CEP, telefones), validação (Zod/RHF), **auto-preencher endereço por CEP**.
* **Wizards** quando o formulário for longo.

**Identidade visual**: moderna e minimalista, foco em produtividade e clareza. (Paleta/Fontes conforme arquivo “Paleta Visual — Alusa.md” previamente anexado.)

---

## 5) Arquitetura & Estrutura

**Estilo**: Monorepo escalável (pnpm workspaces + Turborepo).
**Roteamento/Render**: Next.js App Router, React Server Components; SPA-feel com transições.
**Banco**: PostgreSQL.
**ORM**: Prisma.
**Autenticação**: NextAuth v4 (produção estável); preparar *feature flag* para futura migração para Auth.js v5 quando sair de beta. ([next-auth.js.org][4], [authjs.dev][5])
**Infra inicial**: sem Docker (DB local ou remoto tipo Railway). **Dockerfile** e **docker-compose** já no repositório (ativar na preparação para produção/escala).
**Hospedagem alvo**: Vercel (Web) + banco gerenciado (Railway/Supabase/RDS).
**CI/CD**: GitHub Actions (testes, lint, build, preview).

**Monorepo (proposta):**

```
alusa/
  apps/
    web/           # Next.js (App Router)
    api/           # (opcional) BFF/edge routes; começar dentro do web (route handlers)
  packages/
    ui/            # Componentes (shadcn/ui + design system Alusa)
    config/        # ESLint, TS, Tailwind, Prettier compartilhados
    lib/           # Hooks/utils (auth, storage, formatos BR, etc.)
  prisma/          # schema.prisma, migrations, seed
  .github/workflows/
  turbo.json
  pnpm-workspace.yaml
```

---

## 6) Dados & Segurança

* **LGPD**: consentimento de uso de dados; perfis com **mínimo privilégio**.
* **Criptografia**: senhas/sessões seguras; cookies `HttpOnly/SameSite`.
* **Validações**: CPF/CNPJ (sintaxe), e-mail, senha forte; data de nascimento consistente.
* **Uploads**: limitar tipos/tamanho; varredura básica; storage externo opcional pós-MVP.
* **Observabilidade**: logs de auditoria (quem mudou o quê), métricas básicas de uso.

---

## 7) Roadmap

**MVP**

* Cadastros: alunos, responsáveis, professores, turmas, planos, combos.
* Matrícula com wizard; tags/status; listagens e filtros.
* Presenças e eventos simples.
* Autenticação e papéis definidos.
* Máscaras/validações; CEP auto-fill; uploads simples.
* Tabelas e gráficos básicos.
* Configuração **pré-Asaas** (sem ligar chaves no MVP).
* Skeletons, toasts, transições.

**Pós-MVP (prioridade 1)**

* Integração **Asaas** (assinaturas, webhooks, conciliação). ([Asaas Docs][1])
* Relatórios financeiros (receita por plano/turma; inadimplência).
* Exportações (CSV/XLSX).

**Futuro**

* App mobile (após validação de mercado).
* Dashboards avançados (sem BI externo por ora).
* Notificações push/e-mail internas (se necessário além da Asaas).

---

## 8) Stack & Dependências (com versões recomendadas)

> Selecionadas para estabilidade/compatibilidade em **ago/2025**. Sem comandos de instalação — apenas versões.

### Ambiente

* **Node.js**: **22.x LTS** (ativo até \~out/2025). ([endoflife.date][6], [NodeSource][7])
* **pnpm**: **10.15.x** (workspaces). ([npm][8])
* **Turborepo**: **≥ 2.5.x** (melhorias e correções recentes; recomendado ≥2.4.1 para deploy Vercel). ([Turborepo][9], [Vercel][10])

### Front-end (apps/web)

* **Next.js**: **15.1+** (suporte estável ao **React 19**). ([Next.js][11])
* **React**: **19.x**. ([Next.js][11])
* **Tailwind CSS**: **4.x** (com **shadcn/ui v4** compatível com React 19/TW v4). ([ui.shadcn.com][12])
* **Componentes**: **shadcn/ui v4**. ([ui.shadcn.com][12])
* **Animações**: **framer-motion 12.23.x** (ou **motion** para nova API). ([npm][13], [motion.dev][14])
* **Toasts**: **react-hot-toast 2.6.x**. ([npm][15])
* **Tabelas**: **@tanstack/react-table 8.21.x**. ([npm][16])
* **Gráficos**: **recharts 3.1.x**. ([npm][17])

### Formulários & Validação

* **React Hook Form**: **7.62.x**. ([npm][18])
* **Zod**: **4.0.17**. ([npm][19], [Zod][20])
* **Máscaras**: **react-imask 7.6.1** (CPF/CNPJ/telefone etc.). ([npm][21])
* **Moeda**: **react-currency-input-field 3.10.0**. ([npm][22])
* **CEP (auto-preenchimento)**: **cep-promise 4.4.1**. ([npm][23])

### Uploads & Mídia

* **react-dropzone 14.3.8** (uploads de foto/arquivos). ([npm][24])

### Estado & Utilidades

* **Zustand 5.0.8** (estado leve). ([npm][25])

### Back-end / Dados

* **Prisma ORM 6.14.x**. ([GitHub][26], [GitClear][27])
* **PostgreSQL**: 14+ (local/remoto).
* **Auth**: **NextAuth v4 estável** (v5 ainda **beta** — preparar feature flag). ([next-auth.js.org][4], [authjs.dev][28])

### Testes & Qualidade

* **Vitest 3.2.x** (unit/integration; Next 15 docs já cobrem Vitest). ([npm][29], [Next.js][30])
* **Playwright 1.55.x** (E2E). ([npm][31])
* **ESLint + Prettier** (configs compartilhadas no pacote `config/`).
* **Husky + lint-staged** (pré-commit).

> Observações de compatibilidade:
>
> * **Next 15.1 + React 19** estável; App Router mantém suporte a recursos recentes. ([Next.js][11])
> * **Tailwind 4 + shadcn/ui v4** prontos para React 19. ([ui.shadcn.com][12])
> * **Asaas**: modelos de **assinatura** e **webhooks** documentados (usar após o MVP). ([Asaas Docs][1])

---

## 9) Integração Asaas (pós-MVP) — diretrizes

* **Criação de assinatura**: endpoint `/v3/subscriptions` com ciclo `MONTHLY` e `nextDueDate`; vincular `customer`. ([Asaas Docs][1])
* **Eventos**: consumir **webhooks de pagamento** (ex.: `PAYMENT_CREATED`, `PAYMENT_RECEIVED`) para atualizar status no Alusa; **não** usar polling. ([Asaas Docs][1])
* **Configuração**: registrar URL(s) de webhook na Asaas (interface ou API); até **10 URLs**; eventos mantidos **14 dias**. ([Asaas Docs][2])
* **Cartão** (tokenização): possível atualizar cartão sem cobrar imediatamente. ([Asaas Docs][32])

> **MVP**: deixar **tudo pré-configurado** (modelos, serviços, envs, rotas e handlers vazios/`feature flag`) **sem** ativar chaves de produção.

---

## 10) Preços & Comercial

* **Modelo**: **Assinatura mensal** com **7 dias grátis**.
* **Canais**: site institucional + captação ativa em redes (IG/TikTok) focadas em escolas de dança.
* **Foco vertical**: somente **dança** (não ampliar para outras academias no MVP).

---

## 11) Boas Práticas de Desenvolvimento

* **Mínimo privilégio** por papel; segregação de permissão no backend.
* **Schema-first** (Prisma) + migrações versionadas.
* **Validações** no **cliente** (UX) e **servidor** (segurança).
* **Acessibilidade**: foco de teclado, aria-labels, contraste; shadcn/radix ajudam.
* **Performance**: RSC, cache, lazy boundaries, **skeletons** e `Suspense`.
* **Observabilidade**: logs estruturados; tracking de erros.
* **Feature flags** para integrações externas (Asaas), sem bloquear o MVP.
* **Documentação** no repositório (README, ADRs curtos).

---

## 12) Entregas do MVP (Checklist)

* [ ] Monorepo (pnpm + Turborepo) com apps/packages e configs compartilhadas.
* [ ] Modelagem Prisma (aluno, responsável, professor, plano, combo, turma, matrícula, fatura stub).
* [ ] Autenticação (NextAuth v4) + papéis. ([next-auth.js.org][4])
* [ ] UI base (layout SPA: sidebar, header, conteúdo; transições + skeleton).
* [ ] Cadastros CRUD + wizard (alunos, responsáveis, professores, turmas, planos, combos).
* [ ] Máscaras (react-imask), CEP auto-fill (cep-promise), validações (RHF + Zod). ([npm][21])
* [ ] Uploads (react-dropzone) com restrições. ([npm][24])
* [ ] Listagens (tanstack table) + tags de status; gráficos básicos (recharts). ([npm][16])
* [ ] Toasts (react-hot-toast). ([npm][15])
* [ ] Testes base (Vitest + Playwright). ([npm][29])
* [ ] Pré-estrutura Asaas (models, services, webhooks, envs **sem** chaves). ([Asaas Docs][1])
* [ ] Dockerfile/docker-compose prontos (desativados no dia a dia).
* [ ] CI/CD (build, lint, test; preview em PR).

---

## 13) Riscos & Mitigações

* **Mudanças na API Asaas** → manter camada de integração e mapeamento de eventos isolada; testes de contrato.
* **Complexidade de combos** → limitar regras no MVP (sem condicionais avançadas).
* **Dados sensíveis de menores** → reforçar consentimento, perfis e redigir política de privacidade clara.
* **Escala** → monorepo + Turborepo + deploy em Vercel; preparar containers quando crescer.

---

## 14) Critérios de Sucesso

* Escolas operando **sem planilha paralela** (uso diário real).
* **Recepção** consegue matricular em ≤ 4 min.
* **Financeiro** enxerga status de cobrança e inadimplência **sincronizados** (pós-MVP com Asaas).
* Retenção ≥ 80% após período de 7 dias grátis.

---

## 15) Anexos & Referências

* Paleta/Fontes: “**Paleta Visual — Alusa.md**” (anexo do projeto).
* Node 22 LTS: endoflife & release. ([endoflife.date][6], [NodeSource][7])
* Next 15.1 + React 19: anúncio oficial. ([Next.js][11])
* Tailwind 4 + shadcn v4: docs. ([ui.shadcn.com][12])
* Prisma 6.14: releases. ([GitHub][26], [GitClear][27])
* TanStack Table v8, RHF 7.62, Recharts 3.1, react-dropzone 14.3, react-hot-toast 2.6, Zustand 5.0.8, Zod 4.0.17, framer-motion 12.23: páginas oficiais. ([npm][16], [GitHub][33])
* Asaas: assinaturas, webhooks, eventos. ([Asaas Docs][1])
* Testes: Vitest 3.2, Playwright 1.55, guia Next + Vitest. ([npm][29], [Next.js][30])

## Apêndice B — Conteúdo Integral “Documento Técnico”



# Alusa — Documento Técnico (Banco de Dados + Regras de Negócio)

> Plataforma SaaS para **gestão de escolas de dança** (ballet, jazz, hip‑hop, valsa etc.), com foco em cadastros, matrículas, presenças, eventos (incluindo eventos pagos), financeiro e loja integrada. Proposta de valor: centralizar o dia a dia da escola, com acesso segmentado por perfil e suporte a cobrança recorrente e controle de inadimplência (integração Asaas **pós‑MVP**). fileciteturn1file0L9-L11

---

## 1) Contexto, Escopo e Metas

### 1.1 Contexto
- Web responsiva (mobile‑first), sem app nativo no MVP. fileciteturn1file4L1-L3  
- Público‑alvo: donos/gestores, recepção, financeiro, professores e responsáveis. fileciteturn1file4L12-L13

### 1.2 Escopo (alto nível)
- Cadastros: alunos, responsáveis, colaboradores, turmas, salas, planos, modalidades, fornecedores, feriados, eventos, presenças.
- Módulos: matrículas, financeiro (planos/cobranças/pagamentos), loja (produtos/estoque/vendas), eventos (inscrição/ingressos), autenticação e perfis.

### 1.3 Metas do MVP
- 10 escolas ativas usando matrícula e cobrança; tempo médio de matrícula ≤ 4 min; reduzir 50% erros de cadastro; NPS ≥ 8/10. fileciteturn1file4L15-L20

---

## 2) Perfis de Acesso e Autenticação

### 2.1 Perfis (RBAC)
- **Administrador (Master)** — acesso total; cria/desativa usuários; gerencia perfis, finanças e configurações.
- **Financeiro** — cobranças, conciliações, relatórios; sem editar turmas/alunos. fileciteturn1file4L40-L42
- **Recepção** — cadastros (aluno, turma, plano), matrículas, presenças, eventos; sem relatórios financeiros. fileciteturn1file4L41-L43
- **Professor** — turmas próprias, lista de alunos e presenças; sem dados sensíveis/finanças. fileciteturn1file4L43-L44
- **Aluno/Responsável (portal)** — vê matrículas, faturas, eventos e dados pessoais. fileciteturn1file4L44-L44
- **Restrito (visualização)** — apenas consulta limitada (quando aplicável).

### 2.2 Convite e primeiro acesso
- Convite **via link único** enviado por e‑mail pelo Administrador, com validade (ex.: 7 dias).
- Ao abrir o link:
  - Se o e‑mail **já existir**: sistema **importa dados** (nome, telefone, foto etc.) e o usuário apenas define **senha**.
  - Se **novo usuário**: preenche nome, e‑mail, telefone e senha.
- Perfil é **atribuído automaticamente** conforme definido no convite.
- **Logs** registram quem convidou e quando foi aceito.

### 2.3 Login, Login Social e 2FA
- **Login**: e‑mail + senha (hash seguro, ex.: bcrypt/argon2); sessão com token (JWT/afim); expiração configurável.
- **Login Social**: Google/Facebook/Apple — se e‑mail já existir, o login é vinculado; senão, cadastro simplificado.
- **2FA (opcional/forçável)**: app autenticador (TOTP) ou SMS. Fluxo: e‑mail+senha → código 2FA.
- **Recuperação de senha**: link temporário (ex.: 1h) enviado por e‑mail.
- **Áreas públicas**: `/auth/login`, `/auth/register` (via convite), `/auth/forgot-password`.
- **Middleware** de autenticação/autorizações protege todas as rotas internas.

### 2.4 Rotas (exemplo REST)
```
POST /auth/login
POST /auth/login-social
POST /auth/register              # via convite
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/logout
POST /auth/2fa/enable
POST /auth/2fa/verify

GET  /users/me
PATCH /users/me
POST /users/invite               # admin
PATCH /users/:id/reset-password  # admin
PATCH /users/:id/status          # admin
```

---

## 3) Regras de Negócio (Consolidadas)

### 3.1 Matrícula
- Feita **na recepção**. Dados mínimos: aluno, turma (com modalidade), plano (periodicidade e valor) e vencimento.
- **Menor de idade** exige **responsável** (CPF/e‑mail/telefone). fileciteturn1file4L32-L36
- Validações: idade mínima/máxima da turma; capacidade da turma; conflito de horários de sala.
- Pode haver **taxa de matrícula** (opcional). Ciclo de cobrança é criado ao concluir matrícula.
- (Pós‑MVP) Integração **Asaas**: criar **cliente** e **assinatura**; ciclo mensal por padrão; webhooks para atualizar status. fileciteturn1file4L46-L49

### 3.2 Planos (periodicidades e combos)
- Planos **genéricos** (definem frequência/valor); **modalidade** vem da **turma**.
- Periodicidades ativas: **Mensal, Quinzenal, Semanal, Trimestral, Anual**.
- Suporte a **combos** de turmas para agilizar matrícula. fileciteturn1file0L26-L31

### 3.3 Cobranças e Pagamentos
- Cobranças: **recorrentes** (plano) e **avulsas** (eventos/loja).
- Formas: Dinheiro, Cartão, PIX, Boleto (manual no MVP; automatizável via Asaas no pós‑MVP). fileciteturn1file0L46-L49
- Regras de atraso: marcar pendência; aplicar **multa/juros** configuráveis; lembretes (e‑mail/WhatsApp).
- Cancelamento/estorno: reservado a Administrador; logs obrigatórios.

### 3.4 Presenças
- Professor ou recepção marca **Presente / Falta / Atraso** + observação opcional.
- 1 registro por aluno/turma/data; bloqueio de presença em **feriados**.

### 3.5 Turmas e Salas
- Turma **vinculada a uma sala**; a **mesma sala pode ter várias turmas** desde que **sem sobreposição de horários**.
- Turma possui modalidade, dias/horário, professores, capacidade e faixas etárias.
- Validação automática de **conflitos de agenda**.

### 3.6 Eventos (internos e pagos)
- Cadastro pela recepção/gestão. Campos: nome, descrição, data/horário, local (sala ou externo), capacidade, tipo (apresentação/workshop etc.), público‑alvo (interno/aberto).
- **Tipos de ingresso** por evento (inteira, meia, VIP, lotes etc.).
- **Inscrições/Vendas**: podem vincular aluno/responsável ou participante externo; controle de vagas; status (reservado/pago/cancelado).
- **Cobranças específicas** do evento (independentes do plano).
- **Check‑in** no dia (lista/QR Code) e relatórios (arrecadação, inscritos, comparecimento).

### 3.7 Loja (produtos/estoque/vendas)
- Produtos: nome, descrição, categoria, tamanho, cor, preço, custo (opcional), **estoque atual** e **estoque mínimo** (alerta).
- Movimentação de estoque: **entrada/saída/ajuste** com motivo.
- Vendas: itens vendidos, forma de pagamento, vínculo opcional a aluno/responsável; baixa automática do estoque.
- Relatórios: estoque atual/baixo, vendas por período, itens mais vendidos e margem (se custo cadastrado).

### 3.8 Feriados/Calendário
- **Feriados nacionais automáticos**; escola pode cadastrar **feriados locais** e **recessos**.
- Feriados **bloqueiam aulas/eventos**; presença não pode ser lançada nessas datas.

### 3.9 Segurança e LGPD
- Mínimo privilégio por perfil; criptografia de senhas/sessões; cookies HttpOnly/SameSite; validações (CPF/CNPJ, e‑mail, senha forte). Logs de auditoria e métricas básicas. fileciteturn1file3L41-L47

---

## 4) Modelo de Dados (Relacional)

> Banco alvo: **PostgreSQL**; ORM: **Prisma**; monorepo com Next.js App Router. fileciteturn1file3L13-L19

### 4.1 Entidades principais (tabelas)
- **conta**: dados da escola (nome_escola, cpf_cnpj, contato, endereço, logo, status, datas).
- **usuario**: (id_conta, nome, email, telefone, senha_hash, foto, status).
- **perfil**: (nome, descricao, permissoes_json).
- **usuario_perfil**: (id_usuario, id_perfil) — permite perfis personalizados.
- **aluno**: (id_conta, dados pessoais/contato/endereço, observacoes, status).
- **responsavel**: (dados pessoais/contato/endereço, indicativo_financeiro).
- **aluno_responsavel**: (id_aluno, id_responsavel, tipo_vinculo).
- **colaborador**: (id_conta, dados pessoais/contato, cargo, status) — professores e equipe.
- **modalidade**: (id_conta, nome, descricao, status).
- **sala**: (id_conta, nome, descricao, capacidade, status).
- **turma**: (id_conta, nome, id_modalidade, id_sala, dias_semana[], hora_inicio, hora_fim, idade_min/max, capacidade_max, status, observacoes).
- **turma_professor**: (id_turma, id_colaborador).
- **matricula**: (id_aluno, id_turma, id_plano, data_inicio, data_fim, status).
- **plano**: (id_conta, nome, descricao, periodicidade, valor, vencimento_padrao, status).
- **presenca**: (id_aluno, id_turma, data_aula, status, observacao).
- **feriado**: (id_conta, nome, tipo, data_inicio, data_fim, descricao, status).
- **fornecedor**: (id_conta, nome, tipo_servico, contato, endereco, status).

#### Eventos (pagos)
- **evento**: (id_conta, nome, descricao, data_inicio/fim, local, capacidade_max, tipo, publico_alvo, status).
- **evento_turma**: (id_evento, id_turma) — evento pode envolver várias turmas.
- **tipo_ingresso**: (id_evento, nome, valor, quantidade_disponivel).
- **inscricao_evento**: (id_evento, id_tipo_ingresso, id_aluno?, id_responsavel?, participante_externo?, quantidade, valor_total, status, data_registro).
- **pagamento_evento**: (id_inscricao, forma_pagamento, valor_pago, status, data_pagamento, comprovante?).

#### Loja
- **produto**: (id_conta, nome, descricao, categoria, tamanho, cor, preco_venda, custo?, estoque_atual, estoque_minimo, status).
- **mov_estoque**: (id_produto, tipo, quantidade, data, observacao, origem? [compra/venda/ajuste]).
- **venda**: (id_conta, id_usuario_registro, id_responsavel?, id_aluno?, data, valor_total, forma_pagamento, status).
- **venda_item**: (id_venda, id_produto, quantidade, preco_unitario, subtotal).

#### Financeiro (planos)
- **cobranca**: (id_matricula, competencia_inicio/fim, valor, vencimento, status, multa?, juros?, tipo: recorrente/avulsa).
- **pagamento**: (id_cobranca, data_pagamento, forma_pagamento, valor_pago, status, comprovante?).

#### Autenticação/Segurança
- **invite** (convites), **password_reset**, **session**, **login_social**, **two_factor** — conforme regras da Seção 2.

### 4.2 Índices e constraints
- Unicidade: email em **usuario**; (id_aluno, id_turma, data_aula) em **presenca**; (id_turma, dia_semana, hora_inicio/hora_fim) com verificação anti‑sobreposição (regra de negócio na camada de aplicação).
- FK obrigatórias: matrícula liga **aluno + turma + plano**; presença liga **aluno + turma**.
- Soft‑delete via **status** (ativo/inativo) para entidades sensíveis (evitar perda de histórico).
- Campos monetários com **numeric(12,2)**; datas/timestamps em UTC.

### 4.3 Validações de dados
- CPF/CNPJ (máscaras e sintaxe); CEP com auto‑preenchimento; telefones BR; senha forte. fileciteturn1file3L41-L46
- Idade (data de nascimento coerente); obrigatório responsável se < 18 anos. fileciteturn1file4L32-L36
- Capacidade de turma (não exceder) e idade_min/max.
- Feriados bloqueiam geração de presença no dia.

---

## 5) Fluxos Operacionais

### 5.1 Fluxo de Matrícula
1) Recepção escolhe aluno (ou cadastra), turma e plano → valida idade/capacidade.  
2) Define vencimento e (se houver) **taxa de matrícula**.  
3) Gera **cobrança inicial** (recorrência conforme periodicidade).  
4) (Pós‑MVP) Cria **cliente/assinatura** no Asaas e configura webhooks; faturas atualizam status por evento. fileciteturn1file0L46-L49

### 5.2 Fluxo de Presença (Professor)
1) Abre turma do dia; 2) marca Presente/Falta/Atraso; 3) adiciona observações; 4) salva.  
Feriados/bloqueios impedem lançamento.

### 5.3 Fluxo de Eventos Pagos
- Criar evento → definir tipos de ingresso → registrar inscrições/vendas → registrar pagamentos → realizar check‑in no dia → emitir relatórios.

### 5.4 Fluxo da Loja
- Cadastrar produto e estoque inicial → vendas dão baixa automática → entradas por compra/ajuste repõem → relatórios.

---

## 6) Segurança, Observabilidade e Qualidade

- **LGPD**: consentimento, mínimo privilégio, segregação por perfil, política de privacidade para menores. fileciteturn1file1L16-L16  
- **Criptografia** de senhas/sessões; cookies `HttpOnly/SameSite`; validações robustas; uploads limitados e inspecionados. fileciteturn1file3L41-L47  
- **Logs de auditoria** (quem mudou o quê) e métricas de uso (erros, latência). fileciteturn1file3L47-L47  
- **Testes**: unidade/integrados (Vitest), E2E (Playwright), CI/CD (GitHub Actions). fileciteturn1file1L5-L8

---

## 7) Stack Técnica e Arquitetura

- **Monorepo**: pnpm workspaces + Turborepo; packages para UI/config/lib; pasta `prisma/` com schema/migrations/seed. fileciteturn1file3L13-L36  
- **Web**: Next.js (App Router, RSC), React; UX com skeletons, toasts, tabelas/gráficos, formulários com máscaras, validação RHF/Zod, auto‑CEP. fileciteturn1file3L1-L5  
- **Banco**: PostgreSQL; **ORM**: Prisma. fileciteturn1file3L15-L16  
- **Hospedagem**: Vercel (web) + banco gerenciado (Railway/Supabase/RDS). fileciteturn1file3L18-L20  
- **Autenticação**: NextAuth v4 (estável) com *feature flag* para futura migração para Auth.js v5. fileciteturn1file3L17-L17

---

## 8) Roadmap (extraído e adaptado do Documento Único)

**MVP**  
- Cadastros (alunos, responsáveis, professores, turmas, planos, combos), wizard de matrícula, presenças, eventos simples, papéis definidos, máscaras/validações/CEP, uploads simples, listagens e gráficos básicos, toasts, **pré‑estrutura Asaas** (sem chaves). fileciteturn1file3L51-L61

**Pós‑MVP (prioridade 1)**  
- Integração **Asaas** (assinaturas + webhooks); relatórios financeiros (inadimplência); exportações. fileciteturn1file1L6-L6

**Riscos & Mitigações**  
- Mudanças na API Asaas → camada de integração isolada; testes de contrato.  
- Combos complexos → manter regras simples no MVP.  
- Dados sensíveis de menores → reforçar consentimento e perfis.  
- Escala → monorepo + Vercel; preparar containers quando crescer. fileciteturn1file1L12-L17

**Critérios de Sucesso**  
- Operar sem planilha; matrícula ≤ 4 min; financeiro com status sincronizado (pós‑MVP Asaas); retenção ≥ 80% após 7 dias grátis. fileciteturn1file1L21-L26

---

## 9) Anexos rápidos
- Referências de versão/stack: Node 22 LTS, Next 15.1 + React 19, Tailwind 4 + shadcn v4, Prisma 6.14. fileciteturn1file1L30-L38
- Asaas — assinaturas, webhooks e eventos (pós‑MVP). fileciteturn1file1L36-L38

---

### Observação Final
Este documento consolida **todos os cadastros, regras de negócio, fluxos e modelo de dados** acordados nesta conversa, alinhados ao **Documento Único** do projeto Alusa (Escopo + PRD + Boas Práticas + Stack). Onde indicado, as integrações financeiras e automações (ex.: Asaas) são **pós‑MVP**, já refletidas no desenho do banco para evolução incremental.


## Apêndice C — Conteúdo Integral “Paleta Visual - Alusa.md”


# Paleta de Cores Web -Alusa

## 1) Paleta da marca (Violeta)

- 50 → `#FAF5FF`
- 100 → `#F3E7FF`
- 200 → `#E9D3FF`
- 300 → `#D8B0FF`
- 400 → `#C17EFF`
- 500 → `#A94DFF`
- 600 → `#942AF3` (tom principal para ações)
- 700 → `#801AD6`
- 800 → `#6D1AAF`
- 900 → `#5A178C`
- 950 → `#3C0269`

## 1.1) Complementos de marca (derivados)

- **brand.deep / sidebar.bg** → `#2A004A` (fundo do sidebar)

## 2) Neutros frios (UI)

- 0 → `#FFFFFF`
- 50 → `#F8FAFC`
- 100 → `#F1F5F9`
- 200 → `#E2E8F0`
- 300 → `#CBD5E1`
- 400 → `#94A3B8`
- 500 → `#64748B`
- 600 → `#475569`
- 700 → `#334155`
- 800 → `#1E293B`
- 900 → `#0F172A`
- 950 → `#020617`
- 1000 → `#000000`

## 3) Acentos funcionais (Estados)

- **Info** → bg `#FAF5FF`, fg `#801AD6`, borda `#D8B0FF`
- **Success** → bg `#E7F7EE`, fg `#1B7A49`, borda `#B9E7CF`
- **Warning** → bg `#FFF7E6`, fg `#8A5A00`, borda `#FFE4B5`
- **Danger** → bg `#FDECEE`, fg `#8E1A2B`, borda `#F7C0C7`

## 4) Opacidades & Gradientes

- **Opacidades**
  - brand/600 @ 8% → `rgba(148,42,243,0.08)`
  - brand/600 @ 12% → `rgba(148,42,243,0.12)`
  - brand/600 @ 16% → `rgba(148,42,243,0.16)`
  - brand/950 @ 70% → `rgba(60,2,105,0.70)` (overlay)
- **Gradientes**
  - Hero → `#A94DFF → #801AD6`
  - Alternativo → `#C17EFF → #5A178C`

## 5) Mapa semântico — Light (tokens → valor)

- **Fundo/Surface**
  - bg.canvas → `#FFFFFF`
  - bg.subtle → brand 50
  - bg.muted → neutro 50
  - surface → `#FFFFFF`
  - surface.alt → neutro 50
  - surface.tinted → brand 50
- **Texto/Ícones**
  - text.primary → neutro 900
  - text.secondary → neutro 600
  - text.tertiary → neutro 500
  - text.inverse → `#FFFFFF`
  - text.brand → brand 700
  - icon.default → neutro 600
- **Bordas/Sombra**
  - border.default → neutro 200
  - border.strong → neutro 300
  - border.brand → brand 300
  - shadow\.tint → brand 950 @ 6%
- **Interações**
  - link.default → brand 700
  - link.hover → brand 800
  - focus.ring → brand 500
  - selection.bg → brand 200

## 6) Mapa semântico — Dark (tokens → valor)

- **Fundo/Surface**
  - bg.canvas → neutro 950
  - bg.subtle → brand 950
  - bg.muted → neutro 900
  - surface → neutro 900
  - surface.alt → neutro 800
  - surface.tinted → brand 900
- **Texto/Ícones**
  - text.primary → `#FFFFFF`
  - text.secondary → neutro 300
  - text.tertiary → neutro 400
  - text.inverse → neutro 900
  - text.brand → brand 200
  - icon.default → neutro 300
- **Bordas/Sombra**
  - border.default → neutro 800
  - border.strong → neutro 700
  - border.brand → brand 800
  - shadow\.tint → `#000000` @ 32%
- **Interações**
  - link.default → brand 300
  - link.hover → brand 200
  - focus.ring → brand 400
  - selection.bg → brand 800

## 7) Componentes & estados (Light; no Dark aplicar os equivalentes do mapa)

- **Botão Primário** → bg brand 600; hover brand 700; active brand 800; fg `#FFFFFF`; borda none
- **Botão Secundário (tinted)** → bg brand 50; hover brand 100; fg brand 700; borda brand 200
- **Botão Fantasma** → bg transparente; hover.bg neutro 50; fg brand 700; borda none
- **Botão Destrutivo** → bg danger.fg; hover escurecer \~8%; fg `#FFFFFF`; borda none
- **Inputs (text/select/textarea)** → bg `#FFFFFF`; fg neutro 900; placeholder neutro 500; borda neutro 200; hover neutro 300; focus focus.ring; inválido borda danger.fg; helper/emergência fg danger.fg
- **Checkbox/Switch/Radio** → ON brand 600; OFF neutro 300; indicador `#FFFFFF`; focus focus.ring
- **Badge/Tag (brand)** → bg brand 100; fg brand 700; borda brand 200
- **Tabela** → header neutro 700; linha.hover neutro 50; linha.selecionada brand 50; divider neutro 200; zebra (opcional) neutro 50 / `#FFFFFF`
- **Lista/Item (Sidebar)** → default.bg transparente; default.fg `#FFFFFF`; hover.bg `#5A178C` (brand 900); hover.fg `#FFFFFF`; active.bg `#A94DFF` (brand 500); active.fg `#000000` (AA) _(alternativa: `#FFFFFF` se o tamanho do texto ≥ 18px/semibold)_; borda none
- **Card** → card.bg surface; card.borda neutro 200 (ou none); card.shadow shadow\.tint
- **Toast/Alert** → usar os pares de *Acentos funcionais*
- **Overlay/Modal** → backdrop brand 950 @ 70%; surface surface; ícone/close neutro 400 (hover neutro 300)
- **Link em texto** → default link.default; hover link.hover; visited brand 800
- **Gráficos (acentos)** → série 1 brand 600; série 2 brand 400; fill discreto brand 200; stroke brand 700; seleção brand 600 @ 16%

### Sidebar (Navegação) — tokens específicos
- sidebar.bg → `#2A004A`
- sidebar.logo → `#5A178C` (brand 900)
- sidebar.text.default → `#FFFFFF`
- sidebar.icon.default → `#FFFFFF`
- sidebar.item.hover.bg → `#5A178C` (brand 900)
- sidebar.item.hover.fg → `#FFFFFF`
- sidebar.item.active.bg → `#A94DFF` (brand 500)
- sidebar.item.active.fg → `#000000` (AA) _(alternativa: `#FFFFFF` se o tamanho do texto ≥ 18px/semibold)_
- sidebar.item.focus.ring → brand 400

## 8) Acessibilidade (contraste e uso)

- Texto normal ≥ 4.5:1; brand 700 sobre branco atende; em dark, texto branco sobre neutro 800/900
- Botão primário sempre com fg `#FFFFFF`
- Mensagens de erro/alerta usam a cor `fg` do estado (nunca neutro para conteúdo crítico)

## 9) Tipografia — famílias

- UI/Texto → **Inter**
- Display (opcional) → **Inter Tight**
- Mono (código/dados) → **Google Sans Code**

## 10) Tipografia — aplicações (SaaS)

- **Display/Hero** → 60/68–72/80; peso 600–700; família Inter Tight
- **Headings**
  - H1 → 36/44; 600; Inter
  - H2 → 30/38; 600; Inter
  - H3 → 24/32; 600; Inter
  - H4 → 20/28; 600; Inter
  - H5 → 18/28; 600; Inter
  - H6 → 16/24; 600; Inter
- **Subtítulos**
  - subtitle-lg → 18/28; 500; Inter
  - subtitle-sm → 16/24; 500; Inter
- **Corpo de texto**
  - body-md (padrão) → 16/24; 400; Inter
  - body-sm (denso/tabelas) → 14/20; 400; Inter
  - body-lg (leads) → 18/28; 400; Inter
- **UI & Navegação**
  - nav item (sidebar/topbar) → 14/20; 600; Inter
  - breadcrumb/overline → 12/16; 600; Inter (uppercase opcional)
  - botões (sm/md/lg) → 12/16 · 14/20 · 16/24; 600; Inter
  - labels de formulário (sm/lg) → 12/16 · 14/20; 500; Inter
  - helper/error text → 12/16; 400/500; Inter
  - tooltip/badge → 11–12/14–16; 500–600; Inter
  - tabela header → 12/16; 600; Inter
  - tabela célula → 14/20; 400; Inter
- **Código/Dados**
  - code → 13/20; 500; Google Sans Code
  - code-sm → 12/18; 500; Google Sans Code
  - KPIs/Números → ativar numerais tabulares (alinhamento)

## 11) Observações finais

- O tom de ação recomendado é brand 600; em hover/active progredir para 700/800
- Em dark mode, manter a hierarquia invertendo os pares de texto/surface/bordas conforme os mapas semânticos acima



## Apêndice D — Conteúdo Integral “Documento Funcional Consolidado”


# Alusa — Documento Funcional Consolidado (MVP 2025)

**Versão:** 1.0 · **Data:** 22/ago/2025 · **Escopo:** consolidar tudo que foi **definido e fechado** para o MVP funcional da plataforma Alusa, coerente com os documentos anexados e com os ajustes decididos nesta conversa.

---

## Sumário
1. Visão, Contexto e Metas  
2. Escopo Funcional Consolidado (MVP)  
3. Perfis de Acesso (RBAC)  
4. Regras de Negócio  
5. Modelo de Dados (Prisma/PostgreSQL)  
6. Integração Asaas (MVP — Sandbox)  
7. LGPD, Segurança e Observabilidade  
8. UX/UI e Identidade Visual  
9. Stack Técnica, Arquitetura e Ambientes  
10. Testes e Qualidade  
11. Roadmap (MVP → Produção)  
12. Critérios de Aceite do MVP  
13. Anexos

---

## 1) Visão, Contexto e Metas

**Visão:** SaaS para **gestão de escolas de dança** (ballet, jazz, hip-hop, valsa etc.), cobrindo cadastros, matrículas, presenças, eventos pagos, financeiro e loja — com acesso segmentado por perfil.  
**Plataforma:** web responsiva (mobile-first), sem app nativo no MVP.  
**Público-alvo:** gestores, recepção, financeiro, professores e responsáveis/alunos.

**Metas do MVP** (após go-live):  
- 10 escolas ativas,  
- fluxo de matrícula ≤ 4 min,  
- redução de 50% em erros de cadastro,  
- NPS ≥ 8/10 (recepção/gestão).

---

## 2) Escopo Funcional Consolidado (MVP)

### 2.1 Cadastros e módulos
- Cadastros: alunos, responsáveis, colaboradores/professores, turmas, salas, planos, **combos**, modalidades, eventos, presenças, produtos/estoque e financeiro (cobranças/pagamentos).
- **Combos de turmas:** modelados no banco (tabelas `Combo` e `ComboTurma`) e selecionáveis no wizard de matrícula (**MVP**).
- **Taxa de matrícula e descontos:** **inclusos no MVP** — `Matricula.taxaMatricula` opcional e `Desconto`/`DescontoMatricula` (fixo ou percentual).
- **Integração Asaas no MVP (sandbox):** assinatura + pagamentos, com **todos os webhooks relevantes** (Seção 6).
- **Uploads:** armazenamento **local** no MVP (limite 5 MB; tipos JPG/PNG/PDF). Interface preparada para migração futura a S3/Cloudinary.
- **Notificações:** **internas (UI)** no MVP; e-mail/WhatsApp ficam para etapas posteriores.
- **Eventos pagos:** inscrições com tipos de ingresso, cobrança própria e **check-in por QR individual por participante** (MVP).
- **Presenças:** estados **Presente/Falta/Atraso**; no MVP, **Atraso conta como Presente** em frequência oficial (flag mantida para análise).
- **Relatórios (MVP):**  
  a) Alunos ativos; b) Frequência por turma (com atraso); c) Cobranças/receitas básicas (status Asaas); d) Vendas de eventos.

---

## 3) Perfis de Acesso (RBAC)

- **Administrador (Master):** acesso total.  
- **Financeiro:** cobranças, conciliações e relatórios financeiros; sem editar turmas/alunos.  
- **Recepção:** cadastros, **matrículas**, presenças e eventos; sem relatórios financeiros.  
- **Professor:** turmas próprias, lista de alunos e presenças; sem finanças/dados sensíveis.  
- **Responsável/Aluno (portal):** ver matrículas, faturas, eventos e dados pessoais.  
- **Restrito (visualização):** leitura básica de alunos, turmas e calendário; **sem** financeiro e **sem** edição (**MVP**).

---

## 4) Regras de Negócio

### 4.1 Matrícula
- Feita na recepção; validar idade mínima/máxima, capacidade e conflitos de sala/horário.
- Menor de 18 anos exige **responsável** com CPF/e-mail/telefone; responsável é o titular financeiro.
- **Taxa de matrícula** opcional; **descontos** aplicáveis na matrícula (fixo/%), e no plano (MVP).
- Ao concluir: criar **cliente** (quando necessário) e **assinatura Asaas (sandbox)** com `externalReference = matricula.id`; webhooks sincronizam status (Seção 6).

### 4.2 Planos e Combos
- Planos definem periodicidade e valor; modalidade vem da turma.
- Periodicidades ativas: Mensal, Quinzenal, Semanal, Trimestral, Anual.
- **Combos** persistidos no banco, para seleção rápida no wizard.

### 4.3 Cobranças e Pagamentos
- Tipos: **recorrentes** (plano) e **avulsas** (eventos/loja).
- Formas aceitas no MVP: dinheiro, **cartão**, **PIX**, **boleto (manual)**; Asaas amplia opções quando em produção.
- Regras de atraso: marcar pendência; multa/juros configuráveis; **notificações internas** (UI).

### 4.4 Presenças
- Professor/recepção marca Presente/Falta/Atraso + observação; 1 registro por aluno/turma/data.
- **Feriados** bloqueiam presença; escola pode cadastrar feriados locais/recessos.

### 4.5 Eventos pagos
- Evento com tipos de ingresso, inscrições (aluno/responsável/externo), pagamentos, **check-in por QR individual** e relatórios simples.

### 4.6 Loja
- Produtos, estoque mínimo e movimentações; vendas com baixa de estoque e formas de pagamento conforme 4.3.

---

## 5) Modelo de Dados (Prisma/PostgreSQL)

**Observações chave**
- Campos monetários `numeric(12,2)`; datas/timestamps em UTC; soft-delete via `status`.
- Unicidades: e-mail de usuário; **presença** (aluno+turma+data); `asaasId` único em cliente/assinatura/cobrança.
- **IDs externos Asaas**:  
  - `Aluno.asaasId` / `Responsavel.asaasId` (customer),  
  - `Matricula.asaasId` (subscription),  
  - `Cobranca.asaasId` (payment).

### 5.1 Schema Prisma (com decisões MVP)

```prisma
// ------------------------------------------------------
// Prisma Client + Postgres
// ------------------------------------------------------
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

// ------------------------------------------------------
// Conta & Usuários
// ------------------------------------------------------
model Conta {
  id        String   @id @default(cuid())
  nome      String
  cpfCnpj   String
  contato   String?
  endereco  String?
  logo      String?
  status    String   // ATIVO/INATIVO
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuarios  Usuario[]
  alunos    Aluno[]
  turmas    Turma[]
  planos    Plano[]
  combos    Combo[]
  eventos   Evento[]
  produtos  Produto[]
}

model Usuario {
  id        String   @id @default(cuid())
  contaId   String
  nome      String
  email     String   @unique
  telefone  String?
  senhaHash String
  foto      String?
  status    String   // ATIVO/INATIVO
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  conta   Conta           @relation(fields: [contaId], references: [id])
  perfis  UsuarioPerfil[]
}

model Perfil {
  id         String   @id @default(cuid())
  nome       String
  descricao  String?
  permissoes Json
  usuarios   UsuarioPerfil[]
}

model UsuarioPerfil {
  id        String  @id @default(cuid())
  usuarioId String
  perfilId  String

  usuario Usuario @relation(fields: [usuarioId], references: [id])
  perfil  Perfil  @relation(fields: [perfilId], references: [id])
}

// ------------------------------------------------------
// Alunos & Responsáveis
// ------------------------------------------------------
model Aluno {
  id           String   @id @default(cuid())
  contaId      String
  nome         String
  dataNasc     DateTime
  email        String?
  telefone     String?
  endereco     String?
  observacao   String?
  status       String   // ATIVO/INATIVO
  asaasId      String?  @unique
  createdAt    DateTime @default(now())

  conta        Conta       @relation(fields: [contaId], references: [id])
  responsaveis AlunoResponsavel[]
  matriculas   Matricula[]
  presencas    Presenca[]
}

model Responsavel {
  id         String  @id @default(cuid())
  nome       String
  cpf        String
  email      String
  telefone   String
  endereco   String?
  financeiro Boolean @default(false)
  asaasId    String? @unique

  alunos     AlunoResponsavel[]
}

model AlunoResponsavel {
  id            String @id @default(cuid())
  alunoId       String
  responsavelId String
  tipoVinculo   String

  aluno       Aluno       @relation(fields: [alunoId], references: [id])
  responsavel Responsavel @relation(fields: [responsavelId], references: [id])
}

// ------------------------------------------------------
// Modalidade, Sala, Turma
// ------------------------------------------------------
model Modalidade {
  id        String  @id @default(cuid())
  contaId   String
  nome      String
  descricao String?
  status    String

  conta  Conta  @relation(fields: [contaId], references: [id])
  turmas Turma[]
}

model Sala {
  id         String  @id @default(cuid())
  contaId    String
  nome       String
  descricao  String?
  capacidade Int
  status     String

  conta  Conta  @relation(fields: [contaId], references: [id])
  turmas Turma[]
}

model Turma {
  id           String   @id @default(cuid())
  contaId      String
  nome         String
  modalidadeId String
  salaId       String
  diasSemana   String[] // [SEG, QUA, SEX]
  horaInicio   String
  horaFim      String
  idadeMin     Int?
  idadeMax     Int?
  capacidade   Int
  status       String
  observacao   String?

  conta      Conta      @relation(fields: [contaId], references: [id])
  modalidade Modalidade @relation(fields: [modalidadeId], references: [id])
  sala       Sala       @relation(fields: [salaId], references: [id])

  professores TurmaProfessor[]
  matriculas  Matricula[]
  presencas   Presenca[]
  combos      ComboTurma[]
}

model TurmaProfessor {
  id        String @id @default(cuid())
  turmaId   String
  usuarioId String
  turma     Turma   @relation(fields: [turmaId], references: [id])
  usuario   Usuario @relation(fields: [usuarioId], references: [id])
}

// ------------------------------------------------------
// Planos, Matrículas, Descontos
// ------------------------------------------------------
model Plano {
  id               String   @id @default(cuid())
  contaId          String
  nome             String
  descricao        String?
  periodicidade    String   // MENSAL/TRIMESTRAL/...
  valor            Decimal  @db.Numeric(12, 2)
  vencimentoPadrao Int
  status           String

  conta      Conta       @relation(fields: [contaId], references: [id])
  matriculas Matricula[]
}

model Matricula {
  id            String   @id @default(cuid())
  alunoId       String
  turmaId       String
  planoId       String
  dataInicio    DateTime
  dataFim       DateTime?
  status        String         // ATIVA/CANCELADA/CONCLUIDA
  taxaMatricula Decimal? @db.Numeric(12, 2)
  asaasId       String?  @unique // subscription
  descontos     DescontoMatricula[]
  cobrancas     Cobranca[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  aluno Aluno @relation(fields: [alunoId], references: [id])
  turma Turma @relation(fields: [turmaId], references: [id])
  plano Plano @relation(fields: [planoId], references: [id])
}

model Desconto {
  id        String   @id @default(cuid())
  nome      String
  tipo      String   // FIXO/PERCENTUAL
  valor     Decimal  @db.Numeric(12, 2) // se PERCENTUAL: 0–100
  escopo    String   // MATRICULA/PLANO/EVENTO
  status    String   // ATIVO/INATIVO
  createdAt DateTime @default(now())
}

model DescontoMatricula {
  id          String   @id @default(cuid())
  matriculaId String
  descontoId  String
  valorFinal  Decimal  @db.Numeric(12, 2)
  matricula   Matricula @relation(fields: [matriculaId], references: [id])
  desconto    Desconto  @relation(fields: [descontoId], references: [id])
}

// ------------------------------------------------------
// Combos
// ------------------------------------------------------
model Combo {
  id        String  @id @default(cuid())
  contaId   String
  nome      String
  descricao String?
  status    String
  conta     Conta       @relation(fields: [contaId], references: [id])
  turmas    ComboTurma[]
}

model ComboTurma {
  id      String @id @default(cuid())
  comboId String
  turmaId String
  combo   Combo @relation(fields: [comboId], references: [id])
  turma   Turma @relation(fields: [turmaId], references: [id])
}

// ------------------------------------------------------
// Presenças
// ------------------------------------------------------
model Presenca {
  id         String   @id @default(cuid())
  alunoId    String
  turmaId    String
  dataAula   DateTime
  status     String   // PRESENTE/FALTA/ATRASO
  observacao String?
  aluno      Aluno @relation(fields: [alunoId], references: [id])
  turma      Turma @relation(fields: [turmaId], references: [id])

  @@unique([alunoId, turmaId, dataAula])
}

// ------------------------------------------------------
// Eventos pagos
// ------------------------------------------------------
model Evento {
  id          String   @id @default(cuid())
  contaId     String
  nome        String
  descricao   String?
  dataInicio  DateTime
  dataFim     DateTime?
  local       String
  capacidade  Int?
  tipo        String
  publicoAlvo String
  status      String
  conta       Conta         @relation(fields: [contaId], references: [id])
  turmas      EventoTurma[]
  ingressos   TipoIngresso[]
  inscricoes  InscricaoEvento[]
}

model EventoTurma {
  id       String @id @default(cuid())
  eventoId String
  turmaId  String
  evento   Evento @relation(fields: [eventoId], references: [id])
  turma    Turma  @relation(fields: [turmaId], references: [id])
}

model TipoIngresso {
  id            String   @id @default(cuid())
  eventoId      String
  nome          String
  valor         Decimal  @db.Numeric(12, 2)
  qtdDisponivel Int
  evento        Evento @relation(fields: [eventoId], references: [id])
}

model InscricaoEvento {
  id             String   @id @default(cuid())
  eventoId       String
  tipoIngressoId String
  alunoId        String?
  responsavelId  String?
  externo        Boolean  @default(false)
  quantidade     Int
  valorTotal     Decimal  @db.Numeric(12, 2)
  status         String
  dataReg        DateTime @default(now())
  evento         Evento       @relation(fields: [eventoId], references: [id])
  tipoIngresso   TipoIngresso @relation(fields: [tipoIngressoId], references: [id])
  pagamentos     PagamentoEvento[]
}

model PagamentoEvento {
  id            String   @id @default(cuid())
  inscricaoId   String
  formaPagamento String
  valorPago     Decimal  @db.Numeric(12, 2)
  status        String
  dataPagamento DateTime
  comprovante   String?
  inscricao     InscricaoEvento @relation(fields: [inscricaoId], references: [id])
}

// ------------------------------------------------------
// Financeiro (Planos / Asaas)
// ------------------------------------------------------
model Cobranca {
  id                String   @id @default(cuid())
  matriculaId       String
  competenciaInicio DateTime
  competenciaFim    DateTime
  valor             Decimal  @db.Numeric(12, 2)
  vencimento        DateTime
  status            String   // PENDENTE/PAGO/ATRASADO/CANCELADO/ESTORNADO
  multa             Decimal? @db.Numeric(12, 2)
  juros             Decimal? @db.Numeric(12, 2)
  tipo              String   // RECORRENTE/AVULSA
  asaasId           String?  @unique
  matricula         Matricula @relation(fields: [matriculaId], references: [id])
  pagamentos        Pagamento[]
}

model Pagamento {
  id            String   @id @default(cuid())
  cobrancaId    String
  dataPagamento DateTime?
  formaPagamento String
  valorPago     Decimal  @db.Numeric(12, 2)
  status        String   // CONFIRMADO/ESTORNADO
  comprovante   String?
  cobranca      Cobranca @relation(fields: [cobrancaId], references: [id])
}

model WebhookAsaas {
  id           String   @id @default(cuid())
  contaId      String
  evento       String
  payload      Json
  recebidoEm   DateTime @default(now())
  processadoEm DateTime?
  status       String   // RECEBIDO/PROCESSADO/ERRO
  conta        Conta    @relation(fields: [contaId], references: [id])
}

// ------------------------------------------------------
// LGPD: Consentimento
// ------------------------------------------------------
model Consentimento {
  id          String   @id @default(cuid())
  usuarioId   String
  aceitoEm    DateTime @default(now())
  versaoTermo String
}
```

---

## 6) Integração Asaas (MVP — Sandbox)

### 6.1 Objetivo
Sincronizar clientes, assinaturas e cobranças **sem divergência** entre Alusa e Asaas.

### 6.2 Mapeamento de entidades
- `customer.id` → `Aluno.asaasId` ou `Responsavel.asaasId`  
- `subscription.id` → `Matricula.asaasId`  
- `payment.id` → `Cobranca.asaasId`  
- `payment.status` ↔ `Cobranca.status` (PENDENTE, PAGO, ATRASADO, CANCELADO, ESTORNADO)

### 6.3 Webhooks suportados (MVP)
**Pagamentos:** `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `PAYMENT_REFUNDED`  
**Assinaturas:** `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_DELETED`  
**Clientes:** `CUSTOMER_CREATED`, `CUSTOMER_UPDATED`, `CUSTOMER_DELETED`

### 6.4 Fluxo técnico
1) **Criação de cliente** ao finalizar matrícula (se menor, pelo responsável).  
2) **Criação de assinatura** (enviar `externalReference = matricula.id`).  
3) **Cobranças** (payments) geradas pela Asaas; o webhook **cria/atualiza** `Cobranca` e **insere/atualiza** `Pagamento`.  
4) **Idempotência**: `upsert` por `asaasId`; log bruto em `WebhookAsaas` (RECEBIDO → PROCESSADO/ERRO).  
5) **Segurança:** verificação de assinatura (header), fila/worker para reprocesso.

**Rota recomendada:** `POST /api/webhooks/asaas` (App Router).  
**Boas práticas:** armazenar JSON bruto antes de processar; usar retries; alarmes em caso de `ERRO`.

---

## 7) LGPD, Segurança e Observabilidade

- **LGPD:** mínimo privilégio por perfil; consentimento via checkbox e guarda em `Consentimento` com versão do termo; política diferenciada para menores.  
- **Segurança:** senhas com hash (bcrypt/argon2); cookies `HttpOnly/SameSite`; validações (CPF/CNPJ, e-mail, senha forte); limitação/inspeção de uploads.  
- **Logs e métricas:** logs de auditoria e métricas básicas (erros/latência).

---

## 8) UX/UI e Identidade Visual

- **Layout:** SPA feel (sidebar fixa, header com busca/ações), skeletons, toasts, tabelas e gráficos básicos; wizards em fluxos longos.  
- **Validações e máscaras:** React Hook Form + Zod; máscaras BR (CPF/CNPJ/CEP/telefone); auto-CEP.  
- **Identidade:** conforme paleta e tipografia definidas (Inter/Inter Tight).  
- **Acessibilidade:** contraste, foco de teclado, aria-labels.

---

## 9) Stack Técnica, Arquitetura e Ambientes

- **Monorepo:** pnpm workspaces + Turborepo; packages para UI/config/lib; `prisma/` com schema/migrations/seed.  
- **Web:** Next.js **15.1+** (App Router, RSC) + React **19**; Tailwind **4** + shadcn/ui v4; Recharts; TanStack Table.  
- **ORM/Banco:** Prisma **6.14+** em PostgreSQL.  
- **Autenticação:** NextAuth v4 (estável), com *feature flag* para v5 futura.  
- **Hospedagem:** Vercel (web) + banco gerenciado (Railway/Supabase/RDS).  
- **CI/CD:** GitHub Actions (build, lint, test, preview).

**Ambientes e variáveis (exemplos)**  
- `DATABASE_URL` (Postgres); `NEXTAUTH_SECRET`; `ASAAS_BASE_URL` (sandbox) e `ASAAS_API_KEY`; `ASAAS_WEBHOOK_SECRET`.  
- **Feature flags:** `FEATURE_ASAAS=true` (ativa handlers/rotas); `STORAGE_DRIVER=local|s3` (MVP = `local`).

---

## 10) Testes e Qualidade

- **Testes:** unitários/integrados (Vitest), E2E (Playwright), com pipelines em CI.  
- **Contratos:** handlers de webhook com testes de contrato nos payloads Asaas.  
- **Cobertura mínima:** 70% nas áreas críticas (matrícula, cobrança, webhook).

---

## 11) Roadmap (MVP → Produção)

- **MVP (agora):** tudo descrito neste documento, incluindo **Asaas em sandbox**, taxa/descontos, combos, relatórios básicos, check-in QR individual.  
- **Go-prod:** ativar chaves Asaas de produção; liberar notificações por e-mail (SMTP); preparar storage S3.  
- **Pós-MVP (prioridade 1):** relatórios financeiros avançados e exportações; WhatsApp Business; dashboards ampliados.

---

## 12) Critérios de Aceite do MVP

1) Fluxo de matrícula completo (com combos, taxa e desconto) em ≤ 4 min.  
2) Assinatura e cobranças sincronizadas via webhooks Asaas (sandbox), sem divergências de status.  
3) Presença funcionando com regra de **Atraso=Presente** nos relatórios.  
4) Check-in de evento por QR **individual**.  
5) Relatórios básicos entregues.  
6) Logs e consentimento LGPD registrados.

---

## 13) Anexos

- **ERD consolidado (PNG):** ![ERD Alusa](alusa_erd.png)  
  (Se a imagem não abrir no seu visualizador, utilize o arquivo `alusa_erd.png` fornecido junto deste .md.)


