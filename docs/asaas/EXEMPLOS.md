# Exemplos de Uso - Integração Asaas

Este documento contém exemplos práticos de uso da integração entre Matrícula e Asaas.

## 1. Criar Matrícula (que cria subscription no Asaas)

### Request

```http
POST http://localhost:3000/api/matriculas
Content-Type: application/json

{
  "alunoId": "cly1a2b3c4d5e6f7g8h9i0j1",
  "responsavelFinanceiroId": "cly2b3c4d5e6f7g8h9i0j1k2",
  "planoId": "cly3c4d5e6f7g8h9i0j1k2l3",
  "turmaId": "cly4d5e6f7g8h9i0j1k2l3m4",
  "taxaMatricula": 80.00,
  "taxaIsenta": false,
  "vencimentoDia": 5,
  "formaPagamento": "BOLETO",
  "criarCobranca": true,
  "dataInicio": "2025-10-03"
}
```

### Response (200 OK)

```json
{
  "matricula": {
    "id": "cly5e6f7g8h9i0j1k2l3m4n5",
    "alunoId": "cly1a2b3c4d5e6f7g8h9i0j1",
    "responsavelFinanceiroId": "cly2b3c4d5e6f7g8h9i0j1k2",
    "planoId": "cly3c4d5e6f7g8h9i0j1k2l3",
    "turmaId": "cly4d5e6f7g8h9i0j1k2l3m4",
    "status": "PENDENTE_TAXA",
    "dataInicio": "2025-10-03T00:00:00.000Z",
    "dataFim": null,
    "taxaMatricula": 80,
    "taxaStatus": "PENDENTE",
    "taxaIsenta": false,
    "vencimentoDia": 5,
    "asaasId": "sub_6xxxxxxxxxxxxxxxxxxx",
    "createdAt": "2025-10-03T12:00:00.000Z",
    "updatedAt": "2025-10-03T12:00:00.000Z"
  },
  "cobrancas": {
    "taxa": {
      "id": "cly6f7g8h9i0j1k2l3m4n5o6",
      "tipo": "TAXA_MATRICULA",
      "competenciaInicio": "2025-10-03T00:00:00.000Z",
      "competenciaFim": "2025-10-03T00:00:00.000Z",
      "valor": 80,
      "vencimento": "2025-10-03T00:00:00.000Z",
      "formaPagamento": "PIX",
      "status": "PENDENTE",
      "asaasId": null
    },
    "mensalidade": {
      "id": "cly7g8h9i0j1k2l3m4n5o6p7",
      "tipo": "MENSALIDADE",
      "competenciaInicio": "2025-10-03T00:00:00.000Z",
      "competenciaFim": "2025-11-02T23:59:59.999Z",
      "valor": 150,
      "vencimento": "2025-11-05T00:00:00.000Z",
      "formaPagamento": "BOLETO",
      "status": "PENDENTE",
      "asaasId": null
    }
  },
  "preco": {
    "plano": 150,
    "taxa": 80,
    "descontoPlano": 0,
    "planoLiquido": 150,
    "total": 230
  },
  "checkoutLink": {
    "id": "cly8h9i0j1k2l3m4n5o6p7q8",
    "token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
    "expiresAt": "2025-10-04T12:00:00.000Z",
    "usedAt": null,
    "channel": "PORTAL"
  },
  "responsavelFinanceiro": {
    "id": "cly2b3c4d5e6f7g8h9i0j1k2",
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "+5511987654321"
  },
  "primeiroVencimento": "2025-11-05T00:00:00.000Z"
}
```

### Logs do Servidor (console)

```
[Asaas] Customer existente encontrado: cus_000005047835
[Asaas] Subscription criada: sub_6xxxxxxxxxxxxxxxxxxx
```

---

## 2. Webhook - Pagamento Recebido

### Request (do Asaas para seu servidor)

```http
POST https://seu-dominio.com/api/asaas/webhooks
Content-Type: application/json
asaas-signature: 1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890

{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_7xxxxxxxxxxxxxxxxxxx",
    "customer": "cus_000005047835",
    "subscription": "sub_6xxxxxxxxxxxxxxxxxxx",
    "value": 150.00,
    "netValue": 146.85,
    "originalValue": 150.00,
    "dueDate": "2025-11-05",
    "paymentDate": "2025-11-03T14:30:00Z",
    "billingType": "BOLETO",
    "status": "RECEIVED",
    "description": "Mensalidade - Aluno Bryan de Alencar",
    "externalReference": "cly1a2b3c4d5e6f7g8h9i0j1",
    "confirmedDate": "2025-11-03T14:30:00Z"
  }
}
```

### Response (200 OK)

```json
{
  "received": true,
  "processed": true
}
```

### Logs do Servidor (console)

```
[Webhook Asaas] Recebido {
  eventId: 'pay_7xxxxxxxxxxxxxxxxxxx',
  event: 'PAYMENT_RECEIVED',
  hasPayment: true,
  hasSubscription: false
}
[Webhook Asaas] Persistido {
  eventId: 'pay_7xxxxxxxxxxxxxxxxxxx',
  event: 'PAYMENT_RECEIVED',
  webhookId: 'cly9i0j1k2l3m4n5o6p7q8r9',
  status: 'RECEBIDO'
}
[Webhook Asaas] Cobrança cly7g8h9i0j1k2l3m4n5o6p7 vinculada ao payment pay_7xxxxxxxxxxxxxxxxxxx da subscription sub_6xxxxxxxxxxxxxxxxxxx
[Webhook Asaas] Processado com sucesso {
  eventId: 'pay_7xxxxxxxxxxxxxxxxxxx',
  event: 'PAYMENT_RECEIVED',
  webhookId: 'cly9i0j1k2l3m4n5o6p7q8r9',
  status: 'PROCESSADO',
  duration: 234
}
```

### Alterações no Banco

```sql
-- Cobrança atualizada
UPDATE "Cobranca"
SET status = 'PAGO', "asaasPaymentId" = 'pay_7xxxxxxxxxxxxxxxxxxx'
WHERE id = 'cly7g8h9i0j1k2l3m4n5o6p7';

-- Pagamento criado
INSERT INTO "Pagamento" (...)
VALUES (
  'cly0j1k2l3m4n5o6p7q8r9s0',
  'cly7g8h9i0j1k2l3m4n5o6p7',
  '2025-11-03T14:30:00Z',
  'BOLETO',
  150.00,
  'CONFIRMADO',
  'pay_7xxxxxxxxxxxxxxxxxxx'
);

-- Matrícula ativada
UPDATE "Matricula"
SET status = 'ATIVA', "taxaStatus" = 'PAGO'
WHERE id = 'cly5e6f7g8h9i0j1k2l3m4n5';
```

---

## 3. Webhook - Pagamento em Atraso

### Request

```http
POST https://seu-dominio.com/api/asaas/webhooks
Content-Type: application/json
asaas-signature: 2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab

{
  "event": "PAYMENT_OVERDUE",
  "payment": {
    "id": "pay_7xxxxxxxxxxxxxxxxxxx",
    "customer": "cus_000005047835",
    "subscription": "sub_6xxxxxxxxxxxxxxxxxxx",
    "value": 150.00,
    "dueDate": "2025-11-05",
    "billingType": "BOLETO",
    "status": "OVERDUE",
    "description": "Mensalidade - Aluno Bryan de Alencar"
  }
}
```

### Response (200 OK)

```json
{
  "received": true,
  "processed": true
}
```

### Alterações no Banco

```sql
-- Cobrança marcada como atrasada
UPDATE "Cobranca"
SET status = 'ATRASADO'
WHERE "asaasPaymentId" = 'pay_7xxxxxxxxxxxxxxxxxxx';
```

---

## 4. Webhook - Assinatura Cancelada

### Request

```http
POST https://seu-dominio.com/api/asaas/webhooks
Content-Type: application/json
asaas-signature: 3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890abcd

{
  "event": "SUBSCRIPTION_DELETED",
  "subscription": {
    "id": "sub_6xxxxxxxxxxxxxxxxxxx",
    "customer": "cus_000005047835",
    "value": 150.00,
    "cycle": "MONTHLY",
    "status": "INACTIVE",
    "description": "Mensalidade - Aluno Bryan de Alencar"
  }
}
```

### Response (200 OK)

```json
{
  "received": true,
  "processed": true
}
```

### Alterações no Banco

```sql
-- Matrícula cancelada
UPDATE "Matricula"
SET status = 'CANCELADA'
WHERE "asaasSubscriptionId" = 'sub_6xxxxxxxxxxxxxxxxxxx';

-- Log de cancelamento
INSERT INTO "MatriculaLog" (...)
VALUES (
  'clya1k2l3m4n5o6p7q8r9s0t1',
  'cly5e6f7g8h9i0j1k2l3m4n5',
  'ASSINATURA_CANCELADA',
  'system',
  '{"subscriptionId":"sub_6xxxxxxxxxxxxxxxxxxx","motivo":"Assinatura cancelada no Asaas"}',
  '2025-11-20T10:00:00Z'
);
```

---

## 5. Gerar Assinatura HMAC para Testes (Postman)

### No terminal (Linux/Mac/Git Bash)

```bash
echo -n '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","value":100,"status":"RECEIVED","paymentDate":"2025-10-03T12:00:00Z","subscription":"sub_6xxxxxxxxxxxxxxxxxxx"}}' | \
  openssl dgst -sha256 -hmac 'seu_webhook_secret_aqui' -hex
```

**Output:**

```
(stdin)= 1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890
```

### No Postman

**Headers:**

```
asaas-signature: 1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890
Content-Type: application/json
```

**Body (raw JSON):**

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_123",
    "value": 100,
    "status": "RECEIVED",
    "paymentDate": "2025-10-03T12:00:00Z",
    "subscription": "sub_6xxxxxxxxxxxxxxxxxxx"
  }
}
```

---

## 6. Verificar Status da Integração (SQL)

```sql
-- Matrícula com subscription
SELECT
  m.id,
  m."asaasSubscriptionId",
  m.status,
  m."taxaStatus",
  m."createdAt"
FROM "Matricula" m
WHERE m.id = 'cly5e6f7g8h9i0j1k2l3m4n5';

-- Cobranças da matrícula
SELECT
  c.id,
  c.tipo,
  c."asaasPaymentId",
  c.status,
  c.valor,
  c.vencimento
FROM "Cobranca" c
WHERE c."matriculaId" = 'cly5e6f7g8h9i0j1k2l3m4n5'
ORDER BY c.vencimento;

-- Logs da integração
SELECT
  ml.action,
  ml.metadata,
  ml."createdAt"
FROM "MatriculaLog" ml
WHERE ml."matriculaId" = 'cly5e6f7g8h9i0j1k2l3m4n5'
  AND ml.action IN ('ASAAS_INTEGRADO', 'ASSINATURA_CRIADA', 'ASSINATURA_CANCELADA')
ORDER BY ml."createdAt" DESC;

-- Webhooks recebidos
SELECT
  wh.evento,
  wh.status,
  wh."recebidoEm",
  wh."processadoEm",
  wh.payload
FROM "WebhookAsaas" wh
WHERE wh."eventId" = 'pay_7xxxxxxxxxxxxxxxxxxx'
  OR wh."eventId" = 'sub_6xxxxxxxxxxxxxxxxxxx';
```

---

## 7. Cenários de Teste

### ✅ Cenário 1: Fluxo Completo de Sucesso

1. Criar matrícula via wizard
2. Verificar subscription criada no Asaas
3. Simular pagamento no sandbox Asaas
4. Asaas envia webhook `PAYMENT_RECEIVED`
5. Sistema ativa matrícula automaticamente
6. Verificar status `ATIVA` no banco

### ✅ Cenário 2: Pagamento em Atraso

1. Matrícula ativa com cobrança pendente
2. Data de vencimento passa
3. Asaas envia webhook `PAYMENT_OVERDUE`
4. Sistema marca cobrança como `ATRASADO`
5. Verificar status no banco

### ✅ Cenário 3: Cancelamento de Assinatura

1. Matrícula ativa com subscription no Asaas
2. Cancelar subscription no painel Asaas
3. Asaas envia webhook `SUBSCRIPTION_DELETED`
4. Sistema cancela matrícula
5. Verificar status `CANCELADA` no banco

### ✅ Cenário 4: Erro na Integração Asaas

1. Desabilitar `ASAAS_INTEGRATION_ENABLED=false`
2. Criar matrícula
3. Verificar que matrícula foi criada normalmente
4. Verificar que `asaasSubscriptionId` é NULL
5. Habilitar integração novamente
6. Reprocessar matrícula (script futuro)

---

## 8. Troubleshooting

### Problema: Webhook retorna 401 (Assinatura inválida)

**Causa:** Secret incorreto ou payload alterado

**Solução:**

```bash
# Regenerar assinatura com o payload exato
echo -n '<payload_exato>' | openssl dgst -sha256 -hmac '<ASAAS_WEBHOOK_SECRET>' -hex
```

### Problema: Matrícula criada mas sem asaasSubscriptionId

**Causa:** Erro na API do Asaas durante criação

**Solução:**

1. Verificar logs do servidor
2. Verificar credenciais do Asaas
3. Verificar status da API Asaas
4. Executar script de reprocessamento (futuro)

### Problema: Webhook recebido mas não processado

**Causa:** Erro no processamento

**Solução:**

```sql
-- Buscar webhooks com erro
SELECT id, evento, payload, "recebidoEm"
FROM "WebhookAsaas"
WHERE status = 'ERRO';

-- Reprocessar manualmente (marcar como RECEBIDO novamente)
UPDATE "WebhookAsaas"
SET status = 'RECEBIDO', "processadoEm" = NULL
WHERE id = '<webhook_id>';
```

---

## 9. Próximos Passos

Consulte a documentação completa em:

- [`docs/asaas/README.md`](./README.md) - Resumo da integração
- [`docs/asaas/INTEGRACAO_MATRICULA.md`](./INTEGRACAO_MATRICULA.md) - Documentação técnica completa
