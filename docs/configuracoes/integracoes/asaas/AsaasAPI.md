# Integração — Asaas API

> **Última atualização:** 02/10/2025  
> **Status:** ✅ Funcionando

---

## 1. Visão Geral

A integração Asaas é o núcleo financeiro da Alusa, permitindo:

- **Customers**: Sincronização automática de alunos/responsáveis como clientes
- **Subscriptions**: Criação e gestão de assinaturas recorrentes (mensalidades)
- **Payments**: Cobranças avulsas (taxa de matrícula) e pagamentos de assinatura
- **Webhooks**: Atualização automática de status de pagamentos
- **Multi-tenancy**: Credenciais por conta (escola)

---

## 2. Arquitetura e Estrutura de Pastas

```
packages/lib/src/asaas/
├── index.ts                    # Barrel exports do módulo
├── client.ts                   # Cliente HTTP (getAsaasClient, getAsaasClientForConta)
├── env.ts                      # URLs, validação de ambiente
├── credentials.ts              # Gestão de credenciais por conta
├── types.ts                    # Tipos TypeScript completos
├── schemas.ts                  # Schemas Zod para validação
├── utils.ts                    # Helpers (formatDate, calcularProximoVencimento)
│
├── customer.ts                 # CRUD de customers
├── customer.helpers.ts         # Helpers de customer
│
├── subscription.ts             # CRUD de subscriptions (assinaturas)
├── subscription.helpers.ts     # Helpers de subscription
│
├── payment.ts                  # CRUD de payments (cobranças)
├── payment-helpers.ts          # Helpers para cobranças avulsas
│
├── financeiroService.ts        # Operações financeiras (pausar, reativar, etc)
├── logFinanceiro.ts            # Log de ações financeiras
└── logIntegracao.ts            # Log de integração Asaas

packages/lib/src/services/
├── matricula.ts                # Criação de matrícula + sync Asaas
│   ├── criarMatricula()
│   ├── maybeCreateAsaasRecords()       # Cria subscription
│   └── maybeCreateAsaasTaxaPayment()   # Cria payment de taxa

packages/lib/src/alunos/
├── aluno.service.ts            # CRUD de alunos
└── sync-aluno-asaas.ts         # Sync aluno ↔ customer
    ├── syncAlunoWithAsaas()
    ├── updateAlunoInAsaas()
    └── unsyncAlunoFromAsaas()

apps/web/app/api/
├── matriculas/
│   ├── route.ts                        # POST: cria matrícula + subscription
│   └── [id]/
│       ├── route.ts                    # GET/PATCH matrícula
│       ├── status/route.ts             # PATCH: ativar/cancelar matrícula
│       ├── forma-pagamento/route.ts    # PUT: alterar forma de pagamento
│       ├── juros-multa/route.ts        # PUT: alterar juros/multa
│       ├── valor/route.ts              # PUT: alterar valor da assinatura
│       ├── gerar-pix/route.ts          # POST: gerar QR code PIX
│       └── reenviar-cobranca/route.ts  # POST: reenviar cobrança
│
├── financeiro/
│   ├── pausar-assinatura/route.ts      # POST: pausar subscription
│   ├── reativar-assinatura/route.ts    # POST: reativar subscription
│   ├── deletar-cobranca/route.ts       # POST: deletar payment
│   ├── gerar-segunda-via/route.ts      # POST: gerar segunda via
│   ├── reenviar-cobranca/route.ts      # POST: reenviar notificação
│   ├── refund-cobranca/route.ts        # POST: estornar payment
│   └── confirmar-manual/route.ts       # POST: confirmar pagamento manual
│
├── webhooks/asaas/route.ts             # POST: recebe eventos Asaas
│
└── integracoes/asaas/
    ├── testar/route.ts                 # POST: testar conexão
    └── token/route.ts                  # PUT: salvar token
```

---

## 3. Endpoints da API Asaas Utilizados

### 3.1 Customers (Clientes)

| Método | Endpoint | Função na Alusa |
|--------|----------|-----------------|
| `POST` | `/v3/customers` | `createCustomer()` |
| `POST` | `/v3/customers/{id}` | `updateCustomer()` |
| `DELETE` | `/v3/customers/{id}` | `deleteCustomer()` |
| `GET` | `/v3/customers/{id}` | `getCustomer()` |
| `GET` | `/v3/customers` | `listCustomers()` |

### 3.2 Subscriptions (Assinaturas)

| Método | Endpoint | Função na Alusa | Observações |
|--------|----------|-----------------|-------------|
| `POST` | `/v3/subscriptions` | `createSubscription()` | Cria nova assinatura recorrente |
| `PUT` | `/v3/subscriptions/{id}` | `updateSubscription()` | Atualiza assinatura (valor, vencimento, status) |
| `DELETE` | `/v3/subscriptions/{id}` | `deleteSubscription()` | **Remove assinatura + cobranças pendentes** |
| `GET` | `/v3/subscriptions/{id}` | `getSubscription()` | Recupera dados da assinatura |
| `GET` | `/v3/subscriptions` | `listSubscriptions()` | Lista assinaturas |
| `GET` | `/v3/subscriptions/{id}/payments` | `listSubscriptionPayments()` | Lista cobranças da assinatura |

#### Gerenciamento de Status da Assinatura

```typescript
// PUT /v3/subscriptions/{id}

// Para PAUSAR (inativar):
{ status: 'INACTIVE' }
// → Para de gerar novas cobranças

// Para REATIVAR:
{ status: 'ACTIVE', nextDueDate: '2025-02-01' }
// → Volta a gerar cobranças a partir de nextDueDate (OBRIGATÓRIO)

// Para atualizar valor em cobranças pendentes também:
{ value: 350.00, updatePendingPayments: true }
```

> ⚠️ **ATENÇÃO:** `DELETE` remove a assinatura E todas as cobranças pendentes/vencidas automaticamente!

### 3.3 Payments (Cobranças)

| Método | Endpoint | Função na Alusa |
|--------|----------|-----------------|
| `POST` | `/v3/payments` | `createPayment()` |
| `PUT` | `/v3/payments/{id}` | `updatePayment()` |
| `DELETE` | `/v3/payments/{id}` | `deletePayment()` |
| `GET` | `/v3/payments/{id}` | `getPayment()` |
| `GET` | `/v3/payments` | `listPayments()` |
| `POST` | `/v3/payments/{id}/restore` | `restorePayment()` |
| `POST` | `/v3/payments/{id}/receiveInCash` | `confirmCashPayment()` |
| `POST` | `/v3/payments/{id}/undoReceivedInCash` | `undoCashPayment()` |
| `GET` | `/v3/payments/{id}/pixQrCode` | `getPixQrCode()` |

---

## 4. Fluxo de Criação de Matrícula

```
┌──────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│ POST /api/       │     │  criarMatricula()   │     │maybeCreateAsaasRecords│
│   matriculas     │ ──► │ matricula.service   │ ──► │  (cria subscription)  │
└──────────────────┘     └─────────────────────┘     └───────────────────────┘
                                  │                            │
                                  │                            ▼
                                  │                  ┌───────────────────────┐
                                  │                  │ POST /v3/subscriptions│
                                  │                  │   billingType, cycle  │
                                  │                  │   value, nextDueDate  │
                                  │                  └───────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────────────┐
                         │maybeCreateAsaasTaxaPayment│
                         │  (se gerarCobrancaTaxa   │
                         │   || pagarTaxaAgora)     │
                         └─────────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────────────┐
                         │   POST /v3/payments     │
                         │   (cobrança avulsa)     │
                         └─────────────────────────┘
```

### 4.1 Dados da Subscription

```typescript
// POST /v3/subscriptions
{
  customer: string,              // ID do customer Asaas
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED',
  value: number,                 // Valor mensal
  nextDueDate: 'YYYY-MM-DD',     // Data do primeiro vencimento
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'YEARLY',
  description: string,           // Ex: "Mensalidade - Turma Ballet Infantil"
  externalReference: string,     // ID da matrícula: "matricula-{id}"
  endDate?: 'YYYY-MM-DD',        // Data fim (calculada pelo plano)
  updatePendingPayments?: boolean, // Atualiza cobranças pendentes
  fine?: {                       // Multa por atraso
    value: number,
    type: 'PERCENTAGE'
  },
  interest?: {                   // Juros por atraso
    value: number,
    type: 'PERCENTAGE'
  }
}
```

### 4.2 Mapeamento de Enums

**Forma de Pagamento (Alusa → Asaas):**
| Alusa | Asaas |
|-------|-------|
| `PIX` | `PIX` |
| `CARTAO_CREDITO` | `CREDIT_CARD` |
| `BOLETO` | `BOLETO` |
| `INDEFINIDO` | `UNDEFINED` |

**Periodicidade (Alusa → Asaas):**
| Alusa | Asaas |
|-------|-------|
| `MENSAL` | `MONTHLY` |
| `SEMANAL` | `WEEKLY` |
| `QUINZENAL` | `BIWEEKLY` |
| `TRIMESTRAL` | `QUARTERLY` |
| `ANUAL` | `YEARLY` |

---

## 5. Fluxo de Sincronização de Alunos

### 5.1 Criar Aluno → Criar Customer

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  POST /api/     │     │   createAluno()      │     │ syncAlunoWithAsaas()│
│    alunos       │ ──► │   aluno.service.ts   │ ──► │ sync-aluno-asaas.ts │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────────┐
                                                    │ POST /v3/customers  │
                                                    └─────────────────────┘
```

### 5.2 Regras de Customer

| Situação | Quem vira Customer | externalReference |
|----------|-------------------|-------------------|
| Aluno ≥ 18 anos | Próprio aluno | `aluno-{alunoId}` |
| Aluno < 18 anos | Responsável financeiro | `aluno-{alunoId}` |

---

## 6. Webhooks

### 6.1 Endpoint

```
POST /api/webhooks/asaas
```

### 6.2 Eventos de Pagamento Tratados

#### Eventos de Pagamento Confirmado

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_CONFIRMED` | `PAGO` | Pagamento confirmado pelo banco |
| `PAYMENT_RECEIVED` | `PAGO` | Pagamento recebido na conta |
| `PAYMENT_RECEIVED_IN_CASH` | `PAGO` | Pagamento manual confirmado |

#### Eventos de Atraso/Vencimento

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_OVERDUE` | `ATRASADO` | Cobrança passou da data de vencimento |
| `PAYMENT_DUNNING_REQUESTED` | `ATRASADO` | Negativação solicitada (SPC/Serasa) |
| `PAYMENT_DUNNING_RECEIVED` | `ATRASADO` | Negativação recebida |

#### Eventos de Estorno/Reembolso

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_REFUNDED` | `ESTORNADO` ou `ESTORNADO_PARCIAL` | Pagamento estornado |
| `PAYMENT_REFUND_IN_PROGRESS` | `PROCESSANDO` | Estorno em processamento |

#### Eventos de Chargeback (Disputa de Cartão)

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_CHARGEBACK_REQUESTED` | `PROCESSANDO` | Cliente solicitou chargeback |
| `PAYMENT_CHARGEBACK_DISPUTE` | `PROCESSANDO` | Disputa em andamento |
| `PAYMENT_AWAITING_CHARGEBACK_REVERSAL` | `PROCESSANDO` | Aguardando reversão |

#### Eventos de Cancelamento

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_DELETED` | `CANCELADO` | Cobrança deletada |
| `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED` | `CANCELADO` | Captura de cartão recusada |
| `PAYMENT_REPROVED_BY_RISK_ANALYSIS` | `CANCELADO` | Reprovado na análise de risco |

#### Eventos de Restauração/Reativação

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_RESTORED` | `A_VENCER`/`PENDENTE`/`ATRASADO` | Cobrança restaurada (baseado na data) |
| `PAYMENT_RECEIVED_IN_CASH_UNDONE` | `PENDENTE`/`ATRASADO` | Confirmação manual desfeita |
| `PAYMENT_APPROVED_BY_RISK_ANALYSIS` | `A_VENCER`/`PENDENTE` | Aprovado na análise de risco |

#### Eventos de Processamento/Análise

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_AWAITING_RISK_ANALYSIS` | `PROCESSANDO` | Aguardando análise de risco |
| `PAYMENT_AUTHORIZED` | `PROCESSANDO` | Pagamento autorizado |

#### Eventos de Criação/Atualização

| Evento Asaas | Status Alusa | Descrição |
|--------------|--------------|-----------|
| `PAYMENT_CREATED` | `A_VENCER`/`PENDENTE` | Cobrança criada (baseado na data) |
| `PAYMENT_UPDATED` | (atualiza dados) | Atualiza forma de pagamento, valor, vencimento |

#### Eventos Apenas Log (sem alteração de status)

| Evento Asaas | Ação | Descrição |
|--------------|------|-----------|
| `PAYMENT_ANTICIPATED` | Log | Cobrança foi antecipada |
| `PAYMENT_CHECKOUT_VIEWED` | Log | Cliente visualizou checkout |
| `PAYMENT_BANK_SLIP_VIEWED` | Log | Cliente visualizou boleto |

### 6.3 Estratégias de Vinculação

O webhook tenta vincular o pagamento ao sistema Alusa usando (em ordem):

1. `asaasPaymentId` - Match direto pelo ID do payment
2. `subscription` - Match pela subscription (matrícula)
3. `externalReference` - Match pelo identificador externo

### 6.4 Idempotência

Cada evento possui um `eventId` único. O sistema verifica se já foi processado antes de executar.

### 6.5 Mapeamento Status Asaas → Alusa

| Status Asaas | Status Alusa |
|--------------|--------------|
| `PENDING` | `A_VENCER` ou `PENDENTE` |
| `RECEIVED` | `PAGO` |
| `CONFIRMED` | `PAGO` |
| `OVERDUE` | `ATRASADO` |
| `DELETED` | `CANCELADO` |
| `REFUNDED` | `ESTORNADO` |
| `RECEIVED_IN_CASH` | `PAGO` |
| `AWAITING_RISK_ANALYSIS` | `PROCESSANDO` |
| `CHARGEBACK_REQUESTED` | `PROCESSANDO` |
| `CHARGEBACK_DISPUTE` | `PROCESSANDO` |
| `DUNNING_REQUESTED` | `ATRASADO` |
| `DUNNING_RECEIVED` | `ATRASADO` |

---

## 7. Ações da Matrícula (Sincronização com Asaas)

A matrícula possui 3 ações principais que afetam a assinatura no Asaas:

### 7.1 **Pausar** (Status: PAUSADA)

**O que faz:**
- Inativa a assinatura no Asaas (`status: 'INACTIVE'`)
- A assinatura PARA de gerar novas cobranças
- Cobranças já geradas NÃO são afetadas

**Endpoint Asaas:**
```
PUT /v3/subscriptions/{id}
Body: { "status": "INACTIVE" }
```

**Função na Alusa:**
```typescript
// packages/lib/src/asaas/subscription.ts
await inactivateSubscription(asaasSubscriptionId, { contaId });
```

**Webhook esperado:** `SUBSCRIPTION_INACTIVATED`

---

### 7.2 **Reativar** (Status: ATIVA)

**O que faz:**
- Reativa a assinatura no Asaas (`status: 'ACTIVE'`)
- **OBRIGATÓRIO** informar `nextDueDate` (próxima data de vencimento)
- A assinatura volta a gerar cobranças

**Endpoint Asaas:**
```
PUT /v3/subscriptions/{id}
Body: { "status": "ACTIVE", "nextDueDate": "2025-02-01" }
```

**Função na Alusa:**
```typescript
// packages/lib/src/asaas/subscription.ts
await reactivateSubscription(asaasSubscriptionId, '2025-02-01', { contaId });
```

**Webhooks esperados:** `SUBSCRIPTION_ACTIVATED`, `PAYMENT_CREATED`

---

### 7.3 **Cancelar** (Status: CANCELADA)

**O que faz:**
- **REMOVE** a assinatura do Asaas permanentemente
- ⚠️ **ATENÇÃO:** Remove TODAS as cobranças pendentes e vencidas automaticamente!
- Ação IRREVERSÍVEL no Asaas

**Endpoint Asaas:**
```
DELETE /v3/subscriptions/{id}
```

**Função na Alusa:**
```typescript
// packages/lib/src/asaas/subscription.ts
await deleteSubscription(asaasSubscriptionId, { contaId });
```

**Webhooks esperados:** `SUBSCRIPTION_DELETED`, `PAYMENT_DELETED` (para cada cobrança)

---

### 7.4 Comparativo das Ações

| Ação | Endpoint | Status Asaas | Cobranças Pendentes | Reversível |
|------|----------|--------------|---------------------|------------|
| **Pausar** | `PUT` com `status: 'INACTIVE'` | `INACTIVE` | ❌ Mantidas | ✅ Sim (reativar) |
| **Reativar** | `PUT` com `status: 'ACTIVE'` + `nextDueDate` | `ACTIVE` | ❌ Não afeta | ✅ Sim (pausar) |
| **Cancelar** | `DELETE` | `DELETED` | ⚠️ **Removidas** | ❌ **Não** |

> 💡 **Recomendação:** Use "Pausar" se quiser interromper temporariamente. Use "Cancelar" apenas para encerramento definitivo da matrícula.

---

## 8. Operações Financeiras

### 8.1 Alterar Subscription

```typescript
// PUT /api/matriculas/[id]/forma-pagamento
await updateSubscription(subscriptionId, {
  billingType: 'PIX',
  updatePendingPayments: true  // Atualiza cobranças pendentes
});

// PUT /api/matriculas/[id]/valor
await updateSubscription(subscriptionId, {
  value: 299.90,
  updatePendingPayments: true
});

// PUT /api/matriculas/[id]/juros-multa
await updateSubscription(subscriptionId, {
  fine: { value: 2, type: 'PERCENTAGE' },
  interest: { value: 1, type: 'PERCENTAGE' },
  updatePendingPayments: true
});
```

### 8.2 Operações em Payments

```typescript
// Deletar cobrança
await deletePayment(paymentId);

// Estornar cobrança
await refundPayment(paymentId);

// Confirmar pagamento manual
await confirmCashPayment(paymentId, {
  paymentDate: '2025-10-01',
  value: 199.90
});

// Gerar QR Code PIX
const pixInfo = await getPixQrCode(paymentId);
// Retorna: { encodedImage, payload, expirationDate }
```

---

## 9. Seleção de Ambiente (Sandbox/Produção)

### 9.1 Helper Centralizado

```typescript
// packages/lib/src/asaas/env.ts

export const ASAAS_API_URLS = {
  SANDBOX: 'https://api-sandbox.asaas.com/v3',
  PRODUCTION: 'https://api.asaas.com/v3',
} as const;

export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey.includes('_hmlg_');
}

export function getAsaasBaseUrl(apiKey: string): string {
  return isSandboxApiKey(apiKey) 
    ? ASAAS_API_URLS.SANDBOX 
    : ASAAS_API_URLS.PRODUCTION;
}
```

### 9.2 Tipos de API Key

| Tipo | Prefixo | URL Base |
|------|---------|----------|
| Sandbox | `$aact_hmlg_...` | `https://api-sandbox.asaas.com/v3` |
| Produção | `$aact_prod_...` | `https://api.asaas.com/v3` |

---

## 10. Multi-tenancy (Credenciais por Conta)

Cada conta (escola) pode ter suas próprias credenciais Asaas:

```typescript
// Obter cliente para conta específica
const client = await getAsaasClientForConta(contaId);

// Invalidar cache quando credenciais são atualizadas
await invalidateAsaasClientCache(contaId);
```

---

## 11. Comportamento Fail-Safe

Todas as operações de sincronização são **fail-safe**:

```typescript
// Exemplo: se Asaas falhar, a operação principal continua
await unsyncAlunoFromAsaas({ alunoId: id, contaId }).catch((err) => {
  console.error('⚠️ Falha ao remover customer do Asaas:', err);
});
```

**Princípio:** Falhas na integração com Asaas **não devem** bloquear operações no sistema Alusa.

---

## 12. Logs e Debug

### 11.1 Prefixos de Log

| Prefixo | Operação |
|---------|----------|
| `[SyncAlunoAsaas]` | Criar customer |
| `[UpdateAlunoAsaas]` | Atualizar customer |
| `[UnsyncAlunoAsaas]` | Deletar customer |
| `[Asaas Subscription]` | Operações de subscription |
| `[Asaas Payment]` | Operações de payment |
| `[Webhook Asaas]` | Eventos recebidos |

### 11.2 Log de Integração

```typescript
// Registra operações na tabela LogIntegracao
await registrarLogIntegracao({
  contaId,
  operacao: 'CREATE_SUBSCRIPTION',
  status: 'SUCCESS',
  requestBody: { ... },
  responseBody: { ... },
});
```

---

## 13. Tipos TypeScript Principais

```typescript
// Customer
interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  externalReference?: string;
  // ...
}

// Subscription
interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'YEARLY';
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'OVERDUE' | 'DELETED';
  externalReference?: string;
  fine?: { value: number; type: 'FIXED' | 'PERCENTAGE' };
  interest?: { value: number; type: 'FIXED' | 'PERCENTAGE' };
  // ...
}

// Payment
interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  dueDate: string;
  status: PaymentStatus;
  billingType: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  externalReference?: string;
  // ...
}

type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'DELETED';
```

---

## 14. Configuração

### 13.1 Interface Web

Acesse: **Configurações → Integrações → Asaas**

1. Cole o token da API do Asaas
2. Clique em "Testar conexão"
3. Se válido, clique em "Salvar token"

### 13.2 Validação de Conexão

O endpoint `/api/integracoes/asaas/testar` valida:
- Formato do token (deve começar com `$aact_`)
- Conexão com a API Asaas
- Retorno de dados válidos

---

## 15. Troubleshooting

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| Customer não criado | Token não configurado | Configurar em Integrações |
| Subscription não criada | Customer inexistente | Verificar se aluno tem `asaasCustomerId` |
| Payment não criado | Subscription inexistente | Verificar se matrícula tem `asaasSubscriptionId` |
| Erro 401 | Token inválido/expirado | Gerar novo token no Asaas |
| Ambiente errado | Token de sandbox em produção | Usar token correto |
| Webhook não processa | Endpoint incorreto | Verificar URL no painel Asaas |
| Cobranças não atualizadas | Webhook sem idempotency | Verificar `eventId` no log |

---

## 16. Referências

- [Documentação Oficial Asaas](https://docs.asaas.com/)
- [Autenticação Asaas](https://docs.asaas.com/docs/autentica%C3%A7%C3%A3o-1)
- [API Customers](https://docs.asaas.com/reference/criar-novo-cliente)
- [API Subscriptions](https://docs.asaas.com/reference/criar-nova-assinatura)
- [API Payments](https://docs.asaas.com/reference/criar-nova-cobranca)
- [Webhooks](https://docs.asaas.com/docs/como-receber-webhooks)
