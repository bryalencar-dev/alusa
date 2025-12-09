import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchDocFromWeb, isUrlAccessible, isValidDocUrl } from './doc-fetcher.js';
import { isValidAsaasDocUrl } from './doc-sources.js';
import type { DocRecord, DocCacheFile, DocSearchResult } from './doc-types.js';

export interface DocManagerOptions {
  cachePath: string;
  sources: string[];
  maxDepth?: number;
  maxPages?: number;
  autoRefreshHours?: number;
  initialRecords?: DocRecord[];
  useMemoryOnly?: boolean;
}

interface InitOptions {
  forceRefresh?: boolean;
}

export interface RefreshResult {
  processed: number;
  errors: string[];
}

const CACHE_VERSION = '1.0.0';
const DEFAULT_MAX_DEPTH = 2;
const DEFAULT_MAX_PAGES = 120;
const DEFAULT_AUTO_REFRESH_HOURS = 6;

export class DocManager {
  #records: DocRecord[] = [];
  #cachePath: string;
  #sources: string[];
  #maxDepth: number;
  #maxPages: number;
  #autoRefreshHours: number;
  #lastUpdated: string | null = null;
  #memoryOnly: boolean;

  constructor(options: DocManagerOptions) {
    this.#cachePath = options.cachePath;
    this.#sources = options.sources;
    this.#maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
    this.#maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
    this.#autoRefreshHours = options.autoRefreshHours ?? DEFAULT_AUTO_REFRESH_HOURS;
    this.#memoryOnly = Boolean(options.useMemoryOnly);
    if (options.initialRecords?.length) {
      this.#records = options.initialRecords;
      this.#lastUpdated = new Date().toISOString();
    }
    if (options.initialRecords && options.useMemoryOnly === undefined) {
      this.#memoryOnly = true;
    }
  }

  get lastUpdated(): string | null {
    return this.#lastUpdated;
  }

  get recordCount(): number {
    return this.#records.length;
  }

  async initialize(options: InitOptions = {}): Promise<void> {
    if (this.#memoryOnly) {
      return;
    }

    await this.ensureCacheDir();
    await this.loadCacheFromDisk();

    if (options.forceRefresh || this.needsAutoRefresh()) {
      await this.refresh();
    }
  }

  async refresh(): Promise<RefreshResult> {
    if (this.#memoryOnly) {
      return { processed: this.#records.length, errors: [] };
    }

    // Filtrar apenas URLs válidas da lista de fontes e que respondem 2xx
    const validSources = this.#sources.filter(url => isValidAsaasDocUrl(url));
    const accessibleSources = await filterAccessible(validSources);
    
    const queue: Array<{ url: string; depth: number; parent?: string | null }> = accessibleSources.map(
      (url) => ({ url, depth: 0, parent: null })
    );
    const visited = new Set<string>();
    const invalidUrls = new Set<string>();
    const aggregated: DocRecord[] = [];
    const errors: string[] = [];

    console.error(`[asaas-mcp] Iniciando indexação de ${validSources.length} URLs válidas...`);

    while (queue.length > 0 && aggregated.length < this.#maxPages) {
      const current = queue.shift()!;
      
      // Validar URL antes de processar
      if (!isValidAsaasDocUrl(current.url) && !isValidDocUrl(current.url)) {
        invalidUrls.add(current.url);
        continue;
      }
      
      if (visited.has(current.url) || invalidUrls.has(current.url)) continue;

      try {
        const { record, links } = await fetchDocFromWeb(current.url, {
          depth: current.depth,
          parentUrl: current.parent,
        });

        aggregated.push(record);
        visited.add(current.url);

        if (current.depth < this.#maxDepth) {
          for (const link of links) {
            // Validar cada link antes de adicionar à fila
            if (!isValidAsaasDocUrl(link)) continue;
            if (visited.has(link)) continue;
            if (invalidUrls.has(link)) continue;
            if (queue.find((entry) => entry.url === link)) continue;
            const accessible = await isUrlAccessible(link, 4000);
            if (!accessible) {
              invalidUrls.add(link);
              continue;
            }
            queue.push({ url: link, depth: current.depth + 1, parent: current.url });
          }
        }
      } catch (error) {
        const errorMsg = (error as Error).message;
        errors.push(`${current.url}: ${errorMsg}`);
        invalidUrls.add(current.url);
        
        // Log apenas erros não esperados (não 404)
        if (!errorMsg.includes('não encontrada') && !errorMsg.includes('insuficiente')) {
          console.error(`[asaas-mcp] Erro ao processar ${current.url}: ${errorMsg}`);
        }
      }
    }

    this.#records = dedupeRecords(aggregated);
    this.#lastUpdated = new Date().toISOString();
    await this.saveCacheToDisk();

    // Log resumo
    console.error(`[asaas-mcp] Indexação concluída: ${this.#records.length} páginas válidas`);
    if (invalidUrls.size > 0) {
      console.error(`[asaas-mcp] ${invalidUrls.size} URLs inválidas ignoradas`);
    }

    return {
      processed: this.#records.length,
      errors,
    };
  }

  search(query: string, limit = 6): DocSearchResult[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
      return [];
    }

    return this.#records
      .map((record) => ({ record, score: scoreRecord(record, tokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => ({
        url: entry.record.url,
        title: entry.record.title,
        snippet: buildSnippet(entry.record.content, tokens),
        score: Number(entry.score.toFixed(3)),
        headings: entry.record.headings.slice(0, 6),
      }));
  }

  getCodeSamples(query: string, limit = 3): string[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) {
      return [];
    }

    const samples: string[] = [];
    for (const record of this.#records) {
      if (!record.codeSamples.length) continue;
      const haystack = `${record.content}\n${record.codeSamples.join('\n')}`.toLowerCase();
      if (tokens.some((token) => haystack.includes(token))) {
        samples.push(...record.codeSamples);
      }
      if (samples.length >= limit) break;
    }

    return samples.slice(0, limit);
  }

  getSummary() {
    return {
      records: this.#records.length,
      lastUpdated: this.#lastUpdated,
      autoRefreshHours: this.#autoRefreshHours,
      cachePath: this.#cachePath,
      sources: this.#sources,
    };
  }

  private async ensureCacheDir() {
    const dir = path.dirname(this.#cachePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async loadCacheFromDisk() {
    try {
      const buffer = await fs.readFile(this.#cachePath, 'utf8');
      const parsed = JSON.parse(buffer) as DocCacheFile;
      if (parsed.version !== CACHE_VERSION) {
        return;
      }
      // Filtrar qualquer registro antigo que não seja de docs/reference oficiais
      const filtered = parsed.records.filter((record) => isValidAsaasDocUrl(record.url) || isValidDocUrl(record.url));
      this.#records = filtered;
      this.#lastUpdated = parsed.lastUpdated;
      if (filtered.length !== parsed.records.length) {
        console.warn(`[asaas-mcp] Removidos ${parsed.records.length - filtered.length} registros com URLs fora de docs/reference`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[asaas-mcp] Falha ao carregar cache das docs', error);
      }
    }
  }

  private async saveCacheToDisk() {
    const payload: DocCacheFile = {
      version: CACHE_VERSION,
      lastUpdated: this.#lastUpdated ?? new Date().toISOString(),
      records: this.#records,
    };
    await fs.writeFile(this.#cachePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  private needsAutoRefresh(): boolean {
    if (!this.#lastUpdated) return true;
    const last = new Date(this.#lastUpdated).getTime();
    const diffHours = (Date.now() - last) / (1000 * 60 * 60);
    return diffHours >= this.#autoRefreshHours;
  }
}

function dedupeRecords(records: DocRecord[]): DocRecord[] {
  const map = new Map<string, DocRecord>();
  for (const record of records) {
    const existing = map.get(record.url);
    if (!existing || existing.metadata.hash !== record.metadata.hash) {
      map.set(record.url, record);
    }
  }
  return Array.from(map.values());
}

async function filterAccessible(urls: string[], timeoutMs = 5000): Promise<string[]> {
  const results = await Promise.all(
    urls.map(async (url) => ({ url, ok: await isUrlAccessible(url, timeoutMs) }))
  );
  return results.filter((item) => item.ok).map((item) => item.url);
}

function tokenize(input: string): string[] {
  return stripAccents(input)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function scoreRecord(record: DocRecord, tokens: string[]): number {
  const title = normalizeForSearch(record.title);
  const headings = normalizeForSearch(record.headings.join(' '));
  const content = normalizeForSearch(record.content);
  const url = normalizeForSearch(record.url);

  // Termos técnicos do Asaas que devem ter mais peso
  const asaasTerms = new Set([
    'pix', 'boleto', 'customer', 'payment', 'subscription', 'webhook',
    'transfer', 'split', 'token', 'checkout', 'refund', 'anticipation',
    'chargeback', 'invoice', 'subconta', 'recorrente', 'parcelamento',
    'cartao', 'credito', 'qrcode', 'assinatura', 'cobranca', 'cliente',
    'api', 'endpoint', 'sandbox', 'producao', 'apikey', 'walletid'
  ]);

  let score = 0;
  for (const token of tokens) {
    // Boost para termos técnicos do Asaas
    const boost = asaasTerms.has(token) ? 1.5 : 1;

    if (title.includes(token)) score += 5 * boost;
    if (url.includes(token)) score += 4 * boost;
    if (headings.includes(token)) score += 3 * boost;
    if (content.includes(token)) score += 1 * boost;

    // Boost extra para match exato no título
    if (title === token || title.startsWith(token + ' ') || title.endsWith(' ' + token)) {
      score += 3;
    }
  }

  // Penalizar conteúdo muito curto
  if (content.length < 100) {
    score *= 0.5;
  }

  return score;
}

function buildSnippet(content: string, tokens: string[]): string {
  if (!content) return '';
  const { normalized, map } = createNormalizedIndex(content);

  for (const token of tokens) {
    const index = normalized.indexOf(token);
    if (index >= 0) {
      const startNorm = Math.max(0, index - 90);
      const endNorm = Math.min(normalized.length - 1, index + 180);
      const startOriginal = map[startNorm] ?? 0;
      const endOriginal = map[endNorm] ?? content.length;
      return `${content.slice(startOriginal, endOriginal + 1).trim()}...`;
    }
  }

  return content.slice(0, 180);
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function normalizeForSearch(value: string): string {
  return stripAccents(value).toLowerCase();
}

function createNormalizedIndex(value: string): { normalized: string; map: number[] } {
  let normalized = '';
  const map: number[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const normalizedChar = stripAccents(value[i]).toLowerCase();
    normalized += normalizedChar;
    for (let j = 0; j < normalizedChar.length; j += 1) {
      map.push(i);
    }
  }

  return { normalized, map };
}
