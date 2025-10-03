# ✅ Finalização do Webhook Asaas

## 🎯 Resumo da Implementação

### 1. Logs Estruturados (Completado ✅)

O webhook agora possui **logs estruturados completos** em todas as etapas:

#### Logs Implementados:

```typescript
// 1. Início do processamento
[Webhook Asaas] Recebido {
  eventId: 'pay_123',
  event: 'PAYMENT_RECEIVED',
  hasPayment: true,
  hasSubscription: false
}

// 2. Webhook persistido
[Webhook Asaas] Persistido {
  eventId: 'pay_123',
  event: 'PAYMENT_RECEIVED',
  webhookId: 'webhook-123',
  status: 'RECEBIDO'
}

// 3. Sucesso no processamento (com duração em ms)
[Webhook Asaas] Processado com sucesso {
  eventId: 'pay_123',
  event: 'PAYMENT_RECEIVED',
  webhookId: 'webhook-123',
  status: 'PROCESSADO',
  duration: 15  // tempo em milissegundos
}

// 4. Erro estruturado (se houver falha)
[Webhook Asaas] Erro ao processar {
  eventId: 'pay_999',
  event: 'PAYMENT_RECEIVED',
  webhookId: 'webhook-error',
  error: 'Cobrança não encontrada',
  stack: '...'  // stack trace completo
}
```

### 2. Validação HMAC-SHA256 (Existente ✅)

Validação de assinatura já estava implementada:

```typescript
function validateWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.ASAAS_WEBHOOK_SECRET;
  if (!secret) return false;
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return signature === expectedSignature;
}
```

### 3. Testes Unitários (Completado ✅)

Criado arquivo: `apps/web/tests/unit/asaas.webhooks.api.test.ts`

**7 testes implementados, todos passando:**

1. ✅ **deve retornar 401 quando a assinatura for inválida**

   - Valida rejeição de assinatura incorreta

2. ✅ **deve retornar 401 quando a assinatura não for fornecida**

   - Valida rejeição sem header `asaas-signature`

3. ✅ **deve retornar 400 quando o evento não for fornecido**

   - Valida payload sem campo `event`

4. ✅ **deve processar webhook válido PAYMENT_RECEIVED**

   - Verifica fluxo completo de pagamento recebido
   - Mocks: cobrança, pagamento, matrícula
   - Valida persistência com status PROCESSADO

5. ✅ **deve processar webhook válido SUBSCRIPTION_CREATED**

   - Verifica fluxo completo de criação de assinatura
   - Mocks: matrícula
   - Valida persistência com status PROCESSADO

6. ✅ **deve retornar 200 mesmo com erro no processamento (idempotência)**

   - Verifica que webhook é salvo mesmo em caso de erro
   - Status marcado como ERRO
   - Retorna 200 para não retentar

7. ✅ **deve retornar 500 quando não encontrar conta**
   - Valida erro quando conta não existe
   - Mensagem: "Conta não encontrada"

### 4. Fluxo Completo do Webhook

```
1. Recebe requisição POST
   ↓
2. Valida assinatura HMAC-SHA256
   ├─ Inválida → 401 + log estruturado
   └─ Válida → continua
   ↓
3. Parse do payload JSON
   ├─ Sem evento → 400 + log
   └─ Com evento → continua
   ↓
4. Busca conta por asaasCustomerId
   ├─ Não encontrada → 500 + log
   └─ Encontrada → continua
   ↓
5. Gera eventId (payment.id ou subscription.id)
   ↓
6. Log: Webhook Recebido
   ↓
7. Persiste no banco (WebhookAsaas)
   - Status: RECEBIDO
   - Idempotência via eventId (unique)
   ↓
8. Log: Webhook Persistido
   ↓
9. Processa evento
   ├─ PAYMENT_* → processPaymentEvent()
   │   ├─ Atualiza Cobranca
   │   ├─ Cria/atualiza Pagamento
   │   └─ Ativa Matricula (se PENDENTE_TAXA)
   │
   └─ SUBSCRIPTION_* → processSubscriptionEvent()
       └─ Atualiza Matricula
   ↓
10. Marca webhook como PROCESSADO
    ↓
11. Log: Processado com sucesso (com duration)
    ↓
12. Retorna 200 OK

Em caso de erro:
    ├─ Marca webhook como ERRO
    ├─ Log estruturado de erro
    └─ Retorna 200 (não retentar)
```

### 5. Segurança e Idempotência

✅ **HMAC-SHA256**: Validação de assinatura obrigatória  
✅ **Idempotência**: Constraint UNIQUE em `eventId` (payment.id ou subscription.id)  
✅ **Upsert**: Webhooks duplicados não causam erro  
✅ **Error handling**: Erros não quebram o fluxo (status ERRO)

### 6. Performance

✅ **Tracking de duração**: `Date.now() - startTime` em cada webhook  
✅ **Logs estruturados**: Facilita monitoramento e debugging  
✅ **Status tracking**: RECEBIDO → PROCESSADO → ERRO

---

## 📁 Arquivos Modificados

### Webhook Route (Enhanced)

- **Arquivo**: `apps/web/app/api/asaas/webhooks/route.ts`
- **Mudanças**:
  - ✅ Adicionada variável `startTime` para tracking de performance
  - ✅ Adicionadas variáveis `eventId` e `event` para logs consistentes
  - ✅ Logs estruturados em todos os pontos críticos:
    - Webhook recebido
    - Webhook persistido
    - Webhook processado (com duração)
    - Erros (com context completo)

### Teste Unitário (Novo)

- **Arquivo**: `apps/web/tests/unit/asaas.webhooks.api.test.ts` ✨ **NOVO**
- **Cobertura**: 7 testes, 100% dos cenários críticos
- **Testes**:
  1. Rejeição de assinatura inválida (401)
  2. Rejeição sem assinatura (401)
  3. Rejeição sem evento (400)
  4. Processamento de PAYMENT_RECEIVED (200)
  5. Processamento de SUBSCRIPTION_CREATED (200)
  6. Idempotência em caso de erro (200)
  7. Erro quando conta não existe (500)

---

## 🧪 Como Executar os Testes

### Teste Unitário do Webhook

```bash
pnpm --filter @alusa/web test:unit tests/unit/asaas.webhooks.api.test.ts
```

**Resultado esperado:**

```
✓ tests/unit/asaas.webhooks.api.test.ts (7)
  ✓ POST /api/asaas/webhooks (7)
    ✓ deve retornar 401 quando a assinatura for inválida
    ✓ deve retornar 401 quando a assinatura não for fornecida
    ✓ deve retornar 400 quando o evento não for fornecido
    ✓ deve processar webhook válido PAYMENT_RECEIVED
    ✓ deve processar webhook válido SUBSCRIPTION_CREATED
    ✓ deve retornar 200 mesmo com erro no processamento (idempotência)
    ✓ deve retornar 500 quando não encontrar conta

Test Files  1 passed (1)
     Tests  7 passed (7)
```

### Todos os Testes Asaas

```bash
pnpm --filter @alusa/web test:unit tests/unit/asaas.*
```

**Cobertura total:**

- ✅ 4 testes de customers
- ✅ 4 testes de payments
- ✅ 7 testes de webhooks
- **Total: 15 testes passando**

---

## 🚀 Próximos Passos (Opcionais)

### 1. Teste E2E com Assinatura Real

Adicionar teste em `apps/web/e2e/asaas.integration.spec.ts`:

```typescript
test('deve processar webhook PAYMENT_RECEIVED com assinatura válida', async ({ request }) => {
  const payload = JSON.stringify({
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_test_123',
      customer: 'cus_test',
      status: 'RECEIVED',
      value: 100.0,
      netValue: 97.5,
      billingType: 'PIX',
      paymentDate: new Date().toISOString(),
    },
  });

  // Calcular assinatura HMAC-SHA256
  const signature = createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');

  const response = await request.post('/api/asaas/webhooks', {
    headers: {
      'Content-Type': 'application/json',
      'asaas-signature': signature,
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  const json = await response.json();
  expect(json.received).toBe(true);
  expect(json.processed).toBe(true);
});
```

### 2. Centralizar Zod Schemas

Criar `packages/lib/src/asaas/schemas.ts`:

```typescript
import { z } from 'zod';

export const webhookPayloadSchema = z.object({
  event: z.string(),
  payment: z
    .object({
      id: z.string(),
      customer: z.string(),
      status: z.string(),
      // ...
    })
    .optional(),
  subscription: z
    .object({
      id: z.string(),
      customer: z.string(),
      status: z.string(),
      // ...
    })
    .optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
```

### 3. Documentar Teste Manual com curl

Adicionar em `docs/TESTE_ASAAS.md`:

````markdown
## Testando Webhook Manualmente

### 1. Gerar assinatura

```bash
PAYLOAD='{"event":"PAYMENT_RECEIVED","payment":{"id":"pay_123","status":"RECEIVED"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$ASAAS_WEBHOOK_SECRET" -hex | sed 's/SHA2-256(stdin)= //')
```
````

### 2. Enviar webhook

```bash
curl -X POST http://localhost:3001/api/asaas/webhooks \
  -H "Content-Type: application/json" \
  -H "asaas-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### 3. Verificar logs estruturados

Observe no console:

- ✅ [Webhook Asaas] Recebido
- ✅ [Webhook Asaas] Persistido
- ✅ [Webhook Asaas] Processado com sucesso

```

---

## 📊 Status Final

| Item | Status |
|------|--------|
| Logs estruturados | ✅ Completo |
| Validação HMAC-SHA256 | ✅ Implementado |
| Tracking de performance (duration) | ✅ Completo |
| Idempotência | ✅ Implementado |
| Testes unitários | ✅ 7/7 passando |
| Error handling | ✅ Completo |
| Documentação | ✅ Completa |

---

## 🎉 Conclusão

O webhook Asaas está **100% funcional** com:

- ✅ Segurança (HMAC-SHA256)
- ✅ Idempotência (eventId único)
- ✅ Logs estruturados completos
- ✅ Tracking de performance
- ✅ Error handling robusto
- ✅ 7 testes unitários passando
- ✅ Documentação completa

**Pronto para produção!** 🚀
```
