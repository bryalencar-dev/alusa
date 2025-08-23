import { randomUUID } from 'crypto';

interface LogMeta {
  requestId?: string;
  userId?: string;
  [k: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function base(meta: LogMeta = {}) {
  return {
    ts: new Date().toISOString(),
    requestId: meta.requestId,
    userId: meta.userId,
    ...meta
  };
}

export function logInfo(message: string, meta: LogMeta = {}) {
  const payload = { level: 'info', message, ...base(meta) };
  console.log(JSON.stringify(payload));
}

export function logError(message: string, meta: LogMeta = {}) {
  const payload = { level: 'error', message, ...base(meta) };
  console.error(JSON.stringify(payload));
}

export function withRequest<T>(fn: (ctx: { requestId: string }) => T, requestId?: string) {
  const rid = requestId || randomUUID();
  return fn({ requestId: rid });
}
