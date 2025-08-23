import { describe, it, expect } from 'vitest';
import { setCache, getCache } from '../cache';

describe('cache', () => {
  it('salva e recupera valor em memória', async () => {
    await setCache('k1', { a: 1 }, 1);
  const v = await getCache<{ a: number }>('k1');
  expect(v?.a).toBe(1);
  });
  it('expira após ttl', async () => {
    await setCache('k2', 123, 0); // ttl 0 => expira imediatamente (próxima leitura após tick)
    await new Promise(r=>setTimeout(r,5));
    const v = await getCache('k2');
    expect(v).toBe(null);
  });
});