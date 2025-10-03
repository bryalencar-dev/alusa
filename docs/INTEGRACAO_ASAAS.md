# Integração Asaas (Sandbox) - Implementação

**Data:** 2 de outubro de 2025  
**Projeto:** Alusa  
**Status:** ✅ Implementação base completa

---

## 📋 Resumo Executivo

Integração completa com Asaas (ambiente sandbox) seguindo boas práticas do projeto:

- ✅ Next.js App Router
- ✅ Prisma ORM
- ✅ pnpm workspaces
- ✅ Fatias verticais (DB → Service → API → Validação)
- ✅ Zod para validação
- ✅ TypeScript estrito
- ✅ Feature flag para controle

---

## 1️⃣ Variáveis de Ambiente

### Arquivo: `.env.example`

```bash
# Asaas (Pagamentos)
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=coloque_sua_chave_sandbox_aqui
ASAAS_WEBHOOK_SECRET=coloque_um_segredo_webhook
FEATURE_ASAAS=true
```

### Configuração

1. **Obter API Key**: Painel Asaas → Integrações → API Key (sandbox)
2. **Gerar Webhook Secret**: `openssl rand -hex 32`
3. **Configurar `.env.local`** (nunca versionar `.env.local`)

---

## 2️⃣ Schema Prisma

### Migration: `20251003024810_add_asaas_integration_fields`

**Campos adicionados:**

```prisma
model Aluno {
  asaasCustomerId String? @unique  // ID do customer no Asaas
}

model Responsavel {
  asaasCustomerId String? @unique  // ID do customer no Asaas
}

model Matricula {
  asaasSubscriptionId String? @unique  // ID da assinatura recorrente
}

model Cobranca {
  asaasPaymentId String? @unique  // ID do pagamento individual
}

model Pagamento {
  asaasPaymentId String? @unique  // Vinculação com payment do Asaas
}

model WebhookAsaas {
  // Já existia, usado para logs de webhooks
  id           String    @id @default(cuid())
  contaId      String
  evento       String
  eventId      String?   @unique
  payload      Json
  recebidoEm   DateTime  @default(now())
  processadoEm DateTime?
  status       String    @default("PENDENTE")
}
```

---

## 3️⃣ Services (packages/lib/src/asaas)

### Estrutura

```
packages/lib/src/asaas/
├── client.ts         # Axios client configurado
├── customer.ts       # createCustomer, getCustomer, etc
├── subscription.ts   # createSubscription, getSubscription, etc
├── payment.ts        # createPayment, getPayment, etc
└── index.ts          # Exports consolidados
```

### Client (client.ts)

```typescript
import { getAsaasClient, isAsaasEnabled } from '@alusa/lib/src/asaas/client';

// Client singleton com interceptors
const client = getAsaasClient();

// Feature flag
if (isAsaasEnabled()) {
  // Integração habilitada
}
```

**Features:**

- ✅ Base URL configurável (sandbox/produção)
- ✅ Autenticação via `access_token` header
- ✅ Timeout 30s
- ✅ Interceptors para logs (dev only)
- ✅ Tratamento de erros estruturado

### Customer Service (customer.ts)

```typescript
import { createCustomer } from '@alusa/lib/src/asaas/customer';

const customer = await createCustomer({
  name: 'João Silva',
  cpfCnpj: '12345678901',
  email: 'joao@example.com',
  phone: '11987654321',
});

// Retorna: AsaasCustomer
```

**Funções:**

- `createCustomer(input)` → POST /customers
- `getCustomer(id)` → GET /customers/:id
- `updateCustomer(id, input)` → POST /customers/:id
- `deleteCustomer(id)` → DELETE /customers/:id
- `listCustomers(filters)` → GET /customers

### Subscription Service (subscription.ts)

```typescript
import { createSubscription } from '@alusa/lib/src/asaas/subscription';

const subscription = await createSubscription({
  customer: 'cus_000000000000',
  value: 199.9,
  billingType: 'BOLETO',
  nextDueDate: '2025-10-05',
  cycle: 'MONTHLY',
  description: 'Mensalidade Ballet Iniciante',
});

// Retorna: AsaasSubscription
```

**Funções:**

- `createSubscription(input)` → POST /subscriptions
- `getSubscription(id)` → GET /subscriptions/:id
- `updateSubscription(id, input)` → POST /subscriptions/:id
- `deleteSubscription(id)` → DELETE /subscriptions/:id
- `listSubscriptions(filters)` → GET /subscriptions
- `listSubscriptionPayments(id)` → GET /subscriptions/:id/payments

### Payment Service (payment.ts)

```typescript
import { createPayment } from '@alusa/lib/src/asaas/payment';

const payment = await createPayment({
  customer: 'cus_000000000000',
  value: 50.0,
  billingType: 'PIX',
  dueDate: '2025-10-10',
  description: 'Taxa de matrícula',
});

// Retorna: AsaasPayment
```

**Funções:**

- `createPayment(input)` → POST /payments
- `getPayment(id)` → GET /payments/:id
- `updatePayment(id, input)` → POST /payments/:id
- `deletePayment(id)` → DELETE /payments/:id
- `listPayments(filters)` → GET /payments
- `confirmCashPayment(id, date, value)` → POST /payments/:id/receiveInCash

---

## 4️⃣ API Routes

### POST /api/asaas/customers

**Propósito:** Criar customer no Asaas a partir de aluno ou responsável

**Request:**

```json
{
  "alunoId": "aluno-123",
  // OU
  "responsavelId": "resp-456",
  // OU
  "customData": {
    "name": "João Silva",
    "cpfCnpj": "12345678901",
    "email": "joao@example.com"
  }
}
```

**Response:**

```json
{
  "success": true,
  "customer": {
    "id": "cus_000000000000",
    "name": "João Silva",
    ...
  }
}
```

**Fluxo:**

1. Valida autenticação
2. Verifica feature flag
3. Busca dados do aluno/responsável
4. Cria customer no Asaas
5. Atualiza `asaasCustomerId` no banco
6. Retorna customer criado

**Idempotência:** Retorna 409 se já possui customerId

---

### POST /api/asaas/subscriptions

**Propósito:** Criar assinatura recorrente vinculada a uma matrícula

**Request:**

```json
{
  "matriculaId": "mat-789",
  "billingType": "BOLETO",
  "customerId": "cus_000000000000", // opcional
  "value": 199.9, // opcional (usa valor do plano)
  "nextDueDate": "2025-10-05", // opcional (usa vencimentoDia)
  "cycle": "MONTHLY" // opcional (derivado da periodicidade)
}
```

**Response:**

```json
{
  "success": true,
  "subscription": {
    "id": "sub_000000000000",
    "customer": "cus_000000000000",
    "value": 199.90,
    ...
  },
  "customerId": "cus_000000000000"
}
```

**Fluxo:**

1. Valida autenticação + feature flag
2. Busca matrícula (include: aluno, responsavelFinanceiro, plano)
3. Valida/cria customer se necessário
4. Calcula valor, vencimento, ciclo
5. Cria subscription no Asaas
6. Atualiza `matricula.asaasSubscriptionId`
7. Retorna subscription

**Lógica de customer:**

- Prioriza responsável financeiro
- Fallback para aluno
- Cria customer automaticamente se não existir

**Idempotência:** Retorna 409 se matrícula já possui subscription

---

### POST /api/asaas/webhooks

**Propósito:** Receber e processar webhooks do Asaas

**Headers:**

```
asaas-signature: <hmac-sha256-hex>
```

**Payload (exemplo):**

```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_000000000000",
    "customer": "cus_000000000000",
    "value": 199.9,
    "status": "RECEIVED",
    "paymentDate": "2025-10-05",
    "subscription": "sub_000000000000"
  }
}
```

**Eventos suportados:**

| Evento                 | Ação                                                      |
| ---------------------- | --------------------------------------------------------- |
| `PAYMENT_CONFIRMED`    | Marca cobrança como PAGA, cria pagamento, ativa matrícula |
| `PAYMENT_RECEIVED`     | Idem PAYMENT_CONFIRMED                                    |
| `PAYMENT_OVERDUE`      | Marca cobrança como ATRASADA                              |
| `PAYMENT_REFUNDED`     | Marca pagamento como ESTORNADO                            |
| `PAYMENT_DELETED`      | Marca cobrança como CANCELADA                             |
| `SUBSCRIPTION_DELETED` | Cancela matrícula (status CANCELADA)                      |
| `SUBSCRIPTION_UPDATED` | Verifica se inactive e cancela matrícula                  |

**Fluxo:**

1. Valida assinatura HMAC-SHA256
2. Parse do payload
3. Salva em `WebhookAsaas` com status RECEBIDO (upsert por eventId)
4. Processa evento:
   - Payment events → atualiza Cobranca + Pagamento + Matricula
   - Subscription events → atualiza Matricula
5. Marca webhook como PROCESSADO
6. Retorna 200 OK

**Segurança:**

- ✅ Validação de assinatura obrigatória
- ✅ Logs completos de payloads
- ✅ Idempotência por `eventId`
- ✅ Tratamento de erros (marca como ERRO mas não retorna 500)

**Idempotência:**

```typescript
await prisma.webhookAsaas.upsert({
  where: { eventId },
  update: { evento, payload, status: 'RECEBIDO' },
  create: { contaId, evento, eventId, payload, status: 'RECEBIDO' },
});
```

---

## 5️⃣ Testes

### Status atual

⚠️ **Testes ainda não implementados** (próxima fase)

### Plano de testes

#### Testes unitários (Vitest)

**Cliente Axios:**

```typescript
// packages/lib/src/asaas/__tests__/client.test.ts
describe('createAsaasClient', () => {
  it('deve criar client com configuração correta', () => {
    const client = createAsaasClient();
    expect(client.defaults.baseURL).toBe(process.env.ASAAS_BASE_URL);
    expect(client.defaults.headers['access_token']).toBe(process.env.ASAAS_API_KEY);
  });

  it('deve lançar erro se ASAAS_API_KEY não configurada', () => {
    delete process.env.ASAAS_API_KEY;
    expect(() => createAsaasClient()).toThrow('ASAAS_API_KEY não configurada');
  });
});
```

**Customer Service (mockar axios):**

```typescript
// packages/lib/src/asaas/__tests__/customer.test.ts
import { createCustomer } from '../customer';
import { getAsaasClient } from '../client';

vi.mock('../client');

describe('createCustomer', () => {
  it('deve chamar POST /customers com dados corretos', async () => {
    const mockPost = vi.fn().mockResolvedValue({
      data: { id: 'cus_123', name: 'João' },
    });
    vi.mocked(getAsaasClient).mockReturnValue({ post: mockPost } as any);

    const result = await createCustomer({
      name: 'João Silva',
      cpfCnpj: '12345678901',
    });

    expect(mockPost).toHaveBeenCalledWith('/customers', {
      name: 'João Silva',
      cpfCnpj: '12345678901',
    });
    expect(result.id).toBe('cus_123');
  });
});
```

**Webhook (validação de assinatura):**

```typescript
// apps/web/app/api/asaas/webhooks/__tests__/route.test.ts
describe('POST /api/asaas/webhooks', () => {
  it('deve rejeitar webhook com assinatura inválida', async () => {
    const response = await POST({
      text: () => Promise.resolve('{"event":"PAYMENT_CONFIRMED"}'),
      headers: { get: () => 'assinatura-invalida' },
    } as any);

    expect(response.status).toBe(401);
  });

  it('deve aceitar webhook com assinatura válida', async () => {
    const payload = '{"event":"PAYMENT_CONFIRMED","payment":{"id":"pay_123"}}';
    const signature = crypto
      .createHmac('sha256', process.env.ASAAS_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');

    const response = await POST({
      text: () => Promise.resolve(payload),
      headers: { get: (key: string) => (key === 'asaas-signature' ? signature : null) },
    } as any);

    expect(response.status).toBe(200);
  });
});
```

#### Testes E2E (Playwright)

**Fluxo completo de matrícula:**

```typescript
// apps/web/e2e/matricula-asaas.spec.ts
test('deve criar matrícula com pagamento Asaas', async ({ page }) => {
  // 1. Login
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'senha123');
  await page.click('button[type="submit"]');

  // 2. Criar aluno
  await page.goto('/alunos/novo');
  await page.fill('input[name="nome"]', 'João Silva');
  await page.fill('input[name="cpf"]', '12345678901');
  await page.click('button[type="submit"]');

  // 3. Criar customer no Asaas
  const alunoId = await page.locator('[data-aluno-id]').textContent();
  const customerResponse = await fetch('/api/asaas/customers', {
    method: 'POST',
    body: JSON.stringify({ alunoId }),
  });
  expect(customerResponse.ok).toBeTruthy();

  // 4. Criar matrícula
  await page.goto('/matriculas/nova');
  // ... preencher wizard
  await page.click('button[data-action="finalizar"]');

  // 5. Criar subscription
  const matriculaId = await page.locator('[data-matricula-id]').textContent();
  const subscriptionResponse = await fetch('/api/asaas/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      matriculaId,
      billingType: 'BOLETO',
    }),
  });
  expect(subscriptionResponse.ok).toBeTruthy();

  // 6. Simular webhook de pagamento confirmado
  // (usar endpoint de teste ou API do sandbox)
});
```

---

## 6️⃣ Segurança

### ✅ Checklist implementado

- [x] **API Key nunca em logs**: Interceptors não logam headers sensíveis
- [x] **Webhook com assinatura**: HMAC-SHA256 obrigatório
- [x] **Feature flag**: `FEATURE_ASAAS=true` controla ativação
- [x] **Autenticação nas routes**: `getServerSession` em todas as APIs
- [x] **Validação Zod**: Todos os inputs validados antes de processar
- [x] **TypeScript estrito**: No `any` (corrigido para tipos específicos)
- [x] **Idempotência**: Webhooks usam upsert por `eventId`
- [x] **Logs estruturados**: Console.log com prefixos `[Asaas ...]`

### ⚠️ Melhorias futuras

- [ ] Rate limiting em webhooks
- [ ] Retry automático em falhas de API (axios-retry)
- [ ] Criptografia de dados sensíveis no banco
- [ ] Auditoria completa de webhooks processados
- [ ] Multi-tenancy: vincular customer ao contaId correto

---

## 7️⃣ Próximos Passos

### Fase 2: Testes

- [ ] Testes unitários (client, customer, subscription, payment)
- [ ] Testes de integração (API routes)
- [ ] Testes E2E (fluxo completo)
- [ ] Coverage mínimo 80%

### Fase 3: UI

- [ ] Tela de configuração Asaas (habilitar/desabilitar)
- [ ] Botão "Gerar cobrança" em matrícula
- [ ] Listagem de cobranças pendentes
- [ ] Webhook logs UI (admin)
- [ ] Relatório de pagamentos recebidos

### Fase 4: Produção

- [ ] Migrar para ambiente de produção do Asaas
- [ ] Configurar webhooks no painel Asaas
- [ ] Monitoramento de falhas (Sentry, Datadog, etc)
- [ ] Backup de payloads de webhook
- [ ] Documentação de operação

---

## 8️⃣ Documentação de Referência

### Asaas API

- [Documentação oficial](https://docs.asaas.com)
- [Criar customer](https://docs.asaas.com/reference/criar-novo-cliente)
- [Criar subscription](https://docs.asaas.com/reference/criar-nova-assinatura)
- [Criar payment](https://docs.asaas.com/reference/criar-nova-cobranca)
- [Webhooks](https://docs.asaas.com/reference/webhooks)

### Sandbox

- **Base URL**: https://sandbox.asaas.com/api/v3
- **Painel**: https://sandbox.asaas.com
- **Cartões de teste**: Disponíveis na documentação

---

## 9️⃣ Troubleshooting

### Erro: "ASAAS_API_KEY não configurada"

**Solução:** Adicionar em `.env.local`:

```bash
ASAAS_API_KEY=sua_chave_aqui
```

### Erro: "Assinatura inválida" no webhook

**Solução:** Verificar se `ASAAS_WEBHOOK_SECRET` está correto e configurado no painel Asaas

### Erro: "Matrícula já possui assinatura Asaas"

**Solução:** Deletar subscription antiga ou usar endpoint de update

### Erro: Customer não encontrado

**Solução:** Verificar se `asaasCustomerId` foi salvo corretamente no banco

### Webhook não processa

**Solução:**

1. Verificar logs: `console.log('[Webhook Asaas]')`
2. Checar tabela `WebhookAsaas` (status ERRO?)
3. Validar payload manualmente

---

## 🎉 Status Final

**✅ Implementação base completa!**

- ✅ Variáveis de ambiente configuradas
- ✅ Schema Prisma atualizado (migration aplicada)
- ✅ Services criados (client, customer, subscription, payment)
- ✅ API Routes funcionais (/api/asaas/customers, /subscriptions, /webhooks/asaas)
- ✅ Webhook receiver com validação de assinatura
- ✅ Idempotência implementada
- ✅ Segurança validada
- ⚠️ Testes pendentes (próxima fase)

**Próxima ação recomendada:** Implementar testes unitários para validar lógica de negócio.
