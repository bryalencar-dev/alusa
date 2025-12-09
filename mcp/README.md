# AlusaDB MCP - PostgreSQL Server

MCP Server personalizado para acesso seguro ao banco de dados PostgreSQL do projeto Alusa.

## Instalação

```bash
# Instalar dependências do MCP
pnpm install

# Verificar se as dependências foram instaladas
pnpm list @modelcontextprotocol/sdk pg
```

## Configuração

### 1. Variáveis de Ambiente

Certifique-se de que `DATABASE_URL` está configurada no `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/alusa?schema=public"
```

### 2. VS Code (Copilot/Cline)

A configuração já está em `.vscode/mcp.json`. O servidor será iniciado automaticamente quando você usar o chat do Copilot.

### 3. Claude Desktop

Adicione ao `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) ou `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
   "mcpServers": {
      "alusadb": {
         "command": "npx",
         "args": ["tsx", "mcp/postgres-server.ts"],
         "cwd": "/caminho/para/alusa",
         "env": {
            "DATABASE_URL": "postgresql://..."
         }
      }
   }
}
```

## Comandos de Execução

```bash
# Executar o servidor MCP
pnpm mcp

# Modo desenvolvimento (watch)
pnpm mcp:dev

# Build para produção
pnpm mcp:build
```

## Tools Disponíveis

### Introspecção de Banco

| Tool | Descrição |
|------|-----------|
| `listTables` | Lista todas as tabelas do banco |
| `describeTable` | Detalha colunas, PKs, FKs e índices de uma tabela |
| `listRelations` | Lista todas as foreign keys do banco |
| `runSelect` | Executa queries SELECT (somente leitura) |

### Introspecção Prisma

| Tool | Descrição |
|------|-----------|
| `listPrismaModels` | Lista todos os models do schema Prisma |
| `getPrismaModel` | Detalha um model específico (campos, relações, etc) |
| `invalidateSchemaCache` | Força releitura do schema.prisma |

### Geradores de Código

| Tool | Descrição |
|------|-----------|
| `generateZodSchemaFromTable` | Gera schema Zod de validação |
| `generateServiceLayer` | Gera service layer com CRUD |
| `generateNextApiRoute` | Gera API Route Handler Next.js |
| `generateShadcnForm` | Gera formulário ShadCN UI |
| `generateTanstackTable` | Gera tabela TanStack + ShadCN |

## Exemplos de Uso

### No Chat do Copilot/Claude

```
# Listar tabelas
@alusadb listTables

# Descrever uma tabela
@alusadb describeTable { "table": "Aluno" }

# Executar query
@alusadb runSelect { "query": "SELECT id, nome FROM \"Aluno\" WHERE status = 'ATIVO' LIMIT 10" }

# Obter model Prisma
@alusadb getPrismaModel { "name": "Matricula" }

# Gerar schema Zod
@alusadb generateZodSchemaFromTable { "table": "Turma" }

# Gerar service layer
@alusadb generateServiceLayer { "table": "Cobranca", "includePagination": true }

# Gerar API Route
@alusadb generateNextApiRoute { "table": "Aluno", "includeAuth": true }

# Gerar formulário
@alusadb generateShadcnForm { "table": "Turma", "layout": "two-column" }

# Gerar tabela
@alusadb generateTanstackTable { "table": "Matricula", "includeActions": true }
```

## Medidas de Segurança

### ✅ Implementadas

1. **Somente SELECT**
   - Queries com INSERT, UPDATE, DELETE, DROP, etc são bloqueadas
   - Validação em múltiplas camadas

2. **Mascaramento de Dados Sensíveis**
   - Campos como `senhaHash`, `token`, `apiKey` são mascarados
   - Padrões de CPF, email são parcialmente ocultados

3. **Limite de Resultados**
   - Máximo de 500 linhas por query
   - LIMIT aplicado automaticamente

4. **Validação de Entrada**
   - Nomes de tabelas validados contra SQL injection
   - Comentários SQL não permitidos
   - Múltiplas statements bloqueadas

5. **Proteção de Tabelas Sensíveis**
   - Tabelas como `sessions`, `tokens` são bloqueadas

6. **Logs Seguros**
   - Valores em queries são mascarados nos logs
   - Nenhum dado pessoal é logado

### 🛡️ Campos Protegidos (Sempre Mascarados)

- `password`, `senha`, `senhaHash`
- `token`, `secret`, `apiKey`
- `asaasApiKeyEncrypted`
- `asaasWebhookSecretEncrypted`
- `asaasCreditCardToken`
- `accessToken`, `refreshToken`
- `sessionToken`, `privateKey`

### ⚠️ Boas Práticas

1. **Nunca exponha o MCP em rede pública** - Apenas uso local
2. **Use variáveis de ambiente** - Não hardcode DATABASE_URL
3. **Monitore os logs** - Detecte uso anormal
4. **Rotacione credenciais** - Especialmente em produção

## Arquitetura

```
mcp/
├── postgres-server.ts   # Servidor MCP principal
├── database.ts          # Conexão PostgreSQL e queries
├── prisma-reader.ts     # Parser do schema Prisma
├── generators.ts        # Geradores de código
├── security.ts          # Validação e sanitização
├── types.ts             # Tipos TypeScript
└── tsconfig.json        # Config TypeScript
```

## Troubleshooting

### "Pool PostgreSQL não inicializado"

Verifique se `DATABASE_URL` está configurada corretamente.

### "Model não encontrado"

Execute `invalidateSchemaCache` para recarregar o schema Prisma.

### Queries lentas

- Adicione índices nas colunas usadas em WHERE/ORDER BY
- Reduza o LIMIT para testes
- Use `describeTable` para ver índices existentes

### Dados sensíveis aparecendo

Se dados sensíveis estiverem visíveis, adicione o nome da coluna em `SENSITIVE_COLUMNS` no arquivo `security.ts`.

## Contribuindo

1. Mantenha a segurança como prioridade
2. Adicione testes para novas tools
3. Documente novas funcionalidades
4. Siga os padrões de código existentes
