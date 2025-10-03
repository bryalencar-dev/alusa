# ✅ Sincronização Matrícula → Asaas - IMPLEMENTADA

## Status: 🟢 FUNCIONAL

A integração entre o sistema de matrículas Alusa e o gateway de pagamento Asaas está **totalmente implementada e funcional**.

## O que foi feito

### 1. ✅ Criação Automática de Customer e Subscription

- Ao criar uma matrícula, o sistema:
  - Busca ou cria um **customer** no Asaas (por CPF do aluno/responsável)
  - Cria uma **subscription** (assinatura recorrente mensal)
  - Salva o `asaasSubscriptionId` na matrícula
  - Registra log de integração

**Arquivo:** `packages/lib/src/services/matricula.ts` (função `maybeCreateAsaasRecords`)

### 2. ✅ Webhook Sincronizado

- Webhook recebe eventos do Asaas e atualiza status local:
  - `PAYMENT_RECEIVED` → Marca cobrança como PAGO, ativa matrícula
  - `PAYMENT_OVERDUE` → Marca cobrança como ATRASADO
  - `PAYMENT_REFUNDED` → Marca cobrança como ESTORNADO
  - `SUBSCRIPTION_CREATED` → Log de assinatura criada
  - `SUBSCRIPTION_DELETED` → Cancela matrícula

**Arquivo:** `apps/web/app/api/asaas/webhooks/route.ts`

### 3. ✅ Vinculação Inteligente de Payments

- Quando o Asaas envia o primeiro payment de uma subscription, o webhook vincula automaticamente à cobrança pendente
- Suporta múltiplas cobranças por matrícula (taxa + mensalidades)

### 4. ✅ Logs e Auditoria

- Todos os eventos são registrados em `MatriculaLog`
- Webhooks são persistidos em `WebhookAsaas` com idempotência
- Logs estruturados para monitoramento

### 5. ✅ Tratamento de Erros

- Se a API do Asaas falhar, a matrícula é criada localmente normalmente
- Os campos `asaasSubscriptionId` ficam NULL (pode reprocessar depois)
- Webhooks com erro são marcados e podem ser reprocessados

## Arquivos Modificados

```
packages/lib/src/services/matricula.ts
  ├─ maybeCreateAsaasRecords() - Cria customer e subscription no Asaas
  └─ criarMatricula() - Salva IDs do Asaas na matrícula e cobrança

apps/web/app/api/asaas/webhooks/route.ts
  ├─ processPaymentEvent() - Vincula payments e atualiza status
  └─ processSubscriptionEvent() - Logs e cancelamentos

docs/asaas/INTEGRACAO_MATRICULA.md
  └─ Documentação completa do fluxo

apps/web/scripts/test-asaas-integration.mjs
  └─ Script de teste e validação
```

## Como Testar

### 1. Configurar Ambiente

```bash
# .env.local
ASAAS_API_KEY=<seu_api_key_sandbox>
ASAAS_ENVIRONMENT=sandbox
ASAAS_INTEGRATION_ENABLED=true
ASAAS_WEBHOOK_SECRET=<seu_webhook_secret>
```

### 2. Configurar Webhook no Asaas

1. Acesse: https://sandbox.asaas.com/config/webhooks
2. URL: `https://seu-dominio.com/api/asaas/webhooks`
3. Gere o secret e salve em `ASAAS_WEBHOOK_SECRET`
4. Ative os eventos: `PAYMENT_*`, `SUBSCRIPTION_*`

### 3. Criar Matrícula via UI

```bash
# Inicie o servidor
pnpm dev

# Acesse
http://localhost:3000/matriculas

# Preencha o wizard completo
# Ao concluir, verifique os logs do servidor:
[Asaas] Customer criado: cus_xxxxx
[Asaas] Subscription criada: sub_xxxxx
```

### 4. Verificar no Banco

```sql
-- Matrícula com subscription
SELECT id, "asaasSubscriptionId", status
FROM "Matricula"
WHERE id = '<id_criado>';

-- Cobranças
SELECT id, tipo, "asaasPaymentId", status
FROM "Cobranca"
WHERE "matriculaId" = '<id_criado>';
```

### 5. Testar Webhook (Postman)

```bash
# Gerar assinatura HMAC
echo -n '{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","value":100,"status":"RECEIVED","paymentDate":"2025-10-03T12:00:00Z","subscription":"sub_xxxxx"}}' | \
  openssl dgst -sha256 -hmac '<ASAAS_WEBHOOK_SECRET>' -hex

# POST http://localhost:3000/api/asaas/webhooks
# Headers:
#   asaas-signature: <hash_acima>
#   Content-Type: application/json
# Body: (payload acima)
```

### 6. Script de Validação

```bash
cd apps/web
node scripts/test-asaas-integration.mjs --dry-run --verbose
```

## Fluxo Completo

```
┌──────────────────────────────────────────────────────────┐
│ 1. Usuário cria matrícula no wizard                      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 2. API POST /api/matriculas                              │
│    → Validação, cálculo de preços                        │
│    → Criação de matrícula e cobranças locais             │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 3. maybeCreateAsaasRecords()                             │
│    → Busca/Cria customer no Asaas                        │
│    → Cria subscription no Asaas                          │
│    → Salva asaasSubscriptionId na matrícula              │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 4. Asaas envia webhooks                                  │
│    → SUBSCRIPTION_CREATED (log)                          │
│    → PAYMENT_RECEIVED (ativa matrícula, marca PAGO)      │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 5. Sistema sincronizado ✅                               │
│    → Matrícula: ATIVA                                    │
│    → Cobrança: PAGO                                      │
│    → Logs de auditoria completos                         │
└──────────────────────────────────────────────────────────┘
```

## Monitoramento

### Queries Úteis

```sql
-- Matrículas sem integração Asaas (últimos 7 dias)
SELECT id, status, "createdAt"
FROM "Matricula"
WHERE "asaasSubscriptionId" IS NULL
  AND status != 'CANCELADA'
  AND "createdAt" > NOW() - INTERVAL '7 days';

-- Webhooks com erro
SELECT evento, status, payload
FROM "WebhookAsaas"
WHERE status = 'ERRO'
ORDER BY "recebidoEm" DESC;

-- Cobranças pendentes com subscription ativa
SELECT c.id, c.status, m."asaasSubscriptionId"
FROM "Cobranca" c
JOIN "Matricula" m ON m.id = c."matriculaId"
WHERE c."asaasPaymentId" IS NULL
  AND m."asaasSubscriptionId" IS NOT NULL
  AND c.tipo = 'MENSALIDADE'
  AND c.status = 'PENDENTE';
```

## Próximos Passos (Futuro)

- [ ] Script de reprocessamento de matrículas sem Asaas
- [ ] Cancelar subscription no Asaas ao cancelar matrícula localmente
- [ ] Dashboard de monitoramento em tempo real
- [ ] Notificações por email ao receber pagamento
- [ ] Testes automatizados E2E

## Documentação Completa

Para detalhes técnicos, consulte:

- [`docs/asaas/INTEGRACAO_MATRICULA.md`](./INTEGRACAO_MATRICULA.md) - Documentação técnica completa

## Suporte

Em caso de problemas:

1. Verifique os logs do servidor
2. Consulte a tabela `WebhookAsaas`
3. Verifique as variáveis de ambiente
4. Execute o script de validação

---

**Última atualização:** 3 de outubro de 2025  
**Status:** ✅ Implementado e testado
