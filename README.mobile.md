# 📱 Guia Mobile — Alusa

## Estrutura
- O app ficará em `apps/mobile/` (React Native/Expo).

## Autenticação
- Usará o mesmo fluxo do NextAuth (JWT).
- Login: `POST /api/auth/callback/credentials`.
- Sessão: `GET /api/auth/session`.

## Endpoints principais (já prontos)
- Presenças: `GET/POST /api/presencas`
- Eventos: `POST /api/eventos/checkin`

## Como validar APIs do mobile agora
```bash
# exemplo: login via curl
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -d '{"email":"admin@teste.com","password":"123456"}' \
  -H "Content-Type: application/json"
```

---

Execute os seguintes comandos para garantir que tudo continua funcionando:
```bash
pnpm -w lint
pnpm -w typecheck
pnpm -w test
pnpm -w dev
```

### Checklist de validação
- [x] Repositório contém `apps/mobile/` sem quebrar nada.
- [x] `.env.example` contém `FEATURE_MOBILE=false`.
- [x] `README.mobile.md` criado com instruções.
- [x] APIs de presenças e eventos acessíveis.
