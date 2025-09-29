---
applyTo: '**'
---

# GitHub Copilot — Instruções Customizadas para o Repositório Alusa

## 1. Visão Geral do Projeto
Este repositório (`alusa`) é um **monorepo** com:

- `apps/web/`: aplicação Next.js (App Router), autenticação, UI com Tailwind + shadcn/ui + Heroicons, testes unitários + E2E.  
- `packages/lib/`: lógica de domínio, serviços, validações com Zod, repositórios.  
- `packages/ui/`: componentes compartilhados de interface.  
- `prisma/`: schema Prisma centralizado, migrações versionadas, seeds.

Objetivo: manter consistência, reuso e alta qualidade de código. As fronteiras são bem definidas: apps consomem packages; packages **não** importam apps. Acesso a dados e modelos centralizados no `prisma/`.  

## 2. Stack e Tecnologias
- Frontend: Next.js (App Router) + React + TypeScript estrito  
- UI: Tailwind CSS + shadcn/ui + Heroicons  
- Autenticação: NextAuth v4 (credenciais + convite)  
- Validação: Zod + React Hook Form  
- Banco: PostgreSQL com Prisma ORM  
- Testes: Vitest para unit/integration; Playwright para E2E  
- Gerenciador de pacotes: pnpm  
- Scripts principais: dev/web, build, test:unit, test:e2e etc.

## 3. Padrões de Codificação e Boas Práticas
- Sempre gerar **migrations pequenas e compreensíveis** com nome descritivo (`prisma migrate dev --name <feature>`).  
- Utilizar `include` ou `select` no Prisma para evitar N+1 queries.  
- Todas as rotas de API devem ter validação de entrada via Zod.  
- Formulários no frontend devem usar React Hook Form + ZodResolver, e máscaras BR nos campos relevantes (CPF, Telefone, CEP).  
- UI consistente: componentes reutilizáveis em `packages/ui`, ícones via Heroicons, estilos em Tailwind/shadcn/ui.  
- Tratar estados de carregamento, erro e vazio na UI.  
- Usar `data-testid` onde faz sentido para facilitar E2E estável.  

## 4. Testes e Validação
- Para cada nova feature: escrever testes unitários **e** testes E2E.  
- Testes unitários com Vitest (não subir servidor Next.js nesses testes).  
- Testes E2E com Playwright: usar seletores estáveis (`data-testid`, `role`, `text`), evitar dependência de layout variável.  
- Cobertura de testes mínima esperada para código crítico (auth, onboarding, etc.).  

## 5. Fluxos de Desenvolvimento
- Uso dos scripts no `package.json` raiz para levantar ambiente: `pnpm dev:web`, `pnpm test:unit`, `pnpm test:e2e` etc.  
- Não abrir pastas desnecessárias no VS Code, evitar watchers excessivos.  
- Aceleração de render via GPU (já configurado), plano de energia em desempenho, pagefile fixo etc.

## 6. Expectativas de Saída do Copilot
Ao pedir algo ao Copilot, esperamos que o código gerado:

- Respeite a arquitetura do monorepo: UI → API → serviços → prisma  
- Inclua validações de entrada e saída onde aplicável  
- Inclua testes correspondentes (unitário ou E2E conforme a tarefa)  
- Use componentes UI compartilhados em lugar de repetir código  
- Siga estilos de codificação do TypeScript estrito, Tailwind + shadcn/ui  

## 7. Exemplos de Prompts Úteis
- “Gerar rota POST /api/users/invite validada com Zod, com expiração de token em 72h, com teste unitário Vitest.”  
- “Adicionar componente UI de botão customizado em packages/ui que aceita icon + loading state.”  
- “Teste E2E para fluxo de login no apps/web usando data-testid e verificando redirecionamento.”  

---

Se algo não estiver claro no prompt, o Copilot deve perguntar ou sugerir, não assumir.  
