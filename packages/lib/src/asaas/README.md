# 💳 Módulo Asaas - Integração de Pagamentos

> Biblioteca completa e refatorada para integração com a API do Asaas (Payment Gateway)

[![Versão](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/bryalencar-dev/alusa)
[![Documentação](https://img.shields.io/badge/docs-asaas.com-green.svg)](https://docs.asaas.com)

---

## 📚 Índice

- [Visão Geral](#-visão-geral)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Arquitetura](#-arquitetura)
- [Uso Básico](#-uso-básico)
- [API Reference](#-api-reference)
- [Webhooks](#-webhooks)
- [Multi-tenancy](#-multi-tenancy)
- [Testes](#-testes)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

Este módulo oferece uma integração **completa, type-safe e testada** com a API do Asaas, incluindo:

✅ **Customers** - Gerenciamento de clientes  
✅ **Subscriptions** - Assinaturas recorrentes  
✅ **Payments** - Cobranças avulsas (PIX, Boleto, Cartão)  
✅ **Webhooks** - Processamento idempotente de eventos  
✅ **Credentials** - Armazenamento seguro com criptografia  
✅ **Multi-tenancy** - Suporte a credenciais por conta  
✅ **Utils** - Helpers para validação, formatação e mapeamento

### 🏗️ Estrutura do Módulo

```
packages/lib/src/asaas/
├── index.ts           # Export centralizado
├── client.ts          # Cliente HTTP Axios configurado
├── env.ts             # Validação de variáveis de ambiente
├── schemas.ts         # Schemas Zod de validação
├── types.ts           # Tipos TypeScript
├── utils.ts           # Funções auxiliares
├── credentials.ts     # Gerenciamento de credenciais
├── customer.ts        # API de Customers
├── subscription.ts    # API de Subscriptions
├── payment.ts         # API de Payments
└── tests/             # Testes unitários
    ├── client.test.ts
    ├── utils.test.ts
    └── ...
```

---

## ⚙️ Instalação e Configuração

### 1. Variáveis de Ambiente

Crie ou edite o arquivo `apps/web/.env.local`:

```bash
# Asaas Configuration
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
ASAAS_API_KEY="$aact_hmlg_000MzkwODA2MWY2O..."
ASAAS_WEBHOOK_SECRET="a1b2c3d4e5f6g7h8i9j0..."
FEATURE_ASAAS=true
```

> ⚠️ **Importante**:
>
> - Use **aspas duplas** na `ASAAS_API_KEY` (começa com `$`)
> - Gere `ASAAS_WEBHOOK_SECRET` com: `openssl rand -hex 32`
> - Para produção, troque `api-sandbox.asaas.com` por `api.asaas.com`

### 2. Obter Credenciais

1. Acesse [Asaas Sandbox](https://sandbox.asaas.com)
2. Vá em **Integrações > API Key**
3. Copie a chave gerada

---

## 🏛️ Arquitetura

### Camadas da Integração

```
┌─────────────────────────────────────────┐
│   API Routes (/api/asaas/*)             │
│   - customers/route.ts                  │
│   - subscriptions/route.ts              │
│   - payments/route.ts                   │
│   - webhooks/route.ts                   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Asaas Module (@alusa/lib/asaas)       │
│   ┌─────────────────────────────────┐   │
│   │  Service Layer                  │   │
│   │  - createCustomer()             │   │
│   │  - createSubscription()         │   │
│   │  - createPayment()              │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  Client (Axios)                 │   │
│   │  - getAsaasClient()             │   │
│   │  - getAsaasClientForConta()     │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  Credentials (Encrypted)        │   │
│   │  - loadDecryptedAsaasCredentials│   │
│   └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│   Asaas API (REST)                      │
│   https://api-sandbox.asaas.com/v3      │
└─────────────────────────────────────────┘
```

### Fluxo de Dados

1. **API Route** recebe requisição do frontend
2. Valida payload com **schemas Zod**
3. Chama função do **service layer**
4. Service obtém **client** (com credenciais corretas)
5. Faz requisição HTTP para **Asaas API**
6. Trata resposta e retorna dados

---

## 🚀 Uso Básico

### Customer

```ts
import { createCustomer, listCustomers } from '@alusa/lib/asaas';

// Criar customer
const customer = await createCustomer({
  name: 'João Silva',
  cpfCnpj: '12345678901',
  email: 'joao@example.com',
  phone: '11987654321',
  externalReference: 'aluno-123',
});

console.log(customer.id); // cus_000005047835

// Listar customers
const customers = await listCustomers({
  limit: 10,
  offset: 0,
  cpfCnpj: '12345678901',
});
```

### Subscription

```ts
import { createSubscription } from '@alusa/lib/asaas';

const subscription = await createSubscription({
  customer: 'cus_000005047835',
  billingType: 'BOLETO',
  value: 199.9,
  cycle: 'MONTHLY',
  nextDueDate: '2025-11-05',
  description: 'Mensalidade Curso de Natação',
  externalReference: 'matricula-456',
});

console.log(subscription.id); // sub_6xxxxxxxxxxxxxxxxxxx
```

### Payment (Avulso)

```ts
import { createPayment } from '@alusa/lib/asaas';

// Criar cobrança PIX
const payment = await createPayment({
  customer: 'cus_000005047835',
  billingType: 'PIX',
  value: 50.0,
  dueDate: '2025-10-15',
  description: 'Taxa de Matrícula',
  externalReference: 'taxa-123',
});

// Gerar QR Code PIX
const pixInfo = await getPixQrCode(payment.id);
console.log(pixInfo.encodedImage); // Base64 da imagem
console.log(pixInfo.payload); // String de copiar e colar
```

---

## 📖 API Reference

### Schemas

#### `customerSchema`

```ts
{
  name: string;              // Obrigatório
  cpfCnpj: string;           // Obrigatório (11 ou 14 dígitos)
  email?: string;            // Opcional
  phone?: string;            // Opcional
  mobilePhone?: string;      // Opcional
  address?: string;          // Opcional
  addressNumber?: string;    // Opcional
  complement?: string;       // Opcional
  province?: string;         // Opcional
  postalCode?: string;       // Opcional
  externalReference?: string; // Opcional (ID externo)
}
```

#### `subscriptionSchema`

```ts
{
  customer: string;          // ID do customer
  billingType: BillingType;  // BOLETO | PIX | CREDIT_CARD
  value: number;             // Valor em R$
  cycle: Cycle;              // MONTHLY | WEEKLY | YEARLY
  nextDueDate: string;       // YYYY-MM-DD
  description: string;       // Descrição
  externalReference?: string; // ID externo
  discount?: {...};          // Desconto opcional
  fine?: {...};              // Multa opcional
  interest?: {...};          // Juros opcional
}
```

#### `paymentSchema`

```ts
{
  customer: string;          // ID do customer
  billingType: BillingType;  // BOLETO | PIX | CREDIT_CARD
  value: number;             // Valor em R$
  dueDate: string;           // YYYY-MM-DD
  description: string;       // Descrição
  externalReference?: string; // ID externo
  installmentCount?: number; // Parcelamento (1-12)
  discount?: {...};          // Desconto opcional
  fine?: {...};              // Multa opcional
  interest?: {...};          // Juros opcional
}
```

### Utils

```ts
// Mapeamento de status
mapPaymentStatus('RECEIVED'); // 'PAGO'
mapSubscriptionStatus('ACTIVE'); // 'ATIVA'

// Validação
isValidCpf('12345678901');
isValidCnpj('12345678000195');
isValidCpfCnpj('12345678901');

// Formatação
sanitizeCpfCnpj('123.456.789-01'); // '12345678901'
formatDate(new Date()); // '2025-10-06'
formatCurrency(199.999); // 199.99

// Idempotência
extractWebhookEventId(payload); // 'evt_12345...'
generateIdempotencyKey('user', '123', 'action'); // 'user|123|action'

// Mascaramento
maskSecret('sk_test_abc123def456'); // 'sk_••••456'
```

---

## 🔔 Webhooks

### Configuração

1. No painel do Asaas, vá em **Integrações > Webhooks**
2. Adicione a URL: `https://seu-dominio.com/api/asaas/webhooks`
3. Selecione os eventos desejados
4. Copie o secret e adicione em `ASAAS_WEBHOOK_SECRET`

### Eventos Suportados

```ts
// Pagamentos
PAYMENT_CREATED;
PAYMENT_CONFIRMED;
PAYMENT_RECEIVED; // ✅ Pagamento confirmado
PAYMENT_OVERDUE; // ⚠️ Pagamento atrasado
PAYMENT_REFUNDED; // 💸 Estornado
PAYMENT_DELETED;

// Assinaturas
SUBSCRIPTION_CREATED;
SUBSCRIPTION_UPDATED;
SUBSCRIPTION_DELETED; // ❌ Assinatura cancelada
SUBSCRIPTION_EXPIRED;

// Transferências
TRANSFER_PENDING;
TRANSFER_DONE;
TRANSFER_FAILED;
```

### Processamento

O webhook implementa:

✅ **Validação de assinatura** (HMAC-SHA256)  
✅ **Idempotência** (evita duplicatas)  
✅ **Persistência** (salva payload na tabela `WebhookAsaas`)  
✅ **Processamento assíncrono** (atualiza `Cobranca`, `Pagamento`, `Matricula`)

---

## 🏢 Multi-tenancy

O módulo suporta credenciais específicas por conta:

```ts
// Salvar credenciais para uma conta
await saveAsaasCredentials('conta-123', {
  apiKey: '$aact_hmlg_...',
  webhookSecret: 'whsec_...',
});

// Usar credenciais específicas
const customer = await createCustomer(
  {
    name: 'João Silva',
    cpfCnpj: '12345678901',
  },
  { contaId: 'conta-123' }, // ← Opção contaId
);

// Recuperar credenciais mascaradas
const creds = await getAsaasCredentials('conta-123');
console.log(creds.apiKeyMasked); // '$aa••••fe4'
```

---

## 🧪 Testes

```bash
# Rodar todos os testes
pnpm test

# Testes do módulo Asaas
pnpm test asaas

# Testes com cobertura
pnpm test:coverage

# Testes unitários específicos
pnpm test utils.test.ts
```

### Estrutura de Testes

```
packages/lib/src/asaas/tests/
├── client.test.ts       # Cliente HTTP
├── utils.test.ts        # Funções auxiliares
├── customer.test.ts     # API de Customers
├── subscription.test.ts # API de Subscriptions
├── payment.test.ts      # API de Payments
└── webhook.test.ts      # Processamento de webhooks
```

---

## 🐛 Troubleshooting

### Erro: "ASAAS_API_KEY não configurada"

**Causa**: Variável de ambiente não carregada

**Solução**:

1. Verifique se `.env.local` existe em `apps/web/`
2. Confirme que `ASAAS_API_KEY` está entre aspas duplas
3. Reinicie o servidor: `pnpm dev`

---

### Erro: "Customer não encontrado (404)"

**Causa**: ID do customer incorreto ou de outro ambiente (sandbox vs produção)

**Solução**:

```bash
# Limpar customers antigos do banco
delete from wp_usermeta where meta_value like '%cus_000%';
```

---

### Webhook não está chegando

**Checklist**:

- [ ] URL do webhook está acessível publicamente
- [ ] `ASAAS_WEBHOOK_SECRET` está configurado
- [ ] Endpoint retorna HTTP 200
- [ ] User-Agent permitido no firewall: `Java/1.8.0_275`

---

### Erro: "Assinatura inválida do webhook"

**Causa**: `ASAAS_WEBHOOK_SECRET` incorreto

**Solução**:

```bash
# Validar assinatura manualmente
echo -n '<payload>' | openssl dgst -sha256 -hmac '<ASAAS_WEBHOOK_SECRET>' -hex
```

---

## 📚 Links Úteis

- [Documentação Oficial Asaas](https://docs.asaas.com)
- [Painel Sandbox](https://sandbox.asaas.com)
- [Status da API](https://status.asaas.com)
- [Postman Collection](https://www.postman.com/asaas-api)

---

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona X'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é proprietário da Alusa © 2025.

---

**Feito com ❤️ pela equipe Alusa**
