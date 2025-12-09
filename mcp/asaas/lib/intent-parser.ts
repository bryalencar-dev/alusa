/**
 * intent-parser.ts
 * Interpreta perguntas abertas do usuário e identifica a intenção,
 * recursos envolvidos e tipo de resposta esperada.
 * 
 * Baseado na documentação oficial do Asaas:
 * https://docs.asaas.com/
 */

export type IntentType =
  | 'create'
  | 'list'
  | 'update'
  | 'delete'
  | 'sync'
  | 'webhook'
  | 'troubleshoot'
  | 'explain'
  | 'implement'
  | 'bestpractices'
  | 'tokenize'
  | 'checkout'
  | 'sandbox';

export type ResourceType =
  | 'customer'
  | 'payment'
  | 'subscription'
  | 'invoice'
  | 'pix'
  | 'boleto'
  | 'creditcard'
  | 'webhook'
  | 'transfer'
  | 'notification'
  | 'installment'
  | 'refund'
  | 'split'
  | 'subaccount'
  | 'paymentlink'
  | 'checkout'
  | 'token'
  | 'sandbox'
  | 'anticipation'
  | 'chargeback'
  | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  resources: ResourceType[];
  keywords: string[];
  isQuestion: boolean;
  needsImplementation: boolean;
  needsExamples: boolean;
  needsTroubleshooting: boolean;
  originalQuery: string;
  searchTerms: string[];
  suggestedEndpoints: string[];
  suggestedDocs: string[];
}

const INTENT_PATTERNS: Array<{ pattern: RegExp; type: IntentType }> = [
  { pattern: /criar|create|cadastrar|adicionar|novo|new|gerar/i, type: 'create' },
  { pattern: /listar|list|buscar|consultar|obter|get|fetch|recuperar|trazer/i, type: 'list' },
  { pattern: /atualizar|update|editar|alterar|modificar|mudar/i, type: 'update' },
  { pattern: /deletar|delete|remover|excluir|cancelar|apagar/i, type: 'delete' },
  { pattern: /sincronizar|sync|integrar|conectar|migrar/i, type: 'sync' },
  { pattern: /webhook|callback|evento|receber notifica/i, type: 'webhook' },
  { pattern: /resolver|problema|erro|fix|debug|corrigir|falha|n[aã]o funciona|bug/i, type: 'troubleshoot' },
  { pattern: /como|what|how|o que|explica|entender|funciona|serve/i, type: 'explain' },
  { pattern: /implementar|implement|desenvolver|codar|programar|feature|montar/i, type: 'implement' },
  { pattern: /boas pr[aá]ticas|best practices|recomenda|sugere|melhores|dicas/i, type: 'bestpractices' },
  { pattern: /tokeniz|salvar cart[aã]o|guardar cart[aã]o/i, type: 'tokenize' },
  { pattern: /checkout|link.?pagamento|p[aá]gina.?pagamento/i, type: 'checkout' },
  { pattern: /sandbox|teste|homologa[çc][aã]o|ambiente.?teste/i, type: 'sandbox' },
];

const RESOURCE_PATTERNS: Array<{ pattern: RegExp; resource: ResourceType }> = [
  { pattern: /cliente|customer|clientes|customers|cpf|cnpj/i, resource: 'customer' },
  { pattern: /cobran[çc]a|payment|pagamento|cobranca|payments|pagar/i, resource: 'payment' },
  { pattern: /assinatura|subscription|recorrente|recorr[eê]ncia|mensal|plano/i, resource: 'subscription' },
  { pattern: /fatura|invoice|nota fiscal|nfse|nfe/i, resource: 'invoice' },
  { pattern: /pix|qr.?code|chave.?pix|copia.?cola/i, resource: 'pix' },
  { pattern: /boleto|bank.?slip/i, resource: 'boleto' },
  { pattern: /cart[aã]o|credit.?card|cr[eé]dito|visa|master|elo/i, resource: 'creditcard' },
  { pattern: /webhook|notifica[çc][aã]o|evento|callback/i, resource: 'webhook' },
  { pattern: /transfer[eê]ncia|transfer|saque|ted|pix.?transfer/i, resource: 'transfer' },
  { pattern: /parcela|installment|parcelamento/i, resource: 'installment' },
  { pattern: /estorno|refund|reembolso|devolver|devolu[çc][aã]o/i, resource: 'refund' },
  { pattern: /split|repasse|divis[aã]o|comiss[aã]o/i, resource: 'split' },
  { pattern: /subconta|subaccount|conta.?filha|white.?label/i, resource: 'subaccount' },
  { pattern: /link.?pagamento|payment.?link/i, resource: 'paymentlink' },
  { pattern: /checkout|p[aá]gina.?pagamento/i, resource: 'checkout' },
  { pattern: /token|tokeniza|salvar.?cart[aã]o/i, resource: 'token' },
  { pattern: /sandbox|teste|homologa/i, resource: 'sandbox' },
  { pattern: /antecipa[çc][aã]o|antecipar|receb[íi]vel/i, resource: 'anticipation' },
  { pattern: /chargeback|disputa|contesta[çc][aã]o/i, resource: 'chargeback' },
];

// Mapa de endpoints oficiais da API Asaas
const ENDPOINT_MAP: Record<ResourceType, string[]> = {
  customer: ['/customers', '/customers/{id}'],
  payment: ['/payments', '/payments/{id}', '/payments/{id}/status'],
  subscription: ['/subscriptions', '/subscriptions/{id}', '/subscriptions/{id}/payments'],
  invoice: ['/invoices', '/invoices/{id}'],
  pix: ['/payments', '/pix/qrCodes', '/pix/transactions'],
  boleto: ['/payments', '/payments/{id}/identificationField'],
  creditcard: ['/payments', '/creditCard/tokenize'],
  webhook: ['/webhook', '/webhook/settings'],
  transfer: ['/transfers', '/transfers/{id}'],
  notification: ['/notifications', '/customers/{id}/notifications'],
  installment: ['/installments', '/installments/{id}'],
  refund: ['/payments/{id}/refund'],
  split: ['/payments', '/transfers'],
  subaccount: ['/accounts', '/accounts/{id}'],
  paymentlink: ['/paymentLinks', '/paymentLinks/{id}'],
  checkout: ['/paymentCheckoutConfigs', '/paymentCheckoutConfigs/{id}'],
  token: ['/creditCard/tokenize'],
  sandbox: ['/customers', '/payments'],
  anticipation: ['/anticipations', '/anticipations/{id}', '/anticipations/simulate'],
  chargeback: ['/chargebacks', '/payments/{id}/chargebacks'],
  unknown: [],
};

// Mapa de URLs de documentação por recurso
// IMPORTANTE: Usar apenas URLs de https://docs.asaas.com/docs/ ou https://docs.asaas.com/reference/
const DOC_URL_MAP: Record<ResourceType, string[]> = {
  customer: [
    'https://docs.asaas.com/docs/clientes',
    'https://docs.asaas.com/docs/criando-um-cliente',
    'https://docs.asaas.com/reference/criar-novo-cliente',
    'https://docs.asaas.com/reference/listar-clientes',
  ],
  payment: [
    'https://docs.asaas.com/docs/cobrancas',
    'https://docs.asaas.com/docs/criando-uma-cobranca',
    'https://docs.asaas.com/reference/criar-nova-cobranca',
    'https://docs.asaas.com/reference/listar-cobrancas',
  ],
  subscription: [
    'https://docs.asaas.com/docs/assinaturas-recorrencia',
    'https://docs.asaas.com/docs/criando-uma-assinatura',
    'https://docs.asaas.com/reference/criar-nova-assinatura',
    'https://docs.asaas.com/reference/listar-assinaturas',
  ],
  invoice: [
    'https://docs.asaas.com/docs/notas-fiscais',
    'https://docs.asaas.com/docs/emitindo-nota-fiscal',
    'https://docs.asaas.com/reference/emitir-nota-fiscal',
    'https://docs.asaas.com/reference/listar-notas-fiscais',
  ],
  pix: [
    'https://docs.asaas.com/docs/pix',
    'https://docs.asaas.com/docs/qr-code-estatico',
    'https://docs.asaas.com/docs/qr-code-dinamico',
    'https://docs.asaas.com/reference/obter-qr-code-pix',
  ],
  boleto: [
    'https://docs.asaas.com/docs/cobrancas-via-boleto',
    'https://docs.asaas.com/reference/criar-nova-cobranca',
  ],
  creditcard: [
    'https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito',
    'https://docs.asaas.com/docs/tokenizacao',
    'https://docs.asaas.com/reference/tokenizar-cartao',
  ],
  webhook: [
    'https://docs.asaas.com/docs/webhooks',
    'https://docs.asaas.com/docs/sobre-os-webhooks',
    'https://docs.asaas.com/docs/eventos-de-webhooks',
    'https://docs.asaas.com/reference/criar-novo-webhook',
  ],
  transfer: [
    'https://docs.asaas.com/docs/transferencias',
    'https://docs.asaas.com/docs/transferencia-pix',
    'https://docs.asaas.com/reference/criar-transferencia',
    'https://docs.asaas.com/reference/listar-transferencias',
  ],
  notification: [
    'https://docs.asaas.com/docs/notificacoes',
    'https://docs.asaas.com/docs/configurando-notificacoes',
  ],
  installment: [
    'https://docs.asaas.com/docs/parcelamentos',
    'https://docs.asaas.com/docs/criando-cobranca-parcelada',
    'https://docs.asaas.com/reference/criar-parcelamento',
  ],
  refund: [
    'https://docs.asaas.com/docs/estornos',
    'https://docs.asaas.com/docs/estorno-de-cobranca',
    'https://docs.asaas.com/reference/estornar-cobranca',
  ],
  split: [
    'https://docs.asaas.com/docs/split-de-pagamento',
    'https://docs.asaas.com/docs/split-em-cobrancas',
    'https://docs.asaas.com/docs/split-em-assinaturas',
  ],
  subaccount: [
    'https://docs.asaas.com/docs/subcontas',
    'https://docs.asaas.com/docs/criando-subcontas',
    'https://docs.asaas.com/reference/criar-subconta',
  ],
  paymentlink: [
    'https://docs.asaas.com/docs/link-de-pagamento',
    'https://docs.asaas.com/docs/criando-link-de-pagamento',
    'https://docs.asaas.com/reference/criar-link-de-pagamento',
  ],
  checkout: [
    'https://docs.asaas.com/docs/asaas-checkout',
    'https://docs.asaas.com/docs/checkout-transparente',
  ],
  token: [
    'https://docs.asaas.com/docs/tokenizacao',
    'https://docs.asaas.com/docs/tokenizacao-de-cartao',
    'https://docs.asaas.com/reference/tokenizar-cartao',
  ],
  sandbox: [
    'https://docs.asaas.com/docs/sandbox',
    'https://docs.asaas.com/docs/configurando-sandbox',
    'https://docs.asaas.com/docs/cartoes-de-teste',
  ],
  anticipation: [
    'https://docs.asaas.com/docs/antecipacoes',
    'https://docs.asaas.com/docs/solicitando-antecipacao',
    'https://docs.asaas.com/reference/simular-antecipacao',
    'https://docs.asaas.com/reference/solicitar-antecipacao',
  ],
  chargeback: [
    'https://docs.asaas.com/docs/chargeback',
  ],
  unknown: ['https://docs.asaas.com/docs/visao-geral'],
};

export function parseUserIntent(query: string): ParsedIntent {
  const normalizedQuery = query.toLowerCase().trim();

  // Detectar tipo de intenção
  let intentType: IntentType = 'explain';
  for (const { pattern, type } of INTENT_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      intentType = type;
      break;
    }
  }

  // Detectar recursos mencionados
  const resources: ResourceType[] = [];
  for (const { pattern, resource } of RESOURCE_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      resources.push(resource);
    }
  }
  if (resources.length === 0) {
    resources.push('unknown');
  }

  // Extrair palavras-chave relevantes
  const keywords = extractKeywords(normalizedQuery);

  // Determinar flags de resposta
  const isQuestion = /\?|como|what|how|por que|porque|quando|where|onde/.test(normalizedQuery);
  const needsImplementation = /implementar|implement|desenvolver|codar|criar|feature|api|endpoint|route|handler/.test(normalizedQuery);
  const needsExamples = /exemplo|example|sample|c[oó]digo|code|mostrar|show|snippet/.test(normalizedQuery);
  const needsTroubleshooting = /resolver|problema|erro|fix|debug|corrigir|falha|n[aã]o funciona|bug|status/.test(normalizedQuery);

  // Construir termos de busca otimizados para a documentação
  const searchTerms = buildSearchTerms(intentType, resources, keywords);

  // Obter endpoints sugeridos
  const suggestedEndpoints = resources.flatMap(r => ENDPOINT_MAP[r] || []);

  // Obter URLs de documentação sugeridas
  const suggestedDocs = resources.flatMap(r => DOC_URL_MAP[r] || []);

  return {
    type: intentType,
    resources,
    keywords,
    isQuestion,
    needsImplementation,
    needsExamples,
    needsTroubleshooting,
    originalQuery: query,
    searchTerms,
    suggestedEndpoints: [...new Set(suggestedEndpoints)],
    suggestedDocs: [...new Set(suggestedDocs)],
  };
}

function extractKeywords(query: string): string[] {
  const stopwords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos',
    'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem',
    'que', 'e', 'ou', 'mas', 'se', 'como', 'quando', 'onde',
    'minha', 'meu', 'sua', 'seu', 'nosso', 'nossa',
    'gostaria', 'quero', 'preciso', 'tenho', 'fazer', 'ter',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'shall',
    'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about',
    'into', 'over', 'after', 'beneath', 'under', 'above',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\sáéíóúâêîôûãõç]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopwords.has(word));
}

function buildSearchTerms(intent: IntentType, resources: ResourceType[], keywords: string[]): string[] {
  const terms: string[] = [];

  // Adicionar termos baseados no recurso
  const resourceTermMap: Record<ResourceType, string[]> = {
    customer: ['customer', 'cliente', 'customers', 'clientes', 'cpfCnpj', 'email', 'name'],
    payment: ['payment', 'cobrança', 'payments', 'cobranças', 'billingType', 'dueDate', 'value'],
    subscription: ['subscription', 'assinatura', 'recorrente', 'cycle', 'nextDueDate', 'billingType'],
    invoice: ['invoice', 'fatura', 'nota fiscal', 'nfse', 'effectiveDate'],
    pix: ['pix', 'qrcode', 'chave pix', 'pixQrCode', 'pixCopiaECola', 'payload'],
    boleto: ['boleto', 'bankslip', 'dueDate', 'identificationField', 'nossoNumero'],
    creditcard: ['creditCard', 'cartão', 'credit card', 'creditCardToken', 'creditCardNumber'],
    webhook: ['webhook', 'notification', 'event', 'callback', 'url', 'syncType'],
    transfer: ['transfer', 'transferência', 'bankAccount', 'pixAddressKey', 'operationType'],
    notification: ['notification', 'notificação', 'email', 'sms', 'whatsapp'],
    installment: ['installment', 'parcela', 'installmentCount', 'installmentValue'],
    refund: ['refund', 'estorno', 'reembolso', 'value', 'description'],
    split: ['split', 'repasse', 'walletId', 'fixedValue', 'percentualValue'],
    subaccount: ['account', 'subconta', 'white label', 'cpfCnpj', 'companyType'],
    paymentlink: ['paymentLink', 'link pagamento', 'name', 'billingType', 'chargeType'],
    checkout: ['checkout', 'checkoutConfig', 'transparente', 'logo', 'primaryColor'],
    token: ['token', 'creditCardToken', 'tokenize', 'creditCardNumber', 'creditCardCcv'],
    sandbox: ['sandbox', 'teste', 'homologação', 'api-sandbox'],
    anticipation: ['anticipation', 'antecipação', 'receivables', 'requestDate'],
    chargeback: ['chargeback', 'disputa', 'contestação', 'status', 'reason'],
    unknown: [],
  };

  for (const resource of resources) {
    terms.push(...resourceTermMap[resource]);
  }

  // Adicionar termos baseados na intenção
  const intentTermMap: Record<IntentType, string[]> = {
    create: ['POST', 'criar', 'create', 'novo', 'cadastrar'],
    list: ['GET', 'listar', 'list', 'buscar', 'consultar'],
    update: ['PUT', 'PATCH', 'atualizar', 'update', 'alterar'],
    delete: ['DELETE', 'remover', 'cancelar', 'excluir'],
    sync: ['sincronizar', 'integrar', 'API', 'batch'],
    webhook: ['webhook', 'notification', 'event', 'callback', 'url'],
    troubleshoot: ['error', 'erro', 'status', 'response', 'code'],
    explain: ['como', 'what', 'how', 'funciona'],
    implement: ['endpoint', 'route', 'handler', 'service', 'api'],
    bestpractices: ['boas práticas', 'recomendação', 'segurança', 'performance'],
    tokenize: ['token', 'tokenizar', 'salvar cartão', 'creditCardToken'],
    checkout: ['checkout', 'página', 'transparente', 'hosted'],
    sandbox: ['sandbox', 'teste', 'homologação', 'ambiente'],
  };

  terms.push(...intentTermMap[intent]);

  // Adicionar keywords específicas
  terms.push(...keywords.slice(0, 5));

  // Remover duplicatas
  return [...new Set(terms)];
}

export function getResourceEndpoint(resource: ResourceType): string {
  const endpointMap: Record<ResourceType, string> = {
    customer: '/customers',
    payment: '/payments',
    subscription: '/subscriptions',
    invoice: '/invoices',
    pix: '/payments',
    boleto: '/payments',
    creditcard: '/payments',
    webhook: '/webhook',
    transfer: '/transfers',
    notification: '/notifications',
    installment: '/installments',
    refund: '/payments/{id}/refund',
    split: '/payments',
    subaccount: '/accounts',
    paymentlink: '/paymentLinks',
    checkout: '/paymentCheckoutConfigs',
    token: '/creditCard/tokenize',
    sandbox: '/payments',
    anticipation: '/anticipations',
    chargeback: '/chargebacks',
    unknown: '',
  };
  return endpointMap[resource];
}

export function getResourceDocSection(resource: ResourceType): string {
  const sectionMap: Record<ResourceType, string> = {
    customer: 'Clientes',
    payment: 'Cobranças',
    subscription: 'Assinaturas',
    invoice: 'Notas Fiscais',
    pix: 'Cobranças PIX',
    boleto: 'Cobranças Boleto',
    creditcard: 'Cobranças Cartão',
    webhook: 'Webhooks',
    transfer: 'Transferências',
    notification: 'Notificações',
    installment: 'Parcelamento',
    refund: 'Estornos',
    split: 'Split de Pagamentos',
    subaccount: 'Subcontas',
    paymentlink: 'Link de Pagamento',
    checkout: 'Checkout',
    token: 'Tokenização',
    sandbox: 'Sandbox',
    anticipation: 'Antecipação',
    chargeback: 'Chargeback',
    unknown: 'Documentação',
  };
  return sectionMap[resource];
}

/**
 * Obtém URLs de documentação sugeridas para um recurso
 */
export function getResourceDocUrls(resource: ResourceType): string[] {
  return DOC_URL_MAP[resource] || [];
}

/**
 * Obtém endpoints sugeridos para um recurso
 */
export function getResourceEndpoints(resource: ResourceType): string[] {
  return ENDPOINT_MAP[resource] || [];
}
