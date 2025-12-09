import type { DocSearchResult } from './doc-types.js';

export interface RecommendationInput {
  scenario: string;
  goals?: string[];
  docResults: DocSearchResult[];
  requestedExamples?: string[];
}

export interface ScenarioRecommendation {
  summary: string;
  steps: string[];
  docReferences: Array<{ title: string; url: string }>;
  codeExamples: string[];
}

export function buildRecommendations(input: RecommendationInput): ScenarioRecommendation {
  const normalizedScenario = input.scenario.toLowerCase();
  const steps: string[] = [];

  steps.push('Mapear o objetivo financeiro e validar os campos obrigatórios no schema gerado.');
  steps.push('Utilizar o client #asaas para validar payloads com Zod antes de chamar a API oficial.');

  if (normalizedScenario.includes('pix')) {
    steps.push('Definir billingType como PIX e validar expirations recomendadas pelo Asaas.');
    steps.push('Configurar webhooks de payment.confirmed para atualizar matrículas em tempo real.');
  }

  if (normalizedScenario.includes('webhook')) {
    steps.push('Criar endpoint dedicado com verificação de assinatura (asaas-signature).');
    steps.push('Persistir o histórico do webhook para conciliações e reprocessamentos.');
  }

  if (normalizedScenario.includes('assinatura') || normalizedScenario.includes('subscription')) {
    steps.push('Sincronizar planos e ciclos de cobrança antes de criar assinaturas.');
  }

  if (normalizedScenario.includes('concilia')) {
    steps.push('Agendar conciliações periódicas consultando /payments?status=RECEIVED.');
  }

  const docReferences = input.docResults.slice(0, 4).map((result) => ({
    title: result.title,
    url: result.url,
  }));

  const codeExamples = (input.requestedExamples?.length ? input.requestedExamples : []).slice(0, 3);

  return {
    summary: `Fluxo recomendado para ${input.scenario}`,
    steps,
    docReferences,
    codeExamples,
  };
}
