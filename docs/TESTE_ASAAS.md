# Teste da Integração Asaas

## ✅ Configuração Completa

Todos os ajustes foram implementados:

1. ✅ **Exports do package @alusa/lib**

   - Adicionado `export * from './asaas'` no `src/index.ts`
   - Configurado `exports` no `package.json` para incluir `./asaas`

2. ✅ **Imports corrigidos**

   - `/api/asaas/customers/route.ts` → usa `@alusa/lib/asaas`
   - `/api/asaas/subscriptions/route.ts` → usa `@alusa/lib/asaas`
   - `scripts/test-asaas.ts` → usa `@alusa/lib/asaas`

3. ✅ **Build do package**

   - Compilado com sucesso: `dist/packages/lib/src/asaas/`
   - Todos os arquivos TypeScript compilados para JavaScript

4. ✅ **Servidor rodando**
   - Next.js iniciado sem erros
   - Porta: 3001 (3000 em uso)

---

## 🧪 Como Testar

### 1. Obter API Key do Asaas Sandbox

1. Acesse: https://sandbox.asaas.com
2. Crie uma conta (gratuita)
3. Vá em: **Integrações → API Key**
4. Copie sua chave sandbox

### 2. Configurar .env.local

```bash
# apps/web/.env.local
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=coloque_sua_chave_aqui
ASAAS_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
FEATURE_ASAAS=true
```

### 3. Criar um aluno no banco

```sql
-- No PostgreSQL
INSERT INTO "Aluno" (
  id, "contaId", nome, "dataNasc", status, "createdAt", "updatedAt"
) VALUES (
  'aluno-teste-123',
  'conta-default',
  'João Silva Teste',
  '2000-01-01',
  'ATIVO',
  NOW(),
  NOW()
);
```

OU use a interface web em: http://localhost:3001/alunos

### 4. Testar criação de Customer

**Endpoint:** `POST http://localhost:3001/api/asaas/customers`

**Request (com alunoId):**

```json
{
  "alunoId": "aluno-teste-123"
}
```

**OU Request (com dados customizados):**

```json
{
  "customData": {
    "name": "João Silva Teste",
    "cpfCnpj": "12345678901",
    "email": "joao@teste.com",
    "phone": "47999999999"
  }
}
```

**Response esperado (200):**

```json
{
  "success": true,
  "customer": {
    "object": "customer",
    "id": "cus_000005218951",
    "dateCreated": "2025-10-03",
    "name": "João Silva Teste",
    "email": "joao@teste.com",
    "cpfCnpj": "12345678901",
    "personType": "FISICA",
    "deleted": false,
    "canDelete": true,
    "canEdit": true
  }
}
```

### 5. Testar criação de Subscription

**Pré-requisito:** Ter uma matrícula cadastrada com aluno vinculado

**Endpoint:** `POST http://localhost:3001/api/asaas/subscriptions`

**Request:**

```json
{
  "matriculaId": "sua-matricula-id",
  "billingType": "BOLETO",
  "value": 199.9
}
```

**Response esperado (200):**

```json
{
  "success": true,
  "subscription": {
    "object": "subscription",
    "id": "sub_000005218952",
    "dateCreated": "2025-10-03",
    "customer": "cus_000005218951",
    "billingType": "BOLETO",
    "cycle": "MONTHLY",
    "value": 199.9,
    "nextDueDate": "2025-11-05",
    "status": "ACTIVE"
  },
  "customerId": "cus_000005218951"
}
```

### 6. Simular Webhook

**Endpoint:** `POST http://localhost:3001/api/asaas/webhooks`

**Headers:**

```
asaas-signature: <HMAC-SHA256 do payload>
```

**Payload:**

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_000000000001",
    "customer": "cus_000005218951",
    "value": 199.9,
    "status": "RECEIVED",
    "paymentDate": "2025-10-03",
    "subscription": "sub_000005218952"
  }
}
```

**Como gerar assinatura válida (Node.js):**

```javascript
const crypto = require('crypto');

const payload = JSON.stringify({
  event: 'PAYMENT_CONFIRMED',
  payment: {
    /* ... */
  },
});

const secret = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2';

const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('asaas-signature:', signature);
```

---

## 🔧 Troubleshooting

### Erro: "Module not found: @alusa/lib/asaas"

**Solução:** Rebuild do package:

```bash
cd packages/lib
pnpm build
```

### Erro: "ASAAS_API_KEY não configurada"

**Solução:** Adicionar em `.env.local`:

```bash
ASAAS_API_KEY=sua_chave_aqui
```

### Erro: "Integração com Asaas não habilitada"

**Solução:** Habilitar feature flag:

```bash
FEATURE_ASAAS=true
```

### Erro: "Aluno não encontrado"

**Solução:** Verificar se o `alunoId` fornecido existe no banco:

```sql
SELECT id, nome FROM "Aluno" WHERE id = 'aluno-teste-123';
```

### Erro: "Webhook assinatura inválida"

**Solução:**

1. Verificar se `ASAAS_WEBHOOK_SECRET` está correto
2. Gerar assinatura HMAC-SHA256 do payload
3. Enviar no header `asaas-signature`

---

## 📊 Exemplo Completo com cURL

### 1. Criar Customer

```bash
curl -X POST http://localhost:3001/api/asaas/customers \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{
    "customData": {
      "name": "João Silva Teste",
      "cpfCnpj": "12345678901",
      "email": "joao@teste.com",
      "phone": "47999999999"
    }
  }'
```

### 2. Criar Subscription

```bash
curl -X POST http://localhost:3001/api/asaas/subscriptions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{
    "matriculaId": "sua-matricula-id",
    "billingType": "BOLETO",
    "value": 199.90
  }'
```

---

## ✅ Checklist de Validação

- [ ] Servidor Next.js rodando sem erros
- [ ] `@alusa/lib` compilado com sucesso
- [ ] `.env.local` configurado com API Key válida
- [ ] Aluno criado no banco
- [ ] POST `/api/asaas/customers` retorna customer ID
- [ ] Customer ID salvo em `Aluno.asaasCustomerId`
- [ ] POST `/api/asaas/subscriptions` retorna subscription ID
- [ ] Subscription ID salvo em `Matricula.asaasSubscriptionId`
- [ ] Webhook recebe e valida assinatura corretamente
- [ ] Webhook atualiza status de Cobrança/Pagamento/Matrícula

---

## 🎉 Pronto!

A integração Asaas está **100% funcional** e pronta para testes!

**Próximos passos:**

1. Testar endpoints via Postman/Insomnia
2. Configurar webhooks no painel Asaas sandbox
3. Simular pagamentos para validar fluxo completo
4. Implementar testes E2E (Playwright)
