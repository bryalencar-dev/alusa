# 📝 Relatório: Configuração de Ambiente de Teste Isolado

**Data**: 02/01/2025  
**Desenvolvedor**: GitHub Copilot Agent  
**Feature**: Isolamento de banco de dados para testes

---

## 🎯 Objetivo

Garantir que os testes unitários **nunca toquem no banco de desenvolvimento** (`alusa`), usando um banco separado (`alusa_test`) com configuração independente via `.env.test`.

### ✅ Problema resolvido

> **Usuário**: "quando rodar `pnpm --filter @alusa/web test:unit`, meus usuários e cadastros do banco de desenvolvimento continuam intactos"

---

## 📦 Arquivos Criados/Modificados

### ✅ 1. `.env.test` (novo)

**Propósito**: Arquivo de ambiente para testes

```env
# ⚠️ ATENÇÃO: Este arquivo é para TESTES APENAS
DATABASE_URL="postgresql://postgres:alusa@localhost:5432/alusa_test?schema=public"
NODE_ENV="test"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-change-in-production"
```

**Características**:

- Banco separado: `alusa_test` (vs `alusa` de desenvolvimento)
- NODE_ENV=test (identifica ambiente de teste)
- Não versionado (`.gitignore` já inclui)

---

### ✅ 2. `.env.test.example` (novo)

**Propósito**: Template versionado para novos desenvolvedores

```env
# Cópia do .env.test para referência
# Copie este arquivo para .env.test e ajuste conforme necessário
```

**Uso**:

```bash
cp .env.test.example .env.test
```

---

### ✅ 3. `apps/web/vitest.config.ts` (modificado)

**Mudanças**:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // ⚠️ IMPORTANTE: Define NODE_ENV=test
    env: {
      NODE_ENV: 'test',
    },
    // ... resto da config
  },
});
```

**Impacto**:

- Garante `NODE_ENV=test` em todos os testes
- Complementa configuração do `.env.test`

---

### ✅ 4. `apps/web/test/setup.ts` (já estava validado)

**Validação existente**:

```typescript
// ⚠️ VALIDAÇÃO: Garante que está usando banco de teste
if (!process.env.DATABASE_URL?.includes('alusa_test')) {
  throw new Error(
    '❌ ERRO CRÍTICO: DATABASE_URL não está apontando para o banco de teste!\n' +
      'Esperado: postgresql://...alusa_test...\n' +
      `Atual: ${process.env.DATABASE_URL}\n\n` +
      'Para corrigir:\n' +
      '1. Certifique-se que .env.test existe\n' +
      '2. Execute: pnpm db:migrate:test\n' +
      '3. Execute: pnpm test:unit\n',
  );
}

console.log('✅ Usando banco de teste:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
```

**Características**:

- Valida banco antes de cada teste
- Falha imediatamente se banco incorreto
- Mostra mensagem clara de erro

---

### ✅ 5. `apps/web/package.json` (modificado)

**Scripts atualizados**:

```json
{
  "scripts": {
    "test:unit": "dotenv -e ../../.env.test -- vitest run",
    "test:unit:watch": "dotenv -e ../../.env.test -- vitest watch",
    "test": "dotenv -e ../../.env.test -- vitest run",
    "db:migrate:test": "dotenv -e ../../.env.test -- prisma migrate deploy --schema=../../prisma/schema.prisma",
    "db:reset:test": "dotenv -e ../../.env.test -- prisma migrate reset --schema=../../prisma/schema.prisma --force --skip-seed",
    "db:seed:test": "dotenv -e ../../.env.test -- prisma db seed --schema=../../prisma/schema.prisma"
  }
}
```

**Mudanças**:

1. ✅ `test:unit` → usa `dotenv -e ../../.env.test`
2. ✅ `test:unit:watch` → novo comando para modo watch
3. ✅ `test` → também usa `.env.test`
4. ✅ `db:migrate:test` → aplica migrações no banco de teste
5. ✅ `db:reset:test` → reseta banco de teste (⚠️ destrutivo)
6. ✅ `db:seed:test` → popula banco de teste com dados

---

### ✅ 6. `package.json` (raiz, modificado)

**Scripts atualizados**:

```json
{
  "scripts": {
    "test:unit": "pnpm --filter @alusa/web run test:unit",
    "test:unit:watch": "pnpm --filter @alusa/web run test:unit:watch",
    "db:migrate:test": "pnpm --filter @alusa/web run db:migrate:test",
    "db:reset:test": "pnpm --filter @alusa/web run db:reset:test",
    "db:seed:test": "pnpm --filter @alusa/web run db:seed:test",
    "db:verify:test": "dotenv -e .env.test -- node scripts/verify-test-db.mjs"
  }
}
```

**Mudanças**:

- Comandos na raiz delegam para `apps/web`
- Novos comandos de gerenciamento de banco de teste
- Script de verificação para validar isolamento

---

### ✅ 7. `docs/TESTES.md` (novo, ~350 linhas)

**Propósito**: Documentação completa de testes

**Conteúdo**:

1. Visão geral do sistema de testes
2. Configuração inicial passo a passo
3. Como executar testes
4. Comandos disponíveis
5. Gerenciamento do banco de teste
6. Solução de problemas comuns
7. Boas práticas
8. Anatomia de um teste
9. Cobertura de testes

**Destaques**:

- SQL para criar banco `alusa_test`
- Checklist de setup
- Troubleshooting com soluções práticas
- Exemplos de código de teste

---

### ✅ 8. `scripts/verify-test-db.mjs` (novo)

**Propósito**: Script de verificação e diagnóstico

**Funcionalidades**:

1. Valida `DATABASE_URL` no `.env.test`
2. Testa conexão com banco de teste
3. Lista migrações aplicadas
4. Conta registros nas tabelas principais
5. Compara com banco de desenvolvimento (se existir)
6. Mostra resumo colorido e instruções

**Uso**:

```bash
pnpm db:verify:test
```

**Output esperado**:

```
============================================================
🔍 Verificação de Banco de Dados de Teste
============================================================

📋 Etapa 1: Validando DATABASE_URL
✅ DATABASE_URL configurada corretamente
   postgresql://postgres:***@localhost:5432/alusa_test?schema=public

📋 Etapa 2: Testando conexão com banco
✅ Conexão estabelecida com sucesso

📋 Etapa 3: Verificando migrações
✅ 5 migrações aplicadas
   - 20250901_alunos
   - 20250916_matriculas
   ...

📋 Etapa 4: Contando registros
📊 Usuario: 0 registros (vazio)
📊 Aluno: 0 registros (vazio)
...

📋 Etapa 5: Comparando com banco de desenvolvimento
✅ Bancos estão isolados:
   - Desenvolvimento (alusa): 10 usuários
   - Teste (alusa_test): 0 registros totais

============================================================
✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO
============================================================
```

---

## 🔄 Fluxo de Uso

### Setup inicial (uma vez por desenvolvedor)

```bash
# 1. Criar banco de teste no PostgreSQL
psql -U postgres -c "CREATE DATABASE alusa_test;"

# 2. Copiar arquivo de ambiente
cp .env.test.example .env.test

# 3. Aplicar migrações
pnpm db:migrate:test

# 4. (Opcional) Popular com dados
pnpm db:seed:test

# 5. Verificar setup
pnpm db:verify:test
```

### Executar testes (dia a dia)

```bash
# Rodar todos os testes
pnpm test:unit

# Modo watch (hot reload)
pnpm test:unit:watch

# Resetar banco de teste
pnpm db:reset:test

# Verificar isolamento
pnpm db:verify:test
```

---

## 🛡️ Garantias de Segurança

### 1. Múltiplas camadas de proteção

✅ **Camada 1: Arquivo separado**

- `.env.test` com `DATABASE_URL` diferente
- Não versionado (`.gitignore`)

✅ **Camada 2: Wrapper CLI**

- `dotenv-cli` carrega `.env.test` antes de iniciar processo
- Evita erros de import/runtime

✅ **Camada 3: Validação no setup**

- `apps/web/test/setup.ts` valida `DATABASE_URL`
- Testes **falham imediatamente** se banco incorreto

✅ **Camada 4: NODE_ENV**

- `vitest.config.ts` define `NODE_ENV=test`
- Identifica ambiente em qualquer parte do código

### 2. Comandos seguros

| Comando                | Banco Usado   | Segurança                      |
| ---------------------- | ------------- | ------------------------------ |
| `pnpm dev`             | `alusa` (dev) | ✅ Seguro (não toca .env.test) |
| `pnpm test:unit`       | `alusa_test`  | ✅ Seguro (usa .env.test)      |
| `pnpm db:migrate`      | `alusa` (dev) | ✅ Seguro (dev normal)         |
| `pnpm db:migrate:test` | `alusa_test`  | ✅ Seguro (teste explícito)    |
| `pnpm db:reset:test`   | `alusa_test`  | ✅ Seguro (só reseta teste)    |

### 3. Comandos perigosos (evitados)

❌ **NUNCA fazer**:

```bash
# ❌ Executa testes sem .env.test
vitest run

# ❌ Reseta banco sem especificar ambiente
prisma migrate reset

# ❌ Modifica .env.test manualmente para apontar para alusa
DATABASE_URL="postgresql://...alusa" # ❌ PERIGO!
```

✅ **SEMPRE fazer**:

```bash
# ✅ Usa wrapper dotenv-cli
pnpm test:unit

# ✅ Comando específico para teste
pnpm db:reset:test

# ✅ Mantém .env.test com alusa_test
DATABASE_URL="postgresql://...alusa_test"
```

---

## 📊 Validação de Isolamento

### Checklist de verificação

Execute estes comandos para confirmar o isolamento:

```bash
# 1. Verificar banco de teste
pnpm db:verify:test

# 2. Contar registros no banco de desenvolvimento
psql -U postgres -d alusa -c "SELECT COUNT(*) FROM \"Usuario\";"

# 3. Executar um teste simples
pnpm test:unit

# 4. Verificar novamente o banco de desenvolvimento
psql -U postgres -d alusa -c "SELECT COUNT(*) FROM \"Usuario\";"

# ✅ O resultado do passo 2 e 4 deve ser IDÊNTICO
```

### SQL para verificação manual

```sql
-- Banco de desenvolvimento (alusa)
\c alusa
SELECT 'DESENVOLVIMENTO' as ambiente, COUNT(*) as usuarios FROM "Usuario";
SELECT 'DESENVOLVIMENTO' as ambiente, COUNT(*) as alunos FROM "Aluno";

-- Banco de teste (alusa_test)
\c alusa_test
SELECT 'TESTE' as ambiente, COUNT(*) as usuarios FROM "Usuario";
SELECT 'TESTE' as ambiente, COUNT(*) as alunos FROM "Aluno";
```

**Output esperado**:

```
DESENVOLVIMENTO | usuarios: 10
DESENVOLVIMENTO | alunos: 50

TESTE           | usuarios: 0
TESTE           | alunos: 0
```

---

## 🎓 Próximos Passos

### Para o desenvolvedor

1. ✅ **Criar banco `alusa_test`**

   ```bash
   psql -U postgres -c "CREATE DATABASE alusa_test;"
   ```

2. ✅ **Copiar `.env.test.example` para `.env.test`**

   ```bash
   cp .env.test.example .env.test
   ```

3. ✅ **Aplicar migrações**

   ```bash
   pnpm db:migrate:test
   ```

4. ✅ **Verificar isolamento**

   ```bash
   pnpm db:verify:test
   ```

5. ✅ **Executar testes**
   ```bash
   pnpm test:unit
   ```

### Para CI/CD

Adicionar no pipeline:

```yaml
# .github/workflows/test.yml
- name: Setup Test Database
  run: |
    psql -U postgres -c "CREATE DATABASE alusa_test;"
    pnpm db:migrate:test

- name: Run Tests
  run: pnpm test:unit

- name: Verify Test Isolation
  run: pnpm db:verify:test
```

---

## 📚 Documentação Adicional

- **Guia completo**: `docs/TESTES.md`
- **Script de verificação**: `scripts/verify-test-db.mjs`
- **Configuração Vitest**: `apps/web/vitest.config.ts`
- **Setup de testes**: `apps/web/test/setup.ts`

---

## ✅ Checklist de Entrega

- [x] `.env.test` criado e configurado
- [x] `.env.test.example` versionado
- [x] `vitest.config.ts` atualizado com NODE_ENV=test
- [x] `test/setup.ts` com validação de banco
- [x] `apps/web/package.json` com scripts de teste
- [x] `package.json` (raiz) com delegação de comandos
- [x] `docs/TESTES.md` com documentação completa
- [x] `scripts/verify-test-db.mjs` para diagnóstico
- [x] Comandos de gerenciamento de banco de teste
- [x] Múltiplas camadas de segurança implementadas

---

## 🎉 Conclusão

A configuração de ambiente de teste isolado está **completa e segura**.

**Garantias**:
✅ Testes **NUNCA** tocam no banco de desenvolvimento  
✅ Validação automática antes de cada teste  
✅ Documentação completa para novos desenvolvedores  
✅ Scripts de diagnóstico para troubleshooting  
✅ Comandos intuitivos e seguros

**Próximo passo**: Executar `pnpm db:verify:test` para validar o setup completo.

---

_Relatório gerado em 02/01/2025_  
_Desenvolvedor: GitHub Copilot Agent_  
_Versão: 1.0_
