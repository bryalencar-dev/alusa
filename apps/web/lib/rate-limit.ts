type Bucket = { count: number; expiresAt: number };

const g = globalThis as unknown as { __rateLimit?: Map<string, Bucket> };
if (!g.__rateLimit) g.__rateLimit = new Map();
const store = g.__rateLimit;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.expiresAt <= now) {
    const expiresAt = now + windowMs;
    store.set(key, { count: 1, expiresAt });
    return { ok: true, remaining: Math.max(0, limit - 1), resetAt: expiresAt };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetAt: bucket.expiresAt };
  }
  bucket.count += 1;
  return { ok: true, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.expiresAt };
}

export function ipFromRequest(req: Request): string {
  try {
    // Em produção, confiar em X-Forwarded-For (primeiro IP)
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
  } catch { /* noop */ }
  // Fallback: sem acesso ao IP direto no edge; usar user-agent + accept-lang como aproximação
  const ua = req.headers.get('user-agent') || 'ua';
  const al = req.headers.get('accept-language') || 'al';
  return `ua:${ua}|al:${al}`;
}
