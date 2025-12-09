import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { DocManager } from '../lib/doc-manager.js';
import type { DocRecord } from '../lib/doc-types.js';

const fakeRecords: DocRecord[] = [
  {
    url: 'https://docs.asaas.com/reference/cobrancas',
    title: 'Cobranças via PIX',
    headings: ['Cobranças', 'PIX', 'Campos obrigatórios'],
    content:
      'Use o endpoint de cobranças para gerar boletos, PIX e cartão. Informe customer, value e dueDate. PIX suporta pagamento instantâneo.',
    codeSamples: ['curl https://www.asaas.com/api/v3/payments -d "billingType=PIX"'],
    metadata: {
      depth: 0,
      discoveredFrom: null,
      hash: 'hash-1',
    },
    collectedAt: new Date().toISOString(),
  },
  {
    url: 'https://docs.asaas.com/reference/webhooks',
    title: 'Webhooks oficiais',
    headings: ['Webhooks', 'Eventos', 'Assinaturas'],
    content:
      'Configure webhooks para receber eventos de payment.created e payment.updated. Forneça uma URL HTTPS e valide o signature.',
    codeSamples: ['app.post("/webhook", verifySignature, handleEvent);'],
    metadata: {
      depth: 1,
      discoveredFrom: 'https://docs.asaas.com/',
      hash: 'hash-2',
    },
    collectedAt: new Date().toISOString(),
  },
];

const manager = new DocManager({
  cachePath: path.resolve('mcp/asaas/cache/test-docs.json'),
  sources: [],
  initialRecords: fakeRecords,
  useMemoryOnly: true,
});

test('search ranks docs por relevância', () => {
  const results = manager.search('cobrança pix', 2);
  assert.ok(results.length >= 1);
  assert.equal(results[0].url, fakeRecords[0].url);
  if (results[1]) {
    assert.ok(results[0].score >= results[1].score);
  }
  assert.match(results[0].snippet.toLowerCase(), /pix/);
});

test('code sample helper limita resultado', () => {
  const samples = manager.getCodeSamples('webhook evento', 1);
  assert.equal(samples.length, 1);
  assert.match(samples[0], /webhook/i);
});
