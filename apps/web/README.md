## @alusa/web

App Next.js (App Router) mínimo para Portal.

Scripts:
- dev: desenvolvimento
- build: build de produção
- start: iniciar build

Estrutura principal:
```
apps/web/
  app/        # rotas App Router
  lib/        # utilidades (auth, etc.)
  package.json
  tsconfig.json
  next.config.js
```

Próximos passos: integrar autenticação real, mover páginas de portal existentes e remover any restantes.
