---
applyTo: '**'
---
# 🛠️ Instruções de Refatoração — Projeto Alusa

## Objetivo
Refatorar código **sem alterar comportamento** ou **aparência visual**, salvo quando explicitamente solicitado.  
Foco em clareza, consistência e manutenibilidade.

## Regras
- Preservar contratos públicos, comportamento e UI existente.
- Melhorar nomes, extrair duplicações, dividir funções/componentes grandes.
- Substituir `any` por tipos corretos.
- Usar hooks/componentes reutilizáveis no React.
- Ajustar testes se necessário, nunca removê-los.

## Restrições
- Não adicionar novas features.
- Não incluir libs fora do stack.
- Não alterar autenticação (NextAuth) ou segurança.
- **Não alterar o design visual sem solicitação explícita.**

## Validação
Todo código refatorado deve passar:
```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e