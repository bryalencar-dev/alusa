/**
 * Fontes oficiais da documentação do Asaas
 * 
 * IMPORTANTE: Apenas URLs do domínio https://docs.asaas.com/docs/ ou https://docs.asaas.com/reference/
 * Nunca usar URLs de API (www.asaas.com/api, asaas.com/api/v3, etc.)
 */

// URLs base válidas para indexação
export const VALID_DOC_PREFIXES = [
  'https://docs.asaas.com/docs/',
  'https://docs.asaas.com/reference/',
];

export const ASAAS_DOC_SOURCES = [
  'https://docs.asaas.com/docs/visao-geral',
  'https://docs.asaas.com/docs/welcome-to-asaas',
  'https://docs.asaas.com/reference/comece-por-aqui',
];

/**
 * URLs de documentação por tópico específico
 * Use para busca direcionada por recurso
 */
export const ASAAS_TOPIC_URLS: Record<string, string[]> = {
  customer: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  payment: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  subscription: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  pix: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  webhook: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  transfer: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  split: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  refund: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  anticipation: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  subaccount: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  token: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  paymentlink: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  checkout: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  invoice: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
  sandbox: [
    'https://docs.asaas.com/reference/comece-por-aqui',
  ],
};

/**
 * Verifica se uma URL é válida para indexação
 */
export function isValidAsaasDocUrl(url: string): boolean {
  return VALID_DOC_PREFIXES.some(prefix => url.startsWith(prefix));
}
