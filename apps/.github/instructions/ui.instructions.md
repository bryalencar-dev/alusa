---
applyTo: '**'
---
# Instruções de UI — Projeto Alusa

## Regras
- Estilo: Tailwind + shadcn/ui.
- Ícones: Heroicons (em `apps/web/components/icons`).
- Formulários: React Hook Form + ZodResolver + `react-imask` (máscaras BR).
- Tratar estados: loading, erro, vazio.
- Acessibilidade: `aria-label`, `role`, foco visível.

## Preservar UI
- O visual atual deve ser **preservado** em refatorações ou ajustes.
- Alterações visuais só devem ser feitas quando **explicitamente solicitadas**.
- Refatorações devem focar em clareza, acessibilidade e manutenção, não em redesign.

## Restrições
- Não duplicar componentes → usar `packages/ui`.
- Não usar libs externas de ícones além do Heroicons.