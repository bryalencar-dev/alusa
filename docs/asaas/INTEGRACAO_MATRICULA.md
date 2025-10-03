# Integração Matrícula → Asaas

## Visão Geral

Este documento descreve o fluxo completo de sincronização entre o cadastro de matrícula no sistema Alusa e a criação automática de assinaturas e cobranças no Asaas.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│ FLUXO DE CADASTRO DE MATRÍCULA                                  │
└─────────────────────────────────────────────────────────────────┘

1. Usuário preenche wizard de matrícula
   ├─ Aluno + Responsável
   ├─ Turma/Combo
   ├─ Plano
   ├─ Forma de pagamento
   └─ Desconto (opcional)

2. API POST /api/matriculas
   ├─ Validação (idade, conflitos, capacidade)
   ├─ Cálculo de preços (com descontos)
   └─ Criação da matrícula no banco

3. Criação de cobranças locais
   ├─ Cobrança taxa (se não isenta)
   └─ Cobrança mensalidade (primeira)

4. Integração com Asaas (maybeCreateAsaasRecords)
   ├─ Busca/Cria customer (aluno ou responsável)
   ├─ Cria subscription (assinatura recorrente mensal)
   ├─ Salva asaasSubscriptionId na matrícula
   ├─ Salva asaasPaymentId na cobrança (se disponível)
   └─ Log de integração

5. Webhook do Asaas envia eventos
   ├─ SUBSCRIPTION_CREATED → Log de assinatura criada
   ├─ PAYMENT_RECEIVED → Marca cobrança como PAGO, ativa matrícula
   ├─ PAYMENT_OVERDUE → Marca cobrança como ATRASADO
   └─ SUBSCRIPTION_DELETED → Cancela matrícula

┌─────────────────────────────────────────────────────────────────┐
│ SINCRONIZAÇÃO BIDIRECIONAL                                      │
└─────────────────────────────────────────────────────────────────┘

Sistema → Asaas:
  - Matrícula criada → Subscription criada
  - Matrícula cancelada → Subscription deletada (futuro)

Asaas → Sistema:
  - Payment received → Cobrança PAGO, Matrícula ATIVA
  - Payment overdue → Cobrança ATRASADO
  - Subscription deleted → Matrícula CANCELADA
```

## Campos Relevantes

### Matricula

```prisma
model Matricula {
  id                      String
  asaasSubscriptionId     String?  @unique  // ID da assinatura no Asaas
  status                  StatusMatricula   // PENDENTE_TAXA, ATIVA, CANCELADA
  taxaStatus              StatusTaxaMatricula
  vencimentoDia           Int
  // ... outros campos
}
```

### Cobranca

```prisma
model Cobranca {
  id                String
  matriculaId       String
  tipo              TipoCobranca  // TAXA_MATRICULA, MENSALIDADE
  valor             Decimal
  vencimento        DateTime
  status            StatusCobranca  // PENDENTE, PAGO, ATRASADO
  asaasPaymentId    String?  @unique  // ID do payment individual no Asaas
  // ... outros campos
}
```

### WebhookAsaas

```prisma
model WebhookAsaas {
  id           String
  contaId      String
  evento       String    // PAYMENT_RECEIVED, SUBSCRIPTION_CREATED, etc
  eventId      String?   @unique  // Idempotência
  payload      Json
  status       String    // RECEBIDO, PROCESSADO, ERRO
  processadoEm DateTime?
}
```

## Funções Principais

### 1. `criarMatricula` (packages/lib/src/services/matricula.ts)

Função principal que cria a matrícula e dispara a integração com Asaas.

```typescript
export async function criarMatricula(rawData: CriarMatriculaInput) {
  // 1. Validação e busca de dados
  // 2. Criação de matrícula local
  // 3. Criação de cobranças locais
  // 4. Chamada para maybeCreateAsaasRecords
  // 5. Atualização com IDs do Asaas
  // 6. Log de integração
}
```

### 2. `maybeCreateAsaasRecords` (packages/lib/src/services/matricula.ts)

Cria customer e subscription no Asaas.

```typescript
async function maybeCreateAsaasRecords(params: {
  alunoId: string;
  contaId: string;
  valor: number;
  vencimento: Date;
}): Promise<{ subscriptionId: string | null; chargeId: string | null }> {
  // 1. Busca aluno e responsável
  // 2. Busca/Cria customer no Asaas (por CPF)
  // 3. Cria subscription (assinatura recorrente)
  // 4. Retorna IDs para salvar no banco
}
```

**Regras:**

- Se `ASAAS_INTEGRATION_ENABLED=false`, retorna null (não integra)
- Busca customer existente por CPF antes de criar novo
- Prioriza dados do responsável financeiro sobre aluno
- Não bloqueia matrícula em caso de erro (log de erro e continua)

### 3. Webhook `/api/asaas/webhooks` (apps/web/app/api/asaas/webhooks/route.ts)

Recebe eventos do Asaas e atualiza status local.

**Validação:**

- Verifica HMAC-SHA256 signature (ASAAS_WEBHOOK_SECRET)
- Idempotência por eventId (upsert)

**Eventos Processados:**

#### PAYMENT_RECEIVED / PAYMENT_CONFIRMED

```typescript
// 1. Busca cobrança por asaasPaymentId
// 2. Se não encontrou e há subscription, vincula primeira cobrança pendente
// 3. Atualiza status da cobrança para PAGO
// 4. Cria registro de pagamento
// 5. Se matrícula estava PENDENTE_TAXA, ativa (ATIVA)
```

#### PAYMENT_OVERDUE

```typescript
// 1. Busca cobrança por asaasPaymentId
// 2. Atualiza status para ATRASADO
```

#### PAYMENT_REFUNDED

```typescript
// 1. Busca cobrança por asaasPaymentId
// 2. Atualiza status para ESTORNADO
// 3. Marca pagamento como ESTORNADO
```

#### SUBSCRIPTION_CREATED

```typescript
// 1. Busca matrícula por asaasSubscriptionId
// 2. Log de assinatura criada
```

#### SUBSCRIPTION_DELETED

```typescript
// 1. Busca matrícula por asaasSubscriptionId
// 2. Atualiza status para CANCELADA
// 3. Log de assinatura cancelada
```

## Configuração

### Variáveis de Ambiente (.env.local)

```bash
# Asaas API
ASAAS_API_KEY=<seu_api_key_sandbox_ou_producao>
ASAAS_ENVIRONMENT=sandbox  # ou production
ASAAS_INTEGRATION_ENABLED=true

# Webhook
ASAAS_WEBHOOK_SECRET=<seu_webhook_secret>
```

### Configurar Webhook no Asaas

1. Acesse [https://sandbox.asaas.com/config/webhooks](https://sandbox.asaas.com/config/webhooks)
2. Configure a URL: `https://seu-dominio.com/api/asaas/webhooks`
3. Gere o webhook secret e salve em `ASAAS_WEBHOOK_SECRET`
4. Ative os eventos:
   - `PAYMENT_RECEIVED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_UPDATED`
   - `SUBSCRIPTION_DELETED`

## Testes

### 1. Teste Manual - Criar Matrícula

```bash
# 1. Certifique-se de que o ambiente está configurado
# 2. Acesse http://localhost:3000/matriculas
# 3. Preencha o wizard completo
# 4. Ao concluir, verifique os logs:

# Logs esperados:
[Asaas] Customer criado: cus_xxxxx
[Asaas] Subscription criada: sub_xxxxx

# 5. Verifique no banco:
SELECT id, asaasSubscriptionId, status FROM "Matricula" WHERE id = '<id_criado>';
SELECT id, asaasPaymentId, status FROM "Cobranca" WHERE matriculaId = '<id_criado>';
```

### 2. Teste Manual - Webhook

```bash
# Gerar assinatura HMAC para teste no Postman
echo -n '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","value":100,"status":"RECEIVED","paymentDate":"2025-10-03","subscription":"sub_xxxxx"}}' | \
  openssl dgst -sha256 -hmac '<ASAAS_WEBHOOK_SECRET>' -hex

# No Postman:
# POST http://localhost:3000/api/asaas/webhooks
# Headers:
#   asaas-signature: <hash_gerado_acima>
#   Content-Type: application/json
# Body (raw JSON):
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_123",
    "value": 100,
    "status": "RECEIVED",
    "paymentDate": "2025-10-03T12:00:00Z",
    "subscription": "sub_xxxxx"
  }
}
```

### 3. Teste de Integração Completo

1. Criar matrícula via wizard
2. Verificar subscription criada no Asaas
3. Simular pagamento no Asaas (sandbox)
4. Verificar webhook recebido
5. Verificar matrícula ativada no sistema

## Tratamento de Erros

### Erro na criação do customer/subscription

Se a API do Asaas retornar erro durante a criação da matrícula:

- ✅ A matrícula é criada localmente normalmente
- ✅ Os campos `asaasSubscriptionId` ficam NULL
- ✅ Log de erro é registrado no console
- ⚠️ Usuário não vê erro (fluxo continua)
- 🔄 Pode-se reprocessar manualmente depois

**Reprocessar manualmente:**

```typescript
// Script de reprocessamento (packages/lib/src/scripts/reprocessar-asaas.ts)
// Buscar matrículas sem asaasSubscriptionId e tentar criar novamente
```

### Erro no processamento do webhook

Se o webhook falhar ao processar um evento:

- ✅ Payload é salvo com status ERRO
- ✅ Retorna 200 OK (Asaas não reenvia)
- 🔄 Pode-se reprocessar manualmente no admin

**Reprocessar webhook:**

```sql
-- Buscar webhooks com erro
SELECT id, evento, payload FROM "WebhookAsaas" WHERE status = 'ERRO';

-- Marcar para reprocessamento
UPDATE "WebhookAsaas" SET status = 'RECEBIDO' WHERE id = '<id>';
```

## Monitoramento

### Logs Importantes

```typescript
// Matrícula criada
[Asaas] Customer criado: cus_xxxxx
[Asaas] Subscription criada: sub_xxxxx

// Webhook recebido
[Webhook Asaas] Recebido { eventId, event, hasPayment, hasSubscription }
[Webhook Asaas] Persistido { eventId, event, webhookId, status }
[Webhook Asaas] Processado com sucesso { eventId, event, status, duration }

// Erros
[Asaas] Erro ao criar records: <mensagem>
[Webhook Asaas] Assinatura inválida
[Webhook Asaas] Cobrança não encontrada para payment <id>
```

### Queries de Monitoramento

```sql
-- Matrículas sem integração Asaas
SELECT id, status, "createdAt"
FROM "Matricula"
WHERE "asaasSubscriptionId" IS NULL
  AND status != 'CANCELADA'
  AND "createdAt" > NOW() - INTERVAL '7 days';

-- Webhooks pendentes/erro
SELECT evento, status, COUNT(*)
FROM "WebhookAsaas"
WHERE status IN ('RECEBIDO', 'ERRO')
GROUP BY evento, status;

-- Cobranças sem asaasPaymentId mas com subscription
SELECT c.id, c.status, m."asaasSubscriptionId"
FROM "Cobranca" c
JOIN "Matricula" m ON m.id = c."matriculaId"
WHERE c."asaasPaymentId" IS NULL
  AND m."asaasSubscriptionId" IS NOT NULL
  AND c.tipo = 'MENSALIDADE'
  AND c.status = 'PENDENTE';
```

## Roadmap

### ✅ Implementado

- [x] Criação automática de customer no Asaas
- [x] Criação automática de subscription no Asaas
- [x] Webhook para recebimento de eventos
- [x] Sincronização de status de pagamento
- [x] Ativação automática de matrícula ao pagar taxa
- [x] Cancelamento de matrícula ao deletar subscription
- [x] Logs estruturados e auditoria

### 🔄 Em Progresso

- [ ] Script de reprocessamento de matrículas sem Asaas
- [ ] Script de reprocessamento de webhooks com erro
- [ ] Dashboard de monitoramento

### 📋 Planejado

- [ ] Cancelar subscription no Asaas ao cancelar matrícula localmente
- [ ] Sincronizar alterações de valor (upgrade/downgrade de plano)
- [ ] Criar cobranças extras no Asaas (multas, taxas adicionais)
- [ ] Notificações por email ao receber pagamento
- [ ] Retry automático para webhooks com erro
- [ ] Testes automatizados E2E com sandbox Asaas

## Suporte

Em caso de problemas:

1. Verifique os logs do servidor
2. Consulte a tabela `WebhookAsaas` para eventos recebidos
3. Verifique se `ASAAS_INTEGRATION_ENABLED=true`
4. Verifique se as credenciais estão corretas
5. Teste o webhook manualmente com Postman

Para reportar bugs ou sugerir melhorias, abra uma issue no GitHub.
