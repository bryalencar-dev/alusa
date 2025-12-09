import crypto from 'node:crypto';
import { load, type CheerioAPI } from 'cheerio';
import type { DocRecord, FetchDocResult } from './doc-types.js';

interface FetchDocOptions {
  parentUrl?: string | null;
  depth: number;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

// Domínio oficial (único permitido)
const DOC_HOST = 'docs.asaas.com';

// Bases válidas de navegação
const VALID_DOC_BASE = 'https://docs.asaas.com/docs/';
const VALID_REF_BASE = 'https://docs.asaas.com/reference/';

// Regex definitiva para URLs reais do Asaas Docs (sem queries/fragments, sem suffix .md)
// Aceita apenas docs/ ou reference/ com slugs alfanuméricos, hífen ou percent-encode
const ASAAS_URL_REGEX = /^https?:\/\/docs\.asaas\.com\/(?:docs|reference)\/[A-Za-z0-9_%\-]+$/;

// Padrões inválidos conhecidos (Mintlify/estáticos que geram 404)
const INVALID_PATH_KEYWORDS = [
  '/page/',
  '/tag/',
  '/categories/',
  '/assets/',
  '/_next/',
  '/static/',
  '/scripts/',
  '/changelog',
  '/breaking-changes',
  '/sugestoes',
];

const MAX_LINKS_PER_PAGE = 40;

// Padrões que indicam página não encontrada ou erro
const NOT_FOUND_PATTERNS = [
  /page\s*not\s*found/i,
  /404\s*not\s*found/i,
  /página\s*não\s*encontrada/i,
  /conteúdo\s*não\s*encontrado/i,
  /this\s*page\s*doesn.*exist/i,
];

// Conteúdo mínimo para considerar página válida
const MIN_CONTENT_LENGTH = 100;

/**
 * Verifica se uma URL é acessível (HEAD request rápido)
 * Retorna true se a URL existe e não é uma página de erro
 */
export async function isUrlAccessible(url: string, timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Alusa-Asaas-MCP/1.0 (+https://github.com/bryalencar-dev/alusa)',
      },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDocFromWeb(url: string, options: FetchDocOptions): Promise<FetchDocResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Alusa-Asaas-MCP/1.0 (+https://github.com/bryalencar-dev/alusa)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Falha ao acessar ${url} (HTTP ${response.status})`);
    }

    const html = await response.text();
    const $ = load(html);

    // Detectar páginas de erro mesmo com HTTP 200
    const pageText = $('body').text();
    const isNotFoundPage = NOT_FOUND_PATTERNS.some(pattern => pattern.test(pageText));
    if (isNotFoundPage) {
      throw new Error(`Página não encontrada: ${url}`);
    }

    const headings: string[] = [];
    $('h1, h2, h3, h4, h5').each((_, element) => {
      const text = normalizeWhitespace($(element).text());
      if (text) headings.push(text);
    });

    const bodyChunks: string[] = [];
    $('p, li, td').each((_, element) => {
      const text = normalizeWhitespace($(element).text());
      if (text) bodyChunks.push(text);
    });

    const codeSamples: string[] = [];
    $('pre code').each((_, element) => {
      const text = normalizeWhitespace($(element).text());
      if (text) codeSamples.push(text.slice(0, 4000));
    });

    const links = collectLinks($, url);
    const primaryTitle = headings[0] || normalizeWhitespace($('title').first().text()) || url;
    const content = bodyChunks.join('\n');

    // Validar se a página tem conteúdo suficiente
    if (content.length < MIN_CONTENT_LENGTH && codeSamples.length === 0) {
      throw new Error(`Conteúdo insuficiente em ${url} (${content.length} chars)`);
    }

    const hash = crypto
      .createHash('sha256')
      .update(`${primaryTitle}\n${content}`)
      .digest('hex');

    const record: DocRecord = {
      url,
      title: primaryTitle,
      headings,
      content,
      codeSamples,
      metadata: {
        depth: options.depth,
        discoveredFrom: options.parentUrl ?? null,
        hash,
      },
      collectedAt: new Date().toISOString(),
    };

    return {
      record,
      links: links.slice(0, MAX_LINKS_PER_PAGE),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function collectLinks($: CheerioAPI, baseUrl: string): string[] {
  const linkSet = new Set<string>();
  $('a[href]').each((_, element) => {
    const resolved = resolveLink(baseUrl, $(element).attr('href'));
    if (resolved) linkSet.add(resolved);
  });
  return Array.from(linkSet);
}

function resolveLink(baseUrl: string, href?: string | null): string | null {
  if (!href) return null;
  if (href.startsWith('#')) return null;
  try {
    const resolved = new URL(href, baseUrl);

    // Validar hostname
    if (resolved.hostname !== DOC_HOST) return null;

    // Remover hash e query params desnecessários
    resolved.hash = '';
    resolved.search = '';

    const urlStr = resolved.toString();

    // Bloquear caminhos conhecidos inválidos
    if (INVALID_PATH_KEYWORDS.some((kw) => urlStr.includes(kw))) return null;

    // Validar formato final permitido
    if (!ASAAS_URL_REGEX.test(urlStr)) return null;

    // Rejeitar URLs que parecem ser endpoints de API
    if (urlStr.includes('/api/') || urlStr.includes('/v3/')) return null;

    return urlStr;
  } catch {
    return null;
  }
}

/**
 * Verifica se uma URL é válida para indexação
 */
export function isValidDocUrl(url: string): boolean {
  return ASAAS_URL_REGEX.test(url);
}
