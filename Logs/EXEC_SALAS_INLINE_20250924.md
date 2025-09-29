## Execução Inline Create Salas

Data: 2025-09-24

Passos:

1. Ajustado `SalaWizardDrawer` para suportar variante `inline` e título custom.
2. Inserido inline create de Sala em `StepDadosBasicos` do wizard de Turmas.
3. Recarregamento seletivo de salas e seleção automática da criada.
4. Acessibilidade: label associado ao select de Sala (`aria-labelledby`).
5. Evento `salas:changed` já emitido pelo drawer original reutilizado.
6. Adicionada opção no dropdown (+ Criar nova sala) e botão ao lado do label.
7. Rota POST `/api/salas` normaliza `capacidade` caso venha string; adicionada validação extra.
8. Teste unitário `salas.api.capacidade-string.test.ts` garante criação com `capacidade` string.

Pendências futuras sugeridas:

- Teste E2E específico (wizard Turma -> criar sala inline) e caso de duplicidade.
- Centralizar lógica de caches de lookups multi-entidade.

Assinado: automação.
