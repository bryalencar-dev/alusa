export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AsaasClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
}

export interface AsaasRequestOptions {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  idempotencyKey?: string;
}

export interface AsaasResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
  requestId?: string | null;
}

export class AsaasClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: unknown,
    public readonly requestId?: string | null
  ) {
    super(message);
    this.name = 'AsaasClientError';
  }
}

const DEFAULT_BASE_URL = 'https://www.asaas.com/api/v3';
const DEFAULT_TIMEOUT_MS = 20000;

export class AsaasClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(private readonly options: AsaasClientOptions) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async request<T = unknown>(options: AsaasRequestOptions): Promise<AsaasResponse<T>> {
    const url = this.buildUrl(options.path, options.query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      access_token: this.options.apiKey,
      ...this.defaultHeaders,
    };

    let body: BodyInit | undefined;
    if (options.body !== undefined && options.body !== null) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    if (options.idempotencyKey) {
      headers['x-idempotency-key'] = options.idempotencyKey;
    }

    try {
      const response = await fetch(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });

      const responseText = await response.text();
      const requestId = response.headers.get('request-id');
      const parsed = safeJsonParse(responseText);

      if (!response.ok) {
        throw new AsaasClientError(
          parsed?.errors?.[0]?.description || `Asaas retornou status ${response.status}`,
          response.status,
          parsed ?? responseText,
          requestId
        );
      }

      return {
        status: response.status,
        data: (parsed ?? {}) as T,
        headers: Object.fromEntries(response.headers.entries()),
        requestId,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(pathname: string, query?: AsaasRequestOptions['query']): string {
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const url = new URL(normalizedPath, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }
}

function safeJsonParse(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
