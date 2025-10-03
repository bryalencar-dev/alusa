# 🧪 Guia de Testes — Alusa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Executando Testes](#executando-testes)
4. [Comandos Disponíveis](#comandos-disponíveis)
5. [Banco de Dados de Teste](#banco-de-dados-de-teste)
6. [Solução de Problemas](#solução-de-problemas)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

O projeto Alusa utiliza **isolamento completo de bancos de dados** para testes:

- **Desenvolvimento**: `alusa` (banco principal, dados reais)
- **Testes**: `alusa_test` (banco separado, dados temporários)

### ✅ Garantias de Segurança

- **Seus dados de desenvolvimento nunca são afetados pelos testes**
- Validação automática antes de cada teste
- Ambiente isolado via `.env.test`
- Comandos específicos para cada ambiente

---

## ⚙️ Configuração Inicial

### 1. Criar o banco de dados de teste

```sql
-- No PostgreSQL
CREATE DATABASE alusa_test
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       LC_COLLATE = 'Portuguese_Brazil.1252'
       LC_CTYPE = 'Portuguese_Brazil.1252'
       TEMPLATE = template0;
```

Ou via linha de comando:

```bash
psql -U postgres -c "CREATE DATABASE alusa_test;"
```

### 2. Copiar o arquivo de ambiente

```bash
# Na raiz do projeto
cp .env.test.example .env.test
```

### 3. Validar configuração

Abra o arquivo `.env.test` e confirme:

```env
# ⚠️ ATENÇÃO: Este arquivo é para TESTES APENAS
# Nunca altere o nome do banco (deve ser alusa_test)
DATABASE_URL="postgresql://postgres:alusa@localhost:5432/alusa_test?schema=public"
NODE_ENV="test"
```

### 4. Aplicar migrações no banco de teste

```bash
# Da raiz do monorepo
pnpm db:migrate:test

# Ou diretamente no package web
cd apps/web
pnpm db:migrate:test
```

---

## 🚀 Executando Testes

### Testes Unitários (padrão)

```bash
# Da raiz do monorepo
pnpm test:unit

# Ou do package web
cd apps/web
pnpm test:unit
```

### Modo Watch (desenvolvimento)

```bash
# Da raiz
pnpm test:unit:watch

# Ou do package web
cd apps/web
pnpm test:unit:watch
```

### Testes E2E

```bash
# Da raiz
pnpm test:e2e

# Ou do package web
cd apps/web
pnpm test:e2e
```

---

## 📜 Comandos Disponíveis

### Testes

| Comando                | Descrição                                              |
| ---------------------- | ------------------------------------------------------ |
| `pnpm test:unit`       | Executa todos os testes unitários (usa banco de teste) |
| `pnpm test:unit:watch` | Executa testes em modo watch (hot reload)              |
| `pnpm test:e2e`        | Executa testes end-to-end com Playwright               |
| `pnpm test`            | Executa todos os testes (unit + e2e)                   |

### Banco de Dados de Teste

| Comando                | Descrição                                         |
| ---------------------- | ------------------------------------------------- |
| `pnpm db:migrate:test` | Aplica migrações no banco de teste                |
| `pnpm db:reset:test`   | ⚠️ Reseta o banco de teste (apaga todos os dados) |
| `pnpm db:seed:test`    | Popula o banco de teste com dados de exemplo      |

### ⚠️ Importante

- **NUNCA execute** `prisma migrate reset` sem especificar o ambiente
- **SEMPRE use** os comandos com `:test` para o banco de teste
- **NUNCA use** `vitest run` diretamente (use `pnpm test:unit`)

---

## 🗄️ Banco de Dados de Teste

### Estrutura

```
PostgreSQL Server (localhost:5432)
├── alusa          ← Banco de desenvolvimento (SEUS DADOS)
└── alusa_test     ← Banco de teste (DADOS TEMPORÁRIOS)
```

### Como funciona

1. **Isolamento via `.env.test`**

   - Arquivo separado com `DATABASE_URL` apontando para `alusa_test`
   - Carregado automaticamente pelo `dotenv-cli`

2. **Validação no setup**

   - Arquivo `apps/web/test/setup.ts` valida a DATABASE_URL
   - Testes **falham imediatamente** se banco incorreto

3. **Migrações independentes**
   - Schema Prisma aplicado em ambos os bancos
   - Migrações gerenciadas separadamente

### Verificando o banco em uso

```bash
# No PostgreSQL, conecte ao banco de teste
psql -U postgres -d alusa_test

# Liste as tabelas
\dt

# Conte registros (deve estar vazio ou com dados de teste)
SELECT COUNT(*) FROM "Usuario";
SELECT COUNT(*) FROM "Aluno";
```

### Resetando o banco de teste

```bash
# Apaga TODOS os dados e reaplica migrações
pnpm db:reset:test

# Popula com dados de exemplo
pnpm db:seed:test
```

---

## 🐛 Solução de Problemas

### Erro: "DATABASE_URL não está apontando para o banco de teste"

**Causa**: Testes executados sem carregar `.env.test`

**Solução**:

```bash
# ❌ Errado
vitest run

# ✅ Correto
pnpm test:unit
```

### Erro: "relation does not exist"

**Causa**: Migrações não aplicadas no banco de teste

**Solução**:

```bash
pnpm db:migrate:test
```

### Erro: "database alusa_test does not exist"

**Causa**: Banco de teste não foi criado

**Solução**:

```sql
-- No PostgreSQL
CREATE DATABASE alusa_test;
```

Ou via CLI:

```bash
psql -U postgres -c "CREATE DATABASE alusa_test;"
```

### Testes passam mas dados aparecem no banco de desenvolvimento

**Causa**: `.env.test` não foi carregado ou está incorreto

**Verificação**:

```bash
# Valide o conteúdo
cat .env.test | grep DATABASE_URL

# Deve conter: alusa_test
```

**Solução**:

```bash
# Recrie o arquivo
cp .env.test.example .env.test

# Execute novamente
pnpm db:migrate:test
pnpm test:unit
```

### Erro: "dotenv: command not found"

**Causa**: Dependências não instaladas

**Solução**:

```bash
pnpm install
```

---

## ✅ Boas Práticas

### 1. Sempre use os comandos corretos

```bash
# ✅ Correto - usa banco de teste
pnpm test:unit

# ❌ Errado - pode usar banco de desenvolvimento
vitest run
node --test
```

### 2. Não commite `.env.test`

O arquivo `.env.test` contém credenciais locais e **não deve** ser versionado.

```bash
# .gitignore já contém:
.env.test
```

### 3. Use `.env.test.example` como template

Quando adicionar novas variáveis de ambiente:

```bash
# 1. Adicione no .env.test.example
echo "NEW_VAR=valor_padrao" >> .env.test.example

# 2. Atualize seu .env.test local
echo "NEW_VAR=seu_valor" >> .env.test
```

### 4. Documente dependências de testes

Se um teste precisa de dados específicos:

```typescript
describe('Matricula Service', () => {
  beforeEach(async () => {
    // Cria dados necessários no banco de teste
    await prisma.aluno.create({ data: {...} });
  });

  afterEach(async () => {
    // Limpa dados criados
    await prisma.aluno.deleteMany();
  });
});
```

### 5. Mantenha o banco de teste limpo

```bash
# Periodicamente, resete o banco de teste
pnpm db:reset:test
pnpm db:seed:test
```

### 6. Valide o ambiente antes de PRs

```bash
# Checklist antes de abrir PR:
pnpm db:migrate:test    # ✅ Migrações aplicadas
pnpm test:unit          # ✅ Todos os testes passando
pnpm test:e2e           # ✅ E2E funcionando
```

---

## 🔬 Anatomia de um Teste

### Estrutura básica

```typescript
// apps/web/tests/services/aluno.service.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { alunoService } from '@/services/aluno.service';

const prisma = new PrismaClient();

describe('AlunoService', () => {
  beforeAll(async () => {
    // Setup: cria dados necessários
    await prisma.conta.create({
      data: { nome: 'Conta Teste' },
    });
  });

  afterAll(async () => {
    // Teardown: limpa dados criados
    await prisma.aluno.deleteMany();
    await prisma.conta.deleteMany();
    await prisma.$disconnect();
  });

  it('deve criar aluno com dados válidos', async () => {
    // Arrange
    const input = {
      nome: 'João Silva',
      cpf: '12345678900',
      contaId: '...',
    };

    // Act
    const aluno = await alunoService.create(input);

    // Assert
    expect(aluno).toBeDefined();
    expect(aluno.nome).toBe(input.nome);
  });

  it('deve rejeitar aluno sem nome', async () => {
    // Assert + Act
    await expect(alunoService.create({ nome: '' })).rejects.toThrow('Nome é obrigatório');
  });
});
```

### Checklist de qualidade

- [ ] Testa casos de sucesso
- [ ] Testa casos de erro
- [ ] Limpa dados criados no `afterEach/afterAll`
- [ ] Usa dados isolados (não depende de outros testes)
- [ ] Nomes descritivos (`deve fazer X quando Y`)
- [ ] Arrange-Act-Assert bem definidos

---

## 📊 Cobertura de Testes

### Visualizando cobertura

```bash
# Habilita cobertura (apenas em CI por padrão)
CI=true pnpm test:unit

# Relatório HTML em: coverage/index.html
```

### Meta de cobertura

- **Mínimo**: 80%
- **Ideal**: 90%+
- **Foco**: Lógica de negócio e serviços

### Áreas prioritárias

1. **Services** (lógica de negócio)
2. **API Routes** (endpoints)
3. **Hooks** (estado e efeitos)
4. **Utils** (funções auxiliares)

---

## 🎓 Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

## 🆘 Precisa de Ajuda?

1. **Leia a solução de problemas** acima
2. **Valide o ambiente** (`.env.test`, banco criado, migrações)
3. **Verifique os logs** do Vitest
4. **Abra uma issue** no repositório com:
   - Comando executado
   - Erro completo
   - Versões (Node, pnpm, PostgreSQL)

---

_Documentação gerada em 02/10/2025_  
_Versão: 1.0_
