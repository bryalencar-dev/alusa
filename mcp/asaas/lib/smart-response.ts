/**
 * smart-response.ts
 * Monta respostas inteligentes e completas para o agente IA,
 * combinando contexto da documentação, exemplos e recomendações.
 */

import type { DocSearchResult } from './doc-types.js';
import type { ParsedIntent, ResourceType } from './intent-parser.js';
import { getResourceEndpoint, getResourceDocSection } from './intent-parser.js';

export interface SmartResponseInput {
  intent: ParsedIntent;
  docResults: DocSearchResult[];
  codeSamples: string[];
}

export interface SmartResponse {
  /** Resumo da solução em uma frase */
  summary: string;
  /** Explicação detalhada do contexto */
  context: string;
  /** Passos de implementação ordenados */
  implementationSteps: string[];
  /** Exemplos de código prontos para uso */
  codeExamples: CodeExample[];
  /** Referências da documentação oficial */
  docReferences: DocReference[];
  /** Alertas e boas práticas */
  warnings: string[];
  /** Endpoints relacionados */
  endpoints: EndpointInfo[];
  /** Resposta formatada em Markdown */
  markdown: string;
}

export interface CodeExample {
  title: string;
  language: string;
  code: string;
  description?: string;
}

export interface DocReference {
  title: string;
  url: string;
  relevance: string;
}

export interface EndpointInfo {
  method: string;
  path: string;
  description: string;
}

export function buildSmartResponse(input: SmartResponseInput): SmartResponse {
  const { intent, docResults, codeSamples } = input;

  const summary = buildSummary(intent);
  const context = buildContext(intent, docResults);
  const implementationSteps = buildImplementationSteps(intent);
  const codeExamples = buildCodeExamples(intent, codeSamples);
  const docReferences = buildDocReferences(docResults);
  const warnings = buildWarnings(intent);
  const endpoints = buildEndpoints(intent);

  const markdown = formatAsMarkdown({
    summary,
    context,
    implementationSteps,
    codeExamples,
    docReferences,
    warnings,
    endpoints,
    intent,
  });

  return {
    summary,
    context,
    implementationSteps,
    codeExamples,
    docReferences,
    warnings,
    endpoints,
    markdown,
  };
}

function buildSummary(intent: ParsedIntent): string {
  const resourceNames = intent.resources
    .filter((r) => r !== 'unknown')
    .map((r) => getResourceDocSection(r))
    .join(', ');

  const actionMap: Record<string, string> = {
    create: `criar ${resourceNames || 'recursos'}`,
    list: `listar ${resourceNames || 'recursos'}`,
    update: `atualizar ${resourceNames || 'recursos'}`,
    delete: `remover ${resourceNames || 'recursos'}`,
    sync: `sincronizar ${resourceNames || 'dados'} com o Asaas`,
    webhook: `configurar webhooks para ${resourceNames || 'eventos'}`,
    troubleshoot: `resolver problemas com ${resourceNames || 'integração'}`,
    explain: `entender como funciona ${resourceNames || 'a API do Asaas'}`,
    implement: `implementar ${resourceNames || 'integração'} com o Asaas`,
    bestpractices: `boas práticas para ${resourceNames || 'integração'}`,
  };

  return actionMap[intent.type] || `integrar ${resourceNames || 'recursos'} com o Asaas`;
}

function buildContext(intent: ParsedIntent, docResults: DocSearchResult[]): string {
  const snippets = docResults.slice(0, 2).map((r) => r.snippet).join('\n\n');

  if (!snippets) {
    return getDefaultContext(intent);
  }

  return `Com base na documentação oficial do Asaas:\n\n${snippets}`;
}

function getDefaultContext(intent: ParsedIntent): string {
  const resource = intent.resources[0];

  const contextMap: Partial<Record<ResourceType, string>> = {
    customer: `Clientes são a base de todas as operações no Asaas. Antes de criar cobranças, você precisa cadastrar o cliente com nome, CPF/CNPJ e email obrigatórios.`,
    payment: `Cobranças no Asaas suportam boleto, PIX, cartão de crédito e débito. O campo billingType define o tipo, e dueDate a data de vencimento.`,
    subscription: `Assinaturas permitem cobranças recorrentes automáticas. Defina o ciclo (WEEKLY, MONTHLY, etc) e o valor que será cobrado periodicamente.`,
    webhook: `Webhooks notificam sua aplicação sobre eventos em tempo real (pagamentos confirmados, estornos, etc). Configure a URL de callback e valide a assinatura.`,
    pix: `Cobranças PIX geram um QR Code e uma chave copia-e-cola. O pagamento é confirmado em segundos via webhook.`,
    anticipation: `A antecipação permite receber valores de cobranças antes do prazo normal. Use POST /anticipations/simulate para simular e POST /anticipations para solicitar. A taxa é calculada com base no valor e prazo.`,
    transfer: `Transferências permitem enviar valores para contas bancárias externas via PIX ou TED. Use POST /transfers com operationType PIX ou TED.`,
    refund: `Estornos devolvem valores ao pagador. Use POST /payments/{id}/refund. Pode ser total ou parcial (informando value).`,
    split: `Split divide automaticamente o valor recebido entre contas. Informe walletId e fixedValue ou percentualValue ao criar a cobrança.`,
    subaccount: `Subcontas permitem criar contas filhas (white label) para marketplaces. Cada subconta tem sua própria API key e wallet.`,
    token: `Tokenização salva dados do cartão de forma segura para cobranças futuras. Use POST /creditCard/tokenize e armazene apenas o token retornado.`,
    paymentlink: `Links de pagamento permitem compartilhar uma URL para o cliente pagar. O cliente escolhe o método de pagamento.`,
    checkout: `O checkout Asaas oferece uma página de pagamento pronta. Pode ser transparente (embedded) ou hosted.`,
    chargeback: `Chargebacks são disputas abertas pelo portador do cartão. Acompanhe via webhooks e responda com documentação.`,
  };

  return contextMap[resource] || `A API do Asaas permite integração completa com operações financeiras. Consulte a documentação oficial em https://docs.asaas.com para mais detalhes.`;
}

function buildImplementationSteps(intent: ParsedIntent): string[] {
  const steps: string[] = [];
  const resource = intent.resources[0];

  // Passos genéricos iniciais
  steps.push('Configurar a API key do Asaas no ambiente (variável ASAAS_API_KEY)');

  switch (intent.type) {
    case 'create':
      steps.push(`Validar os campos obrigatórios antes de enviar para a API`);
      steps.push(`Fazer requisição POST para ${getResourceEndpoint(resource)}`);
      steps.push(`Tratar a resposta e armazenar o ID retornado`);
      steps.push(`Configurar webhook para acompanhar mudanças de status`);
      break;

    case 'list':
      steps.push(`Fazer requisição GET para ${getResourceEndpoint(resource)}`);
      steps.push(`Implementar paginação usando offset e limit`);
      steps.push(`Filtrar resultados conforme necessidade`);
      break;

    case 'sync':
      steps.push(`Listar registros existentes no Asaas`);
      steps.push(`Comparar com dados locais para identificar diferenças`);
      steps.push(`Criar/atualizar registros conforme necessário`);
      steps.push(`Configurar webhooks para manter sincronização em tempo real`);
      break;

    case 'webhook':
      steps.push(`Criar endpoint dedicado para receber webhooks (ex: /api/webhooks/asaas)`);
      steps.push(`Validar assinatura do webhook usando ASAAS_WEBHOOK_SECRET`);
      steps.push(`Processar eventos por tipo (PAYMENT_RECEIVED, PAYMENT_OVERDUE, etc)`);
      steps.push(`Retornar status 200 para confirmar recebimento`);
      steps.push(`Implementar idempotência para evitar processamento duplicado`);
      break;

    case 'troubleshoot':
      steps.push(`Verificar se a API key está correta e ativa`);
      steps.push(`Conferir os campos obrigatórios do payload`);
      steps.push(`Analisar o código de erro retornado pela API`);
      steps.push(`Consultar a documentação do erro específico`);
      break;

    case 'implement':
      steps.push(`Criar service layer para encapsular chamadas à API`);
      steps.push(`Implementar schemas Zod para validação de payloads`);
      steps.push(`Criar route handlers (Next.js) ou controllers`);
      steps.push(`Adicionar tratamento de erros e retry para falhas transitórias`);
      steps.push(`Implementar testes unitários e de integração`);
      break;

    default:
      steps.push(`Consultar a documentação oficial do recurso`);
      steps.push(`Implementar chamada à API com tratamento de erros`);
      steps.push(`Testar em ambiente sandbox antes de produção`);
  }

  // Passos específicos por recurso
  if (resource === 'pix') {
    steps.push('Exibir QR Code e chave PIX para o usuário');
    steps.push('Configurar webhook PAYMENT_RECEIVED para confirmação instantânea');
  }

  if (resource === 'subscription') {
    steps.push('Definir ciclo de cobrança (WEEKLY, BIWEEKLY, MONTHLY, etc)');
    steps.push('Configurar webhooks para acompanhar cobranças geradas');
  }

  return steps;
}

function buildCodeExamples(intent: ParsedIntent, codeSamples: string[]): CodeExample[] {
  const examples: CodeExample[] = [];
  const resource = intent.resources[0];

  // Adicionar exemplos da documentação
  for (const sample of codeSamples.slice(0, 2)) {
    examples.push({
      title: 'Exemplo da documentação',
      language: detectLanguage(sample),
      code: sample,
    });
  }

  // Adicionar exemplos gerados baseados na intenção
  if (intent.needsImplementation || examples.length === 0) {
    const generatedExample = generateCodeExample(intent.type, resource);
    if (generatedExample) {
      examples.push(generatedExample);
    }
  }

  return examples;
}

function generateCodeExample(intentType: string, resource: ResourceType): CodeExample | null {
  const endpoint = getResourceEndpoint(resource);

  if (intentType === 'create' && resource === 'customer') {
    return {
      title: 'Criar cliente no Asaas',
      language: 'typescript',
      code: `// Criar cliente no Asaas
const response = await fetch('https://www.asaas.com/api/v3/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    name: 'João da Silva',
    cpfCnpj: '12345678909',
    email: 'joao@email.com',
    phone: '11999999999',
    // Campos opcionais
    mobilePhone: '11999999999',
    address: 'Rua Exemplo',
    addressNumber: '123',
    province: 'Centro',
    postalCode: '01310100'
  })
});

const customer = await response.json();
console.log('Cliente criado:', customer.id);`,
      description: 'Cria um novo cliente com campos obrigatórios e opcionais',
    };
  }

  if (intentType === 'create' && resource === 'payment') {
    return {
      title: 'Criar cobrança no Asaas',
      language: 'typescript',
      code: `// Criar cobrança no Asaas
const response = await fetch('https://www.asaas.com/api/v3/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    customer: 'cus_XXXXXXXX', // ID do cliente
    billingType: 'PIX', // PIX, BOLETO, CREDIT_CARD
    value: 100.00,
    dueDate: '2025-12-31',
    description: 'Pagamento de serviço',
    // Campos opcionais
    externalReference: 'pedido_123',
    postalService: false
  })
});

const payment = await response.json();
console.log('Cobrança criada:', payment.id);
// Para PIX: payment.pixQrCode contém o QR Code`,
      description: 'Cria uma nova cobrança (boleto, PIX ou cartão)',
    };
  }

  if (resource === 'pix') {
    return {
      title: 'Criar cobrança PIX com QR Code',
      language: 'typescript',
      code: `// Criar cobrança PIX no Asaas
const response = await fetch('https://www.asaas.com/api/v3/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    customer: 'cus_XXXXXXXX',
    billingType: 'PIX',
    value: 150.00,
    dueDate: '2025-12-31',
    description: 'Pagamento via PIX'
  })
});

const payment = await response.json();

// Obter QR Code PIX
const pixResponse = await fetch(
  \`https://www.asaas.com/api/v3/payments/\${payment.id}/pixQrCode\`,
  {
    headers: { 'access_token': process.env.ASAAS_API_KEY! }
  }
);

const pixData = await pixResponse.json();
console.log('QR Code (base64):', pixData.encodedImage);
console.log('Copia e cola:', pixData.payload);
console.log('Data de expiração:', pixData.expirationDate);`,
      description: 'Cria cobrança PIX e obtém QR Code para exibição',
    };
  }

  if (resource === 'token' || (intentType === 'tokenize' && resource === 'creditcard')) {
    return {
      title: 'Tokenizar cartão de crédito',
      language: 'typescript',
      code: `// Tokenizar cartão no Asaas
const response = await fetch('https://www.asaas.com/api/v3/creditCard/tokenize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    customer: 'cus_XXXXXXXX',
    creditCard: {
      holderName: 'João da Silva',
      number: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2030',
      ccv: '123'
    },
    creditCardHolderInfo: {
      name: 'João da Silva',
      cpfCnpj: '12345678909',
      email: 'joao@email.com',
      postalCode: '01310100',
      addressNumber: '123',
      phone: '11999999999'
    }
  })
});

const tokenData = await response.json();
// Salve o token para uso futuro (NÃO salve os dados do cartão!)
console.log('Token:', tokenData.creditCardToken);
console.log('Últimos 4 dígitos:', tokenData.creditCardNumber);`,
      description: 'Tokeniza cartão para cobranças futuras sem armazenar dados sensíveis',
    };
  }

  if (resource === 'split') {
    return {
      title: 'Criar cobrança com Split de pagamento',
      language: 'typescript',
      code: `// Criar cobrança com split (divisão de valores)
const response = await fetch('https://www.asaas.com/api/v3/payments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    customer: 'cus_XXXXXXXX',
    billingType: 'PIX',
    value: 1000.00,
    dueDate: '2025-12-31',
    description: 'Pagamento com split',
    // Split: dividir o valor com outra carteira
    split: [
      {
        walletId: 'wallet_YYYYYYYY', // ID da carteira do parceiro
        fixedValue: 100.00, // Valor fixo
        // OU percentualValue: 10 // Porcentagem
      }
    ]
  })
});

const payment = await response.json();
console.log('Cobrança com split criada:', payment.id);`,
      description: 'Divide automaticamente o valor entre contas no recebimento',
    };
  }

  if (resource === 'subaccount') {
    return {
      title: 'Criar subconta (White Label)',
      language: 'typescript',
      code: `// Criar subconta no Asaas
const response = await fetch('https://www.asaas.com/api/v3/accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    name: 'Empresa Parceira LTDA',
    cpfCnpj: '12345678000190',
    email: 'contato@parceiro.com',
    phone: '11999999999',
    mobilePhone: '11999999999',
    companyType: 'LIMITED', // MEI, INDIVIDUAL, LIMITED, etc
    address: 'Rua Exemplo',
    addressNumber: '123',
    province: 'Centro',
    postalCode: '01310100',
    // Webhook específico da subconta
    webhooks: [
      {
        url: 'https://parceiro.com/api/webhooks/asaas',
        email: 'notificacoes@parceiro.com',
        enabled: true
      }
    ]
  })
});

const account = await response.json();
console.log('Subconta criada:', account.id);
console.log('API Key da subconta:', account.apiKey);
console.log('Wallet ID:', account.walletId);`,
      description: 'Cria subconta para marketplace ou white label',
    };
  }

  if (resource === 'paymentlink') {
    return {
      title: 'Criar Link de Pagamento',
      language: 'typescript',
      code: `// Criar link de pagamento
const response = await fetch('https://www.asaas.com/api/v3/paymentLinks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    name: 'Curso Online - Módulo 1',
    description: 'Acesso completo ao módulo 1 do curso',
    billingType: 'UNDEFINED', // Cliente escolhe: PIX, BOLETO ou CARTÃO
    chargeType: 'DETACHED', // DETACHED = pagamento único
    value: 297.00,
    // Configurações opcionais
    dueDateLimitDays: 30, // Dias até vencimento
    maxInstallmentCount: 12, // Máximo de parcelas no cartão
    subscriptionCycle: null, // null para pagamento único
    // Notificações
    notificationEnabled: true
  })
});

const link = await response.json();
console.log('Link criado:', link.id);
console.log('URL de pagamento:', link.url);`,
      description: 'Cria link de pagamento para compartilhar com clientes',
    };
  }

  if (resource === 'refund') {
    return {
      title: 'Estornar cobrança',
      language: 'typescript',
      code: `// Estornar cobrança (refund)
const paymentId = 'pay_XXXXXXXX';

const response = await fetch(
  \`https://www.asaas.com/api/v3/payments/\${paymentId}/refund\`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!
    },
    body: JSON.stringify({
      value: 50.00, // Estorno parcial (opcional, omita para estorno total)
      description: 'Estorno por solicitação do cliente'
    })
  }
);

const refund = await response.json();
console.log('Estorno realizado:', refund.status);
// Status: PENDING, CONFIRMED, CANCELLED`,
      description: 'Realiza estorno total ou parcial de uma cobrança',
    };
  }

  if (resource === 'transfer') {
    return {
      title: 'Realizar transferência PIX',
      language: 'typescript',
      code: `// Transferência PIX para chave
const response = await fetch('https://www.asaas.com/api/v3/transfers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    value: 500.00,
    operationType: 'PIX', // PIX ou TED
    pixAddressKey: 'email@exemplo.com', // Chave PIX
    pixAddressKeyType: 'EMAIL', // CPF, CNPJ, EMAIL, PHONE, EVP
    description: 'Pagamento de fornecedor'
  })
});

const transfer = await response.json();
console.log('Transferência:', transfer.id);
console.log('Status:', transfer.status);
// Status: PENDING, BANK_PROCESSING, DONE, CANCELLED`,
      description: 'Realiza transferência PIX ou TED para conta externa',
    };
  }

  if (resource === 'anticipation') {
    return {
      title: 'Simular e solicitar antecipação',
      language: 'typescript',
      code: `// 1. Simular antecipação
const simResponse = await fetch(
  'https://www.asaas.com/api/v3/anticipations/simulate',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!
    },
    body: JSON.stringify({
      payment: 'pay_XXXXXXXX', // ID da cobrança a antecipar
      // OU installment: 'inst_XXXXXXXX' para antecipar parcelamento
    })
  }
);

const simulation = await simResponse.json();
console.log('Valor líquido:', simulation.anticipationNetValue);
console.log('Taxa:', simulation.fee);

// 2. Solicitar antecipação se aprovado
if (simulation.isAnticipable) {
  const antResponse = await fetch(
    'https://www.asaas.com/api/v3/anticipations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': process.env.ASAAS_API_KEY!
      },
      body: JSON.stringify({
        payment: 'pay_XXXXXXXX'
      })
    }
  );
  const anticipation = await antResponse.json();
  console.log('Antecipação solicitada:', anticipation.id);
}`,
      description: 'Simula e solicita antecipação de recebíveis',
    };
  }

  if (intentType === 'webhook' || resource === 'webhook') {
    return {
      title: 'Handler de Webhook Asaas (Next.js)',
      language: 'typescript',
      code: `// app/api/webhooks/asaas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('asaas-signature');

  // Validar assinatura
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Processar eventos
  switch (event.event) {
    case 'PAYMENT_RECEIVED':
      await handlePaymentReceived(event.payment);
      break;
    case 'PAYMENT_CONFIRMED':
      await handlePaymentConfirmed(event.payment);
      break;
    case 'PAYMENT_OVERDUE':
      await handlePaymentOverdue(event.payment);
      break;
    case 'PAYMENT_REFUNDED':
      await handlePaymentRefunded(event.payment);
      break;
    case 'PAYMENT_DELETED':
      await handlePaymentDeleted(event.payment);
      break;
    // Eventos de assinatura
    case 'SUBSCRIPTION_CREATED':
    case 'SUBSCRIPTION_RENEWED':
    case 'SUBSCRIPTION_CANCELED':
      await handleSubscriptionEvent(event);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentReceived(payment: any) {
  // Atualizar status no banco de dados
  console.log('Pagamento confirmado:', payment.id);
}

async function handlePaymentConfirmed(payment: any) {
  // Liberar produto/serviço
  console.log('Pagamento compensado:', payment.id);
}

async function handlePaymentOverdue(payment: any) {
  // Notificar usuário
  console.log('Pagamento vencido:', payment.id);
}

async function handlePaymentRefunded(payment: any) {
  // Reverter produto/serviço
  console.log('Pagamento estornado:', payment.id);
}

async function handlePaymentDeleted(payment: any) {
  // Cancelar pedido
  console.log('Cobrança removida:', payment.id);
}

async function handleSubscriptionEvent(event: any) {
  console.log('Evento de assinatura:', event.event, event.subscription?.id);
}`,
      description: 'Recebe e processa webhooks do Asaas com validação de assinatura',
    };
  }

  if (resource === 'subscription') {
    return {
      title: 'Criar assinatura recorrente',
      language: 'typescript',
      code: `// Criar assinatura recorrente no Asaas
const response = await fetch('https://www.asaas.com/api/v3/subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  },
  body: JSON.stringify({
    customer: 'cus_XXXXXXXX',
    billingType: 'CREDIT_CARD', // ou PIX, BOLETO
    value: 99.90,
    nextDueDate: '2025-01-01',
    cycle: 'MONTHLY', // WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY
    description: 'Assinatura mensal',
    // Desconto opcional
    discount: {
      value: 10,
      type: 'PERCENTAGE' // ou FIXED
    },
    // Para cartão de crédito
    creditCard: {
      holderName: 'João da Silva',
      number: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2030',
      ccv: '123'
    },
    creditCardHolderInfo: {
      name: 'João da Silva',
      cpfCnpj: '12345678909',
      email: 'joao@email.com',
      postalCode: '01310100',
      addressNumber: '123',
      phone: '11999999999'
    }
  })
});

const subscription = await response.json();
console.log('Assinatura criada:', subscription.id);
console.log('Próximo vencimento:', subscription.nextDueDate);`,
      description: 'Cria uma assinatura com cobrança recorrente automática',
    };
  }

  // Exemplo genérico
  if (endpoint) {
    return {
      title: `Operação em ${getResourceDocSection(resource)}`,
      language: 'typescript',
      code: `// Requisição para ${endpoint}
const response = await fetch(\`https://www.asaas.com/api/v3${endpoint}\`, {
  method: '${intentType === 'list' ? 'GET' : 'POST'}',
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_API_KEY!
  }${intentType !== 'list' ? `,
  body: JSON.stringify({
    // Campos do recurso
  })` : ''}
});

const data = await response.json();
console.log(data);`,
    };
  }

  return null;
}

function detectLanguage(code: string): string {
  if (code.includes('fetch(') || code.includes('async ') || code.includes(': string')) {
    return 'typescript';
  }
  if (code.includes('curl ')) {
    return 'bash';
  }
  if (code.includes('"') && code.includes(':') && code.includes('{')) {
    return 'json';
  }
  return 'typescript';
}

function buildDocReferences(docResults: DocSearchResult[]): DocReference[] {
  return docResults.slice(0, 4).map((result) => ({
    title: result.title,
    url: result.url,
    relevance: `Pontuação: ${result.score}`,
  }));
}

function buildWarnings(intent: ParsedIntent): string[] {
  const warnings: string[] = [];
  const resource = intent.resources[0];

  // Avisos gerais
  warnings.push('⚠️ Sempre teste em ambiente sandbox antes de produção');
  warnings.push('🔐 Nunca exponha a API key no frontend');

  // Avisos específicos por recurso
  if (resource === 'payment' || resource === 'pix' || resource === 'boleto') {
    warnings.push('💡 Configure webhooks para receber confirmações de pagamento em tempo real');
  }

  if (resource === 'webhook') {
    warnings.push('🔒 Sempre valide a assinatura do webhook antes de processar');
    warnings.push('♻️ Implemente idempotência para evitar processamento duplicado');
  }

  if (resource === 'subscription') {
    warnings.push('📅 Defina nextDueDate com antecedência para evitar atrasos');
    warnings.push('💳 Para cartão de crédito, armazene o token e não os dados do cartão');
  }

  if (resource === 'creditcard') {
    warnings.push('🔒 Use tokenização para evitar armazenar dados sensíveis');
    warnings.push('💡 Considere usar o checkout transparente do Asaas');
  }

  if (intent.type === 'troubleshoot') {
    warnings.push('📋 Consulte o código de erro na documentação oficial');
    warnings.push('🔍 Verifique o Request-ID para suporte técnico');
  }

  return warnings;
}

function buildEndpoints(intent: ParsedIntent): EndpointInfo[] {
  const endpoints: EndpointInfo[] = [];

  for (const resource of intent.resources) {
    const path = getResourceEndpoint(resource);
    if (!path) continue;

    switch (intent.type) {
      case 'create':
        endpoints.push({ method: 'POST', path, description: `Criar novo ${getResourceDocSection(resource).toLowerCase()}` });
        break;
      case 'list':
        endpoints.push({ method: 'GET', path, description: `Listar ${getResourceDocSection(resource).toLowerCase()}` });
        break;
      case 'update':
        endpoints.push({ method: 'PUT', path: `${path}/{id}`, description: `Atualizar ${getResourceDocSection(resource).toLowerCase()}` });
        break;
      case 'delete':
        endpoints.push({ method: 'DELETE', path: `${path}/{id}`, description: `Remover ${getResourceDocSection(resource).toLowerCase()}` });
        break;
      default:
        endpoints.push({ method: 'GET', path, description: `Consultar ${getResourceDocSection(resource).toLowerCase()}` });
        endpoints.push({ method: 'POST', path, description: `Criar ${getResourceDocSection(resource).toLowerCase()}` });
    }
  }

  return endpoints;
}

function formatAsMarkdown(data: {
  summary: string;
  context: string;
  implementationSteps: string[];
  codeExamples: CodeExample[];
  docReferences: DocReference[];
  warnings: string[];
  endpoints: EndpointInfo[];
  intent: ParsedIntent;
}): string {
  const sections: string[] = [];

  // Cabeçalho
  sections.push(`## 🎯 ${data.summary.charAt(0).toUpperCase() + data.summary.slice(1)}`);
  sections.push('');

  // Contexto
  sections.push('### 📖 Contexto');
  sections.push(data.context);
  sections.push('');

  // Endpoints
  if (data.endpoints.length > 0) {
    sections.push('### 🔗 Endpoints');
    for (const endpoint of data.endpoints) {
      sections.push(`- \`${endpoint.method} ${endpoint.path}\` — ${endpoint.description}`);
    }
    sections.push('');
  }

  // Passos de implementação
  if (data.implementationSteps.length > 0) {
    sections.push('### 📋 Passos de Implementação');
    data.implementationSteps.forEach((step, index) => {
      sections.push(`${index + 1}. ${step}`);
    });
    sections.push('');
  }

  // Exemplos de código
  if (data.codeExamples.length > 0) {
    sections.push('### 💻 Exemplos de Código');
    for (const example of data.codeExamples) {
      sections.push(`**${example.title}**`);
      if (example.description) {
        sections.push(`_${example.description}_`);
      }
      sections.push('```' + example.language);
      sections.push(example.code);
      sections.push('```');
      sections.push('');
    }
  }

  // Referências da documentação
  if (data.docReferences.length > 0) {
    sections.push('### 📚 Documentação Oficial');
    for (const ref of data.docReferences) {
      sections.push(`- [${ref.title}](${ref.url})`);
    }
    sections.push('');
  }

  // Alertas e boas práticas
  if (data.warnings.length > 0) {
    sections.push('### ⚠️ Alertas e Boas Práticas');
    for (const warning of data.warnings) {
      sections.push(`- ${warning}`);
    }
  }

  return sections.join('\n');
}
