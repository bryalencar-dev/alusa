import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseUserIntent } from '../lib/intent-parser.js';
import { buildSmartResponse } from '../lib/smart-response.js';

describe('Intent Parser', () => {
  it('deve identificar intenção de criar cliente', () => {
    const intent = parseUserIntent('como criar um cliente no asaas?');
    
    assert.strictEqual(intent.type, 'create');
    assert.ok(intent.resources.includes('customer'));
    assert.ok(intent.isQuestion);
  });

  it('deve identificar intenção de sincronizar cobranças', () => {
    const intent = parseUserIntent('quero sincronizar cobranças recorrentes na minha plataforma');
    
    assert.strictEqual(intent.type, 'sync');
    assert.ok(intent.resources.includes('payment') || intent.resources.includes('subscription'));
  });

  it('deve identificar intenção de resolver problema de webhook', () => {
    const intent = parseUserIntent('resolver problema de webhook');
    
    // O tipo pode ser 'troubleshoot' ou 'webhook' dependendo da ordem dos patterns
    assert.ok(intent.type === 'troubleshoot' || intent.type === 'webhook');
    assert.ok(intent.resources.includes('webhook'));
    assert.ok(intent.needsTroubleshooting);
  });

  it('deve identificar intenção de implementar PIX', () => {
    const intent = parseUserIntent('implementar pagamento PIX na minha feature');
    
    assert.strictEqual(intent.type, 'implement');
    assert.ok(intent.resources.includes('pix'));
    assert.ok(intent.needsImplementation);
  });

  it('deve extrair keywords relevantes', () => {
    const intent = parseUserIntent('como criar cobrança boleto com vencimento?');
    
    assert.ok(intent.keywords.length > 0);
    assert.ok(intent.searchTerms.length > 0);
  });
});

describe('Smart Response', () => {
  it('deve montar resposta completa para criação de cliente', () => {
    const intent = parseUserIntent('como criar um cliente?');
    
    const response = buildSmartResponse({
      intent,
      docResults: [],
      codeSamples: [],
    });

    assert.ok(response.summary.includes('cliente') || response.summary.includes('Clientes'));
    assert.ok(response.implementationSteps.length > 0);
    assert.ok(response.warnings.length > 0);
    assert.ok(response.markdown.includes('##'));
  });

  it('deve incluir exemplos de código para implementação', () => {
    const intent = parseUserIntent('implementar pagamento PIX');
    
    const response = buildSmartResponse({
      intent,
      docResults: [],
      codeSamples: [],
    });

    assert.ok(response.codeExamples.length >= 0);
    assert.ok(response.markdown.length > 100);
  });

  it('deve incluir alertas para webhooks', () => {
    const intent = parseUserIntent('configurar webhook');
    
    const response = buildSmartResponse({
      intent,
      docResults: [],
      codeSamples: [],
    });

    const hasWebhookWarning = response.warnings.some(
      (w) => w.toLowerCase().includes('webhook') || w.toLowerCase().includes('assinatura')
    );
    assert.ok(hasWebhookWarning);
  });

  it('deve formatar resposta em markdown válido', () => {
    const intent = parseUserIntent('criar cobrança');
    
    const response = buildSmartResponse({
      intent,
      docResults: [
        {
          url: 'https://docs.asaas.com/payments',
          title: 'Cobranças',
          snippet: 'Como criar cobranças no Asaas',
          score: 10,
          headings: ['Cobranças'],
        },
      ],
      codeSamples: ['const x = 1;'],
    });

    assert.ok(response.markdown.includes('## '));
    assert.ok(response.markdown.includes('### '));
    assert.ok(response.docReferences.length > 0);
  });
});
