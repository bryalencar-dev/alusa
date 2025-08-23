// Importa redis de forma resiliente: em ambiente de teste sem dependência instalada, usa mock leve
type CreateClientFn = () => RedisClientTypeImpl;
interface RedisClientTypeImpl {
  on(event: string, cb: (...args: unknown[]) => void): void;
  connect(): Promise<void>;
  set(key: string, value: string, opts: { EX: number }): Promise<void>;
  get(key: string): Promise<string | null>;
}
let createClient: CreateClientFn;
type RedisClientType = RedisClientTypeImpl | null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const redisPkg = require('redis');
  createClient = redisPkg.createClient;
} catch {
  createClient = () => ({
    on() { /* noop */ },
    async connect() { /* noop */ },
    async set() { /* noop */ },
    async get() { return null; }
  });
}

type CacheEntry = { value: unknown; expiresAt: number };
const memoryStore = new Map<string, CacheEntry>();
let redis: RedisClientType | null = null;
let redisInitPromise: Promise<void> | null = null;

function isRedisEnabled() {
  return !!process.env.REDIS_URL;
}

async function getRedis() {
  if (!isRedisEnabled()) return null;
  if (redis) return redis;
  if (!redisInitPromise) {
    redisInitPromise = (async () => {
  const client = createClient();
  redis = client;
  client.on('error', () => {});
  await client.connect();
    })();
  }
  await redisInitPromise;
  return redis;
}

export async function setCache(key: string, value: unknown, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  if (isRedisEnabled()) {
    const r = await getRedis();
    if (r) await r.set(key, JSON.stringify({ v: value, e: expiresAt }), { EX: ttlSeconds });
  } else {
    memoryStore.set(key, { value, expiresAt });
  }
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  if (isRedisEnabled()) {
    const r = await getRedis();
    if (r) {
      const raw = await r.get(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.e < Date.now()) return null;
        return parsed.v as T;
      } catch {
        return null;
      }
    }
    return null;
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value as T;
}

export function invalidateCache(keyPrefix: string) {
  for (const k of memoryStore.keys()) if (k.startsWith(keyPrefix)) memoryStore.delete(k);
  // (Redis) simplificado: operação scan poderia ser usada; omitido por simplicidade inicial.
}