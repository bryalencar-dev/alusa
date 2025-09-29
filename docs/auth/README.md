# Autenticação e Convites

Este documento centraliza a estrutura do modelo de convite (Invite) e descreve os fluxos de registro e login em todas as situações suportadas pela aplicação web.

## Estrutura do Convite (Invite)

Campos principais do modelo `Invite` (Prisma):

- id: string (cuid) — identificador único
- contaId: string | null — conta do convidador no momento da criação; usada para multi-tenant no aceite
- email: string — e-mail do convidado (imutável no aceite)
- role: string — perfil concedido no aceite (nunca ADMIN via convite)
- token: string (unique) — usado para validar e aceitar o convite
- invitedById: string — usuário que gerou o convite
- status: string — padrão "PENDING"; ao aceitar, passa a "ACCEPTED"; outros estados possíveis: "REVOKED"/"EXPIRED"
- expiresAt: Date — controle de validade; convites expirados são inválidos
- createdAt / updatedAt: Date — timestamps

Índices relevantes:

- (email, status) — consultas por convite pendente
- (expiresAt) — limpeza/expiração
- (contaId) — relatórios multi-tenant

Relações:

- conta (opcional): referência à `Conta` via `contaId`. Mantido opcional para compatibilidade com convites legados.

Observações:

- O `contaId` é preenchido no momento da criação, copiando a conta do convidador. No aceite do convite, o novo usuário é criado dentro desta conta. Se ausente, o backend tenta um fallback consistente (ex.: conta do convidador) antes de falhar.
- O backend invalida o convite no aceite (mudando `status` para `ACCEPTED`) para impedir reuso.

## Fluxos de Registro e Login

### 1) Registro direto (sem token de convite)

- Rota de UI: `/auth/register`
- Comportamento: cria SEMPRE um usuário com perfil `ADMIN` (onboarding inicial).
- Validações: política de senha, e-mail único, CPF/CNPJ único (quando aplicável), tratamento de erro amigável.
- Pós-sucesso: autenticação automática (login) e redirecionamento para `/dashboard` (ou para `next`, se presente).
- API relacionada: `POST /api/users/first-register`.

### 2) Aceite de convite (com token)

- Entrada: `/auth/register?token=...`
- SSR valida convite:
  - Token precisa existir;
  - `status === 'PENDING'`;
  - `expiresAt` precisa estar no futuro.
  - Caso inválido/expirado/uso prévio: redireciona para `/auth/login?error=invalid_token`.
- Formulário de cadastro:
  - E-mail vem pré-preenchido e travado (somente leitura);
  - Perfil (role) é definido pelo convite e não é editável no front.
- Aceite:
  - API: `POST /api/users/accept`;
  - Cria o usuário na `contaId` do convite (multi-tenant);
  - Invalida o convite (status `ACCEPTED`), autentica automaticamente e redireciona para `/dashboard` (ou `next`).

Restrições de negócio no convite:

- Nunca convidar `ADMIN` via `/api/users/invite` (bloqueado no backend e testado em unidade).
- O `contaId` do convite é a origem da vinculação multi-tenant; aceite nunca cria `ADMIN`.

### 3) Login

- Página: `/auth/login`
- Usuário já autenticado acessando `/auth/login`:
  - Redirecionamento server-side para `/dashboard` (evita piscar de UI ou loops de client-side).
- Login com credenciais válidas:
  - NextAuth cria a sessão; redireciona para `next` se informado ou `/dashboard` por padrão.
- Login inválido:
  - Página exibe erro amigável; sem redirecionamento para áreas autenticadas.

## Endpoints envolvidos

- POST `/api/users/first-register` — cria o primeiro usuário (ADMIN) sem token.
- POST `/api/users/invite` — cria convite; recusa `role=ADMIN`; define `contaId` com base no convidador; ajusta maiúsculas em `role`.
- POST `/api/users/accept` — aceita convite; cria usuário na `contaId` indicada pelo convite; e-mail do usuário é o do convite; invalida o token.
- Descontinuado: `/api/users/register` — fluxo antigo desativado.

## Erros e estados esperados

- Convite inválido/expirado/usado: redirect para `/auth/login?error=invalid_token`.
- Convite para ADMIN: `403 Forbidden`.
- E-mail já utilizado: erro amigável no front, sem vazar detalhes sensíveis.

## Considerações de multi-tenant

- `contaId` no convite define o tenant do novo usuário.
- Backfill para convites legados sem `contaId`:
  - Script: `apps/web/scripts/backfill-invite-contaId.ts`.
  - Deve ser executado uma única vez após a introdução do campo.

## Operacional (Dev/CI/Prod)

- Prisma:
  - Dev: `prisma migrate dev` + `prisma generate`.
  - CI/Prod: `prisma migrate deploy` + `prisma generate` (já automatizado no workflow de CI).
- Testes:
  - Unitários cobrem: bloqueio de convite ADMIN, aceite de convite, política de senha, contratos de callbacks do NextAuth.
  - E2E: recomenda-se usar `data-testid` e redirecionamento confirmado após login/aceite.

## Referências rápidas

- UI de cadastro (página única): `apps/web/app/(auth)/register/page.tsx` e `RegisterForm`.
- Login (redirect server-side se autenticado): `apps/web/app/(auth)/login/page.tsx`.
- APIs: `apps/web/app/api/users/{first-register|invite|accept}/route.ts`.
- Prisma Schema: `prisma/schema.prisma` (modelo `Invite`).
