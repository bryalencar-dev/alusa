# Professores – Wizard e API

## Comandos rápidos

```bash
pnpm -w prisma migrate dev --name professores
pnpm -w lint && pnpm -w typecheck && pnpm -w build
pnpm -w test && pnpm -w playwright test -g "Professor Wizard"
```

## Notas
- O Wizard usa RHF + Zod com máscaras (react-imask) e auto-fill de CEP via cep-promise.
- A API usa Prisma e validações no POST/PUT; PUT bloqueia alteração de CPF/E-mail.
- Soft delete via status INATIVO (DELETE não suportado).
- Tabela na recepção: busca por `q`, colunas essenciais e integração com o Wizard.
